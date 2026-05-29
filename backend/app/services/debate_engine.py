"""Focus-group debate mode.

Picks a small, diverse group of personas from the audience and runs a 3-round
discussion of the product:
  Round 1  — opening reactions (parallel)
  Round 2  — cross-talk: each persona reacts to what others said (sequential)
  Round 3  — final positions: yes / no / maybe + reasoning (sequential)

Each turn is persisted as an AgentResponse row with response = {round, message,
stance, addresses?}. The frontend polls/streams these rows in order and renders
them as a chat-style transcript.
"""

from __future__ import annotations

import asyncio
import json
import logging
import random
import time
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ValidationError
from sqlalchemy.orm import Session
from tenacity import retry, stop_after_attempt, wait_exponential

from app.config import get_settings
from app.db import SessionLocal
from app.models.audience import Audience
from app.models.persona import Persona
from app.models.product import Product
from app.models.simulation import AgentResponse, Simulation
from app.services.openrouter import async_client, completion_route_for_model
from app.services.phoenix import trace_attributes

log = logging.getLogger(__name__)

PARTICIPANT_COUNT = 5
ROUNDS = 3


class DebateTurn(BaseModel):
    message: str
    stance: str  # supportive | skeptical | curious | conflicted
    sentiment: str  # positive | neutral | negative


class FinalStance(BaseModel):
    message: str
    decision: str  # yes | no | maybe
    sentiment: str
    purchase_intent: int  # 1-5


def _stratified_sample(personas: list[Persona], k: int = PARTICIPANT_COUNT) -> list[Persona]:
    """Pick a diverse mix by risk tolerance, then top up if needed."""
    if len(personas) <= k:
        return personas
    by_risk: dict[str, list[Persona]] = {}
    for p in personas:
        by_risk.setdefault(p.risk_tolerance, []).append(p)
    selected: list[Persona] = []
    # Round-robin across risk buckets
    while len(selected) < k:
        added = False
        for bucket in list(by_risk.keys()):
            if by_risk[bucket]:
                selected.append(by_risk[bucket].pop(random.randrange(len(by_risk[bucket]))))
                added = True
                if len(selected) >= k:
                    break
        if not added:
            break
    return selected[:k]


def _persona_short(p: Persona) -> str:
    return (
        f"{p.name} ({p.age}y {p.occupation}, {p.region}, "
        f"income ${p.income:,}, risk={p.risk_tolerance})"
    )


def _persona_block(p: Persona) -> str:
    attrs = p.attributes or {}
    extra: list[str] = []
    if cp := attrs.get("current_policies"):
        extra.append(f"Currently holds: {', '.join(cp) if isinstance(cp, list) else cp}")
    if kc := attrs.get("key_concerns"):
        extra.append("Key concerns: " + (", ".join(kc) if isinstance(kc, list) else str(kc)))
    extras = "\n".join(f"- {e}" for e in extra) if extra else ""
    return (
        f"You ARE {p.name}, a {p.age}-year-old {p.occupation} in {p.region}.\n"
        f"Income: ${p.income:,}/yr · {p.marital_status} with {p.dependents} dependents.\n"
        f"Risk tolerance: {p.risk_tolerance} · Claims history: {p.claims_history}\n"
        + (extras + "\n" if extras else "")
        + (f"Background: {p.bio}\n" if p.bio else "")
    )


def _product_block(prod: Product) -> str:
    cfg_lines = "\n".join(f"  - {k}: {v}" for k, v in (prod.config or {}).items())
    return (
        f"Product being discussed: {prod.name}\n"
        f"Category: {prod.category}\n"
        f"Description: {prod.description}\n"
        + (f"Details:\n{cfg_lines}" if cfg_lines else "")
    )


@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=8), reraise=True)
async def _llm_call(messages: list[dict], schema_hint: str) -> str:
    settings = get_settings()
    client = async_client()
    resp = await client.chat.completions.create(
        model=settings.openrouter_debate_model,
        messages=messages,
        response_format={"type": "json_object"},
        temperature=0.85,
        timeout=settings.sim_timeout_seconds,
        extra_body=completion_route_for_model(settings.openrouter_debate_model),
    )
    return resp.choices[0].message.content or "{}"


