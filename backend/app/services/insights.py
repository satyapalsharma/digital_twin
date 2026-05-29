"""Insights synthesizer.

Takes a completed simulation, computes deterministic metrics (sentiment %,
average purchase intent, churn risk proxy), then asks Claude Haiku 4.5 to
synthesize a verdict (LAUNCH / OPTIMIZE / HALT) with explainable reasoning,
top concerns, top positives, segment breakdown, and diverging-opinion picks.

The deterministic metrics are computed locally — the LLM only narrates them.
This keeps the verdict cheap (one synthesis call per simulation) and grounded
in real data, not LLM hallucination.
"""

from __future__ import annotations

import json
import logging
from collections import Counter
from typing import Any

from pydantic import BaseModel, Field, ValidationError
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models.audience import Audience
from app.models.persona import Persona
from app.models.product import Product
from app.models.simulation import AgentResponse, Insight, Simulation
from app.services.openrouter import async_client, completion_route_for_model
from app.services.phoenix import trace_attributes

log = logging.getLogger(__name__)


class SynthesizerOutput(BaseModel):
    verdict: str  # launch | optimize | halt
    confidence: float = Field(ge=0.0, le=1.0)
    summary: str  # 1-2 sentence headline
    reasoning: str  # 2-4 sentence justification referencing data
    top_concerns: list[str]
    top_positives: list[str]
    diverging_personas: list[int]  # persona IDs whose views most diverge from majority
    segment_breakdown: list[dict[str, Any]]  # [{segment, count, avg_intent, sentiment_pct}]


def _compute_metrics(
    responses: list[AgentResponse], personas: dict[int, Persona]
) -> dict[str, Any]:
    successful = [r for r in responses if not r.failed]
    if not successful:
        return {
            "total": len(responses),
            "successful": 0,
            "failed": len(responses),
            "avg_purchase_intent": 0.0,
            "sentiment_pct": {"positive": 0, "neutral": 0, "negative": 0},
            "would_recommend_pct": {"yes": 0, "no": 0, "maybe": 0},
            "intent_distribution": [0] * 5,
            "by_age_bucket": [],
            "by_risk_tolerance": [],
        }

    avg_intent = sum(r.purchase_intent for r in successful) / len(successful)
    sentiments = Counter(r.sentiment for r in successful)
    sentiment_pct = {
        k: round(100 * sentiments.get(k, 0) / len(successful), 1)
        for k in ["positive", "neutral", "negative"]
    }

    rec = Counter(r.response.get("would_recommend", "maybe") for r in successful)
    rec_pct = {
        k: round(100 * rec.get(k, 0) / len(successful), 1) for k in ["yes", "no", "maybe"]
    }

    intent_dist = [0] * 5
    for r in successful:
        if 1 <= r.purchase_intent <= 5:
            intent_dist[r.purchase_intent - 1] += 1

    by_risk: dict[str, list[AgentResponse]] = {}
    by_age: dict[str, list[AgentResponse]] = {}
    for r in successful:
        p = personas.get(r.persona_id)
        if not p:
            continue
        by_risk.setdefault(p.risk_tolerance, []).append(r)
        bucket = "<30" if p.age < 30 else "30-44" if p.age < 45 else "45-59" if p.age < 60 else "60+"
        by_age.setdefault(bucket, []).append(r)

    def seg_row(label: str, rs: list[AgentResponse]) -> dict[str, Any]:
        cnt = len(rs)
        ai = sum(x.purchase_intent for x in rs) / cnt
        sent = Counter(x.sentiment for x in rs)
        return {
            "segment": label,
            "count": cnt,
            "avg_intent": round(ai, 2),
            "positive_pct": round(100 * sent.get("positive", 0) / cnt, 1),
            "negative_pct": round(100 * sent.get("negative", 0) / cnt, 1),
        }

    return {
        "total": len(responses),
        "successful": len(successful),
        "failed": len(responses) - len(successful),
        "avg_purchase_intent": round(avg_intent, 2),
        "sentiment_pct": sentiment_pct,
        "would_recommend_pct": rec_pct,
        "intent_distribution": intent_dist,
        "by_age_bucket": [seg_row(k, v) for k, v in by_age.items()],
        "by_risk_tolerance": [seg_row(k, v) for k, v in by_risk.items()],
    }


