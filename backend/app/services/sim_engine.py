"""Survey-mode simulation engine.

Fans out one LLM call per (persona × simulation), validates the JSON output
against a Pydantic schema, persists each agent response, and updates the
parent Simulation row's progress in real time. Phoenix tracing groups every
call by simulation_id and persona_id when the feature flag is on.
"""

from __future__ import annotations

import asyncio
import json
import logging
import time
from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field, ValidationError
from sqlalchemy.orm import Session
from tenacity import RetryError, retry, stop_after_attempt, wait_exponential

from app.config import get_settings
from app.db import SessionLocal
from app.models.audience import Audience
from app.models.persona import Persona
from app.models.product import Product
from app.models.simulation import AgentResponse, Simulation
from app.models.survey import Survey
from app.services.default_survey import DEFAULT_SURVEY_QUESTIONS
from app.services.openrouter import async_client, completion_route_for_model
from app.services.phoenix import trace_attributes

log = logging.getLogger(__name__)


class AgentSurveyResponse(BaseModel):
    """Structured LLM output for one persona answering the survey."""
    purchase_intent: int = Field(ge=1, le=5)
    sentiment: str  # positive|neutral|negative (validated post-hoc, loose to survive minor variance)
    top_concern: str
    top_positive: str
    would_recommend: str  # yes|no|maybe
    reasoning: str  # WHY they answered this way — referenced for the diverging-opinions panel


def _persona_block(p: Persona) -> str:
    attrs = p.attributes or {}
    extra: list[str] = []
    if cp := attrs.get("current_policies"):
        extra.append(f"Currently holds: {', '.join(cp) if isinstance(cp, list) else cp}")
    if fp := attrs.get("financial_priorities"):
        extra.append(
            "Financial priorities: "
            + (", ".join(fp) if isinstance(fp, list) else str(fp))
        )
    if kc := attrs.get("key_concerns"):
        extra.append("Key concerns: " + (", ".join(kc) if isinstance(kc, list) else str(kc)))
    if ls := attrs.get("life_stage"):
        extra.append(f"Life stage: {ls}")
    extras_str = "\n".join(f"- {e}" for e in extra) if extra else ""
    return (
        f"You ARE {p.name}, a {p.age}-year-old {p.occupation} in {p.region}.\n"
        f"Income: ${p.income:,}/yr · {p.marital_status} with {p.dependents} dependents.\n"
        f"Risk tolerance: {p.risk_tolerance} · Claims history: {p.claims_history}\n"
        + (extras_str + "\n" if extras_str else "")
        + (f"Background: {p.bio}\n" if p.bio else "")
    )


def _product_block(prod: Product) -> str:
    cfg_lines = "\n".join(f"  - {k}: {v}" for k, v in (prod.config or {}).items())
    return (
        f"NEW INSURANCE OFFER under evaluation:\n"
        f"Name: {prod.name}\n"
        f"Category: {prod.category} · Type: {prod.scenario_type}\n"
        f"Description: {prod.description}\n"
        + (f"Details:\n{cfg_lines}\n" if cfg_lines else "")
    )


def _question_block(questions: list[dict[str, Any]]) -> str:
    lines = []
    for q in questions:
        meta = ""
        if q["type"] == "likert":
            meta = f" (scale {q.get('scale_min', 1)}-{q.get('scale_max', 5)})"
        elif q["type"] == "multi_choice":
            meta = f" (choose: {', '.join(q.get('options', []))})"
        lines.append(f"- [{q['id']}] {q['prompt']}{meta}")
    return "\n".join(lines)


def _build_messages(p: Persona, prod: Product, questions: list[dict]) -> list[dict]:
    system = (
        "You roleplay as a specific insurance customer for product-testing surveys. "
        "Stay fully in character — speak in first person, reflect THIS person's age, "
        "income, family situation, and stated concerns. Do NOT be a generic consumer. "
        "Be honest: if the offer doesn't fit your life, say so plainly. Output STRICT JSON."
    )
    user = f"""{_persona_block(p)}
---
{_product_block(prod)}
---
Answer these questions AS THIS PERSON:
{_question_block(questions)}

Return ONLY this JSON shape:
{{
  "purchase_intent": <1-5 integer>,
  "sentiment": "positive" | "neutral" | "negative",
  "top_concern": "<one specific concern, in your voice>",
  "top_positive": "<what you'd actually like — or 'nothing' if true>",
  "would_recommend": "yes" | "no" | "maybe",
  "reasoning": "<2 sentences: WHY you answered this way, referencing your situation>"
}}"""
    return [
        {"role": "system", "content": system},
        {"role": "user", "content": user},
    ]