async def _opening_turn(p: Persona, prod: Product) -> DebateTurn:
    system = (
        "You are roleplaying a real insurance customer at a focus group. "
        "Speak in first person, conversationally, like you're chatting with peers. "
        "Be authentic — if the product doesn't fit your life, say so plainly. "
        "Output STRICT JSON."
    )
    user = f"""{_persona_block(p)}
---
{_product_block(prod)}
---
This is round 1 of a focus-group discussion. Give YOUR initial reaction in 2-3 sentences, in your own voice. Don't summarize the product — react to it.

Return JSON:
{{
  "message": "<your reaction, 2-3 conversational sentences in first person>",
  "stance": "supportive" | "skeptical" | "curious" | "conflicted",
  "sentiment": "positive" | "neutral" | "negative"
}}"""
    raw = await _llm_call(
        [{"role": "system", "content": system}, {"role": "user", "content": user}],
        "DebateTurn",
    )
    return DebateTurn.model_validate(json.loads(raw))


async def _crosstalk_turn(p: Persona, prod: Product, prior_turns: list[dict]) -> DebateTurn:
    system = (
        "You are still roleplaying the same insurance customer in a focus group. "
        "You've now heard what others said. React to THEIR points specifically — "
        "agree, push back, or build on them. Stay in character. 2-3 sentences."
    )
    others = "\n".join(
        f'- {t["speaker_name"]} said: "{t["message"]}"'
        for t in prior_turns if t["speaker_id"] != p.id
    )
    user = f"""{_persona_block(p)}
---
{_product_block(prod)}
---
What others just said:
{others}
---
Round 2 — respond to what you heard. Pick 1-2 specific points to engage with. Use names. 2-3 sentences.

Return JSON: {{"message": "...", "stance": "...", "sentiment": "..."}}"""
    raw = await _llm_call(
        [{"role": "system", "content": system}, {"role": "user", "content": user}],
        "DebateTurn",
    )
    return DebateTurn.model_validate(json.loads(raw))


async def _final_stance(p: Persona, prod: Product, full_transcript: list[dict]) -> FinalStance:
    system = (
        "Final round of the focus group. You're giving your conclusive position on the offer "
        "after hearing everyone. Be honest about your decision. Output STRICT JSON."
    )
    transcript = "\n".join(
        f'[R{t["round"]}] {t["speaker_name"]}: "{t["message"]}"' for t in full_transcript
    )
    user = f"""{_persona_block(p)}
---
{_product_block(prod)}
---
FULL DISCUSSION SO FAR:
{transcript}
---
Round 3 — your final position. 2-3 sentences explaining where you landed, then the explicit decision.

Return JSON:
{{
  "message": "<your final reasoning, 2-3 sentences>",
  "decision": "yes" | "no" | "maybe",
  "sentiment": "positive" | "neutral" | "negative",
  "purchase_intent": <1-5 integer>
}}"""
    raw = await _llm_call(
        [{"role": "system", "content": system}, {"role": "user", "content": user}],
        "FinalStance",
    )
    return FinalStance.model_validate(json.loads(raw))


def _persist_turn(
    db: Session,
    sim_id: int,
    persona_id: int,
    round_num: int,
    payload: dict[str, Any],
    sentiment: str = "neutral",
    purchase_intent: int = 0,
    failed: bool = False,
    error: str | None = None,
    latency_ms: int = 0,
) -> None:
    row = AgentResponse(
        simulation_id=sim_id,
        persona_id=persona_id,
        response={"round": round_num, **payload},
        sentiment=sentiment,
        purchase_intent=purchase_intent,
        failed=failed,
        error=error,
        latency_ms=latency_ms,
    )
    db.add(row)
    db.commit()