def _deterministic_verdict(metrics: dict[str, Any]) -> tuple[str, float]:
    """Compute verdict from metrics alone — used as a sanity check on the LLM's choice."""
    avg = metrics["avg_purchase_intent"]
    pos = metrics["sentiment_pct"]["positive"]
    neg = metrics["sentiment_pct"]["negative"]
    if avg >= 3.8 and pos >= 50 and neg < 25:
        return "launch", min(0.6 + (avg - 3.8) / 5, 0.95)
    if avg < 2.5 or neg >= 45:
        return "halt", min(0.6 + (2.5 - avg) / 5 + (neg - 45) / 100, 0.95)
    return "optimize", 0.5 + abs(3.0 - avg) / 10


def _build_synth_messages(
    sim: Simulation,
    product: Product,
    audience: Audience,
    metrics: dict,
    sample_responses: list[dict],
    suggested_verdict: str,
) -> list[dict]:
    system = (
        "You are a senior insurance product strategist. Given quantitative metrics "
        "from a synthetic-customer simulation and a sample of agent responses, you "
        "synthesize a clear LAUNCH / OPTIMIZE / HALT recommendation with reasoning "
        "grounded in the actual data. Be specific — cite concerns by name, not generically. "
        "Output STRICT JSON."
    )

    user = f"""SIMULATION CONTEXT
Product: {product.name} ({product.scenario_type})
Description: {product.description}
Audience: {audience.name} ({len(audience.persona_ids or [])} personas)

METRICS (computed from {metrics['successful']} successful responses)
- Average purchase intent: {metrics['avg_purchase_intent']} / 5
- Sentiment: {metrics['sentiment_pct']['positive']}% positive, {metrics['sentiment_pct']['neutral']}% neutral, {metrics['sentiment_pct']['negative']}% negative
- Would recommend: {metrics['would_recommend_pct']['yes']}% yes, {metrics['would_recommend_pct']['no']}% no, {metrics['would_recommend_pct']['maybe']}% maybe
- Intent distribution (1→5): {metrics['intent_distribution']}
- By risk tolerance: {json.dumps(metrics['by_risk_tolerance'])}
- By age bucket: {json.dumps(metrics['by_age_bucket'])}

DETERMINISTIC VERDICT (from rules — you may agree or override with justification): {suggested_verdict.upper()}

SAMPLE AGENT RESPONSES (n={len(sample_responses)}):
{json.dumps(sample_responses, indent=2)[:5500]}

YOUR TASK
Return JSON exactly matching this shape:
{{
  "verdict": "launch" | "optimize" | "halt",
  "confidence": <float 0.0-1.0>,
  "summary": "<one punchy sentence stating the verdict and the headline reason>",
  "reasoning": "<2-4 sentences justifying the verdict using specific persona concerns and the metric pattern>",
  "top_concerns": ["concern phrased generally", ...],   // 3-5 items, each a real concern from responses, deduped
  "top_positives": ["positive phrased generally", ...], // 2-5 items
  "diverging_personas": [<persona_id int>, ...],       // 2-3 IDs whose response most contradicts the majority verdict
  "segment_breakdown": [
    {{"segment": "risk_tolerance: low", "verdict_lean": "halt|optimize|launch", "note": "one-line why"}},
    ...
  ]
}}

Pick `diverging_personas` from the sample responses' persona_id values."""
    return [
        {"role": "system", "content": system},
        {"role": "user", "content": user},
    ]