@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=8), reraise=True)
async def _ask_persona(p: Persona, prod: Product, questions: list[dict]) -> tuple[AgentSurveyResponse, dict[str, int]]:
    settings = get_settings()
    client = async_client()
    resp = await client.chat.completions.create(
        model=settings.openrouter_agent_model,
        messages=_build_messages(p, prod, questions),
        response_format={"type": "json_object"},
        temperature=settings.agent_temperature,
        timeout=settings.sim_timeout_seconds,
        extra_body=completion_route_for_model(settings.openrouter_agent_model),
    )
    content = resp.choices[0].message.content or "{}"
    data = json.loads(content)
    survey_response = AgentSurveyResponse.model_validate(data)
    usage = {
        "tokens_in": getattr(resp.usage, "prompt_tokens", 0) if resp.usage else 0,
        "tokens_out": getattr(resp.usage, "completion_tokens", 0) if resp.usage else 0,
    }
    return survey_response, usage


async def _run_one(
    sim_id: int,
    persona: Persona,
    product: Product,
    questions: list[dict],
) -> AgentResponse:
    start = time.perf_counter()
    row = AgentResponse(
        simulation_id=sim_id,
        persona_id=persona.id,
        response={},
        sentiment="neutral",
        purchase_intent=0,
    )
    with trace_attributes(
        session_id=str(sim_id),
        user_id=str(persona.id),
        metadata={"persona_name": persona.name, "product_id": product.id},
    ):
        try:
            answer, usage = await _ask_persona(persona, product, questions)
            row.response = answer.model_dump()
            row.sentiment = answer.sentiment if answer.sentiment in {"positive", "neutral", "negative"} else "neutral"
            row.purchase_intent = answer.purchase_intent
            row.tokens_in = usage["tokens_in"]
            row.tokens_out = usage["tokens_out"]
        except (ValidationError, json.JSONDecodeError, RetryError, Exception) as exc:
            log.warning("persona %d failed: %s", persona.id, exc)
            row.failed = True
            row.error = str(exc)[:512]
    row.latency_ms = int((time.perf_counter() - start) * 1000)
    return row


async def run_simulation(sim_id: int) -> None:
    """Driver: loads sim + audience + product + survey, fans out, persists progress."""
    settings = get_settings()
    db: Session = SessionLocal()
    try:
        sim = db.get(Simulation, sim_id)
        if not sim:
            log.error("Simulation %d not found", sim_id)
            return
        audience = db.get(Audience, sim.audience_id)
        product = db.get(Product, sim.product_id)
        if not audience or not product:
            sim.status = "failed"
            sim.error = "audience or product missing"
            db.commit()
            return

        questions = DEFAULT_SURVEY_QUESTIONS
        if sim.survey_id:
            survey = db.get(Survey, sim.survey_id)
            if survey and survey.questions:
                questions = survey.questions

        persona_ids = audience.persona_ids or []
        if not persona_ids:
            sim.status = "failed"
            sim.error = "audience has no personas"
            db.commit()
            return

        personas = db.query(Persona).filter(Persona.id.in_(persona_ids)).all()
        total = len(personas)
        sim.status = "running"
        sim.started_at = datetime.utcnow()
        sim.progress = 0.0
        db.commit()
        log.info("sim %d: running over %d personas", sim_id, total)

        sem = asyncio.Semaphore(settings.sim_concurrency)
        done = 0
        lock = asyncio.Lock()

        async def one(p: Persona):
            nonlocal done
            async with sem:
                row = await _run_one(sim_id, p, product, questions)
            # serialize DB writes
            async with lock:
                db.add(row)
                done += 1
                if done % 5 == 0 or done == total:
                    sim.progress = done / total
                    db.commit()

        await asyncio.gather(*(one(p) for p in personas), return_exceptions=True)

        sim.progress = 1.0
        sim.status = "completed"
        sim.completed_at = datetime.utcnow()
        db.commit()
        log.info("sim %d: completed (%d responses) — synthesizing insight", sim_id, total)

        # Auto-synthesize insight while sim is fresh; fail-soft so a synth error
        # doesn't mark the simulation itself as failed.
        try:
            from app.services.insights import synthesize_insight

            await synthesize_insight(db, sim_id)
        except Exception as exc:
            log.exception("auto-synthesis failed for sim %d: %s", sim_id, exc)
    except Exception as exc:
        log.exception("sim %d failed: %s", sim_id, exc)
        if sim:
            sim.status = "failed"
            sim.error = str(exc)[:512]
            db.commit()
    finally:
        db.close()