async def run_debate(sim_id: int) -> None:
    """Driver: stratified sample, 3 rounds, persists each turn as it lands."""
    db: Session = SessionLocal()
    try:
        sim = db.get(Simulation, sim_id)
        if not sim:
            log.error("debate sim %d not found", sim_id)
            return
        audience = db.get(Audience, sim.audience_id)
        product = db.get(Product, sim.product_id)
        if not audience or not product:
            sim.status = "failed"
            sim.error = "audience or product missing"
            db.commit()
            return

        persona_ids = audience.persona_ids or []
        if not persona_ids:
            sim.status = "failed"
            sim.error = "audience has no personas"
            db.commit()
            return

        all_p = db.query(Persona).filter(Persona.id.in_(persona_ids)).all()
        participants = _stratified_sample(all_p, PARTICIPANT_COUNT)
        if not participants:
            sim.status = "failed"
            sim.error = "no participants selected"
            db.commit()
            return

        sim.status = "running"
        sim.started_at = datetime.utcnow()
        sim.progress = 0.0
        db.commit()
        log.info("debate %d: %d participants", sim_id, len(participants))

        total_turns = len(participants) * ROUNDS
        completed_turns = 0

        def bump_progress():
            nonlocal completed_turns
            completed_turns += 1
            sim.progress = completed_turns / total_turns
            db.commit()

        # ---------- Round 1: opening reactions (parallel) ----------
        async def opening(p: Persona):
            t0 = time.perf_counter()
            with trace_attributes(
                session_id=f"debate-{sim_id}",
                user_id=str(p.id),
                metadata={"round": 1, "persona_name": p.name},
            ):
                try:
                    turn = await _opening_turn(p, product)
                    _persist_turn(
                        db, sim_id, p.id, 1,
                        {"message": turn.message, "stance": turn.stance, "speaker_name": p.name},
                        sentiment=turn.sentiment,
                        latency_ms=int((time.perf_counter() - t0) * 1000),
                    )
                except (ValidationError, json.JSONDecodeError, Exception) as exc:
                    log.warning("debate r1 persona %d failed: %s", p.id, exc)
                    _persist_turn(
                        db, sim_id, p.id, 1,
                        {"message": "[failed to respond]", "stance": "neutral", "speaker_name": p.name},
                        failed=True, error=str(exc)[:300],
                    )
            bump_progress()

        await asyncio.gather(*(opening(p) for p in participants), return_exceptions=True)

        # Collect round 1 turns from DB for cross-talk context
        r1_rows = (
            db.query(AgentResponse)
            .where(AgentResponse.simulation_id == sim_id)
            .order_by(AgentResponse.id.asc())
            .all()
        )
        r1_turns = [
            {
                "round": 1,
                "speaker_id": r.persona_id,
                "speaker_name": r.response.get("speaker_name", ""),
                "message": r.response.get("message", ""),
            }
            for r in r1_rows
            if r.response.get("round") == 1
        ]

        # ---------- Round 2: cross-talk (sequential, in random order) ----------
        r2_order = list(participants)
        random.shuffle(r2_order)
        for p in r2_order:
            t0 = time.perf_counter()
            with trace_attributes(
                session_id=f"debate-{sim_id}",
                user_id=str(p.id),
                metadata={"round": 2, "persona_name": p.name},
            ):
                try:
                    turn = await _crosstalk_turn(p, product, r1_turns)
                    _persist_turn(
                        db, sim_id, p.id, 2,
                        {"message": turn.message, "stance": turn.stance, "speaker_name": p.name},
                        sentiment=turn.sentiment,
                        latency_ms=int((time.perf_counter() - t0) * 1000),
                    )
                except Exception as exc:
                    log.warning("debate r2 persona %d failed: %s", p.id, exc)
                    _persist_turn(
                        db, sim_id, p.id, 2,
                        {"message": "[failed to respond]", "stance": "neutral", "speaker_name": p.name},
                        failed=True, error=str(exc)[:300],
                    )
            bump_progress()

        # Collect full transcript for final round
        all_rows = (
            db.query(AgentResponse)
            .where(AgentResponse.simulation_id == sim_id)
            .order_by(AgentResponse.id.asc())
            .all()
        )
        full_transcript = [
            {
                "round": r.response.get("round", 0),
                "speaker_id": r.persona_id,
                "speaker_name": r.response.get("speaker_name", ""),
                "message": r.response.get("message", ""),
            }
            for r in all_rows
        ]

        # ---------- Round 3: final positions (sequential) ----------
        for p in participants:
            t0 = time.perf_counter()
            with trace_attributes(
                session_id=f"debate-{sim_id}",
                user_id=str(p.id),
                metadata={"round": 3, "persona_name": p.name},
            ):
                try:
                    final = await _final_stance(p, product, full_transcript)
                    _persist_turn(
                        db, sim_id, p.id, 3,
                        {
                            "message": final.message,
                            "stance": "supportive" if final.decision == "yes"
                                    else "skeptical" if final.decision == "no"
                                    else "conflicted",
                            "decision": final.decision,
                            "speaker_name": p.name,
                        },
                        sentiment=final.sentiment,
                        purchase_intent=final.purchase_intent,
                        latency_ms=int((time.perf_counter() - t0) * 1000),
                    )
                except Exception as exc:
                    log.warning("debate r3 persona %d failed: %s", p.id, exc)
                    _persist_turn(
                        db, sim_id, p.id, 3,
                        {"message": "[failed to respond]", "stance": "neutral", "decision": "maybe", "speaker_name": p.name},
                        failed=True, error=str(exc)[:300],
                    )
            bump_progress()

        sim.progress = 1.0
        sim.status = "completed"
        sim.completed_at = datetime.utcnow()
        db.commit()
        log.info("debate %d: completed", sim_id)
    except Exception as exc:
        log.exception("debate %d crashed: %s", sim_id, exc)
        if sim:
            sim.status = "failed"
            sim.error = str(exc)[:512]
            db.commit()
    finally:
        db.close()