def _pick_sample_responses(
    responses: list[AgentResponse], personas: dict[int, Persona], k: int = 18
) -> list[dict]:
    """Sample for the LLM — prioritize variety: mix of intents + non-failed."""
    successful = [r for r in responses if not r.failed]
    if len(successful) <= k:
        sel = successful
    else:
        # Stratify by purchase_intent so we cover the spectrum
        by_intent: dict[int, list[AgentResponse]] = {}
        for r in successful:
            by_intent.setdefault(r.purchase_intent, []).append(r)
        per_bucket = max(1, k // max(1, len(by_intent)))
        sel: list[AgentResponse] = []
        for rs in by_intent.values():
            sel.extend(rs[:per_bucket])
        # Top off
        rest = [r for r in successful if r not in sel]
        sel.extend(rest[: max(0, k - len(sel))])

    out = []
    for r in sel[:k]:
        p = personas.get(r.persona_id)
        out.append({
            "persona_id": r.persona_id,
            "persona_summary": (
                f"{p.age}y {p.occupation} in {p.region}, "
                f"risk={p.risk_tolerance}, claims={p.claims_history}"
                if p else f"persona #{r.persona_id}"
            ),
            "intent": r.purchase_intent,
            "sentiment": r.sentiment,
            "top_concern": r.response.get("top_concern", ""),
            "top_positive": r.response.get("top_positive", ""),
            "would_recommend": r.response.get("would_recommend", ""),
            "reasoning": r.response.get("reasoning", ""),
        })
    return out


async def synthesize_insight(db: Session, sim_id: int) -> Insight | None:
    sim = db.get(Simulation, sim_id)
    if not sim:
        log.error("synthesize: sim %d not found", sim_id)
        return None

    responses = db.query(AgentResponse).where(AgentResponse.simulation_id == sim_id).all()
    if not responses:
        log.warning("synthesize: no responses for sim %d", sim_id)
        return None

    personas = {
        p.id: p
        for p in db.query(Persona)
        .where(Persona.id.in_([r.persona_id for r in responses]))
        .all()
    }
    product = db.get(Product, sim.product_id)
    audience = db.get(Audience, sim.audience_id)
    if not product or not audience:
        log.error("synthesize: missing product or audience for sim %d", sim_id)
        return None

    metrics = _compute_metrics(responses, personas)
    suggested_verdict, det_conf = _deterministic_verdict(metrics)
    samples = _pick_sample_responses(responses, personas)

    settings = get_settings()
    client = async_client()
    with trace_attributes(session_id=f"insight-{sim_id}", metadata={"phase": "synthesis"}):
        resp = await client.chat.completions.create(
            model=settings.openrouter_synthesizer_model,
            messages=_build_synth_messages(sim, product, audience, metrics, samples, suggested_verdict),
            response_format={"type": "json_object"},
            temperature=0.3,
            timeout=60,
            extra_body=completion_route_for_model(settings.openrouter_synthesizer_model),
        )
    raw = resp.choices[0].message.content or "{}"
    try:
        synth = SynthesizerOutput.model_validate(json.loads(raw))
    except (ValidationError, json.JSONDecodeError) as e:
        log.warning("synthesizer JSON invalid (%s) — falling back to deterministic verdict", e)
        synth = SynthesizerOutput(
            verdict=suggested_verdict,
            confidence=det_conf,
            summary=f"Deterministic verdict: {suggested_verdict.upper()} (LLM synthesis fallback)",
            reasoning=(
                f"Average purchase intent of {metrics['avg_purchase_intent']}/5 with "
                f"{metrics['sentiment_pct']['positive']}% positive sentiment indicates a "
                f"{suggested_verdict} recommendation."
            ),
            top_concerns=[],
            top_positives=[],
            diverging_personas=[],
            segment_breakdown=[],
        )

    # Persist (replace any existing insight for this sim)
    existing = db.query(Insight).where(Insight.simulation_id == sim_id).one_or_none()
    if existing:
        db.delete(existing)
        db.commit()

    insight = Insight(
        simulation_id=sim_id,
        verdict=synth.verdict if synth.verdict in {"launch", "optimize", "halt"} else suggested_verdict,
        confidence=synth.confidence,
        summary=synth.summary,
        reasoning=synth.reasoning,
        top_concerns=synth.top_concerns,
        top_positives=synth.top_positives,
        segment_breakdown=synth.segment_breakdown,
        diverging_personas=synth.diverging_personas,
        metrics=metrics,
    )
    db.add(insight)
    db.commit()
    db.refresh(insight)
    log.info("sim %d → insight verdict=%s confidence=%.2f", sim_id, insight.verdict, insight.confidence)
    return insight
