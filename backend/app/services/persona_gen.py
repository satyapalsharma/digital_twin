"""LLM-driven generation of synthetic insurance customer personas.

Strategy:
- Generate in small batches (default 10) with explicit diversity hints per batch
  so a single LLM call returns a varied set.
- Each batch is seeded with biased "age bucket / region / life-stage" instructions
  drawn from a rotation, so 50 batches cover the demographic spectrum.
- Each persona returned by the LLM is validated against PersonaBase (Pydantic);
  invalid entries are dropped, not retried, to keep generation fast.
"""

from __future__ import annotations

import asyncio
import json
import logging
import random
from collections.abc import Iterable
from dataclasses import dataclass

from pydantic import ValidationError
from sqlalchemy.orm import Session
from tenacity import retry, stop_after_attempt, wait_exponential

from app.config import get_settings
from app.models.persona import Persona
from app.schemas.persona import PersonaBase
from app.services.openrouter import async_client, completion_route_for_model

log = logging.getLogger(__name__)


# Demographic rotation hints to force diversity across batches.
_AGE_BUCKETS = [
    ("22-30", "young professionals, often renting, building credit, first jobs"),
    ("28-38", "early-career, some with toddlers, beginning to consider life insurance"),
    ("35-50", "established families with dependents, mortgages, peak earning"),
    ("45-60", "kids in/leaving college, peak income, focused on retirement planning"),
    ("55-70", "empty-nesters or pre-retirees, downsizing, healthcare-focused"),
    ("65-78", "retirees on fixed income, Medicare supplement shoppers, legacy planning"),
]

_REGIONAL_FLAVOR = [
    "California — high cost of living, climate-conscious",
    "Texas — auto-heavy lifestyle, conservative on costs",
    "Florida — hurricane risk, large retiree population",
    "New York metro — urban renters/condo owners, public-transit users",
    "Midwest (IL/OH/MI) — suburban, family-centric, value-driven",
    "Pacific Northwest (WA/OR) — tech-heavy, outdoor-active",
    "Mountain West (CO/UT) — outdoor lifestyle, second-home market",
    "Southeast (GA/NC/SC) — growing transplants, mixed urban/rural",
    "Northeast (MA/CT/NJ) — high-income professionals, education focus",
    "Southwest (AZ/NV) — heat exposure, retiree communities",
]


@dataclass
class GenerationStats:
    requested: int
    generated: int
    inserted: int
    invalid: int
    failed_batches: int


def _build_messages(batch_size: int) -> list[dict]:
    age_bucket = random.choice(_AGE_BUCKETS)
    region = random.choice(_REGIONAL_FLAVOR)
    system = (
        "You generate realistic, diverse synthetic customer personas for testing "
        "insurance products. Each persona must feel like a real individual with "
        "specific insurance-relevant concerns. NEVER use stereotypes or generic "
        "descriptions. Vary names across ethnicities and regions. Output STRICT JSON only."
    )
    user = f"""Generate exactly {batch_size} diverse personas for an INSURANCE product-testing context.

DEMOGRAPHIC FOCUS FOR THIS BATCH:
- Most personas should land in age bucket: {age_bucket[0]} ({age_bucket[1]})
- Regional flavor: {region}
- But mix in 1-2 outliers to keep variety honest.

REQUIRED SCHEMA for each persona:
{{
  "name": "First Last",
  "age": int (18-90),
  "gender": "male" | "female" | "non_binary" | "other",
  "income": int (annual USD, realistic for occupation + region),
  "occupation": "specific role (e.g. 'pediatric nurse', 'logistics dispatcher')",
  "region": "US state or major metro",
  "marital_status": "single" | "married" | "divorced" | "widowed",
  "dependents": int (0-6),
  "risk_tolerance": "low" | "medium" | "high",
  "claims_history": "none" | "few" | "many",
  "attributes": {{
    "education": "high_school | associates | bachelors | masters | doctorate | trade",
    "current_policies": ["auto", "health", "term_life", ...],
    "financial_priorities": ["save_for_kids", "retirement", "debt_payoff", ...],
    "life_stage": "renter_starter | first_home | growing_family | empty_nester | retiree | ...",
    "tech_savviness": "low" | "medium" | "high",
    "key_concerns": ["specific worries — premiums, health costs, climate risk, kids' college, ..."]
  }},
  "bio": "2-3 sentences in first person. Capture voice, priorities, frustrations."
}}

OUTPUT FORMAT: a single JSON object with one key "personas" whose value is the array of {batch_size} persona objects. No prose, no markdown fences, just JSON."""
    return [
        {"role": "system", "content": system},
        {"role": "user", "content": user},
    ]


@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=8), reraise=True)
async def _generate_batch(batch_size: int) -> list[PersonaBase]:
    settings = get_settings()
    client = async_client()
    resp = await client.chat.completions.create(
        model=settings.openrouter_agent_model,
        messages=_build_messages(batch_size),
        response_format={"type": "json_object"},
        temperature=settings.persona_gen_temperature,
        timeout=settings.sim_timeout_seconds,
        extra_body=completion_route_for_model(settings.openrouter_agent_model),
    )
    raw = resp.choices[0].message.content or "{}"
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as e:
        log.warning("Persona batch returned invalid JSON: %s", e)
        return []
    items = payload.get("personas") or payload.get("data") or []
    out: list[PersonaBase] = []
    for item in items:
        try:
            out.append(PersonaBase.model_validate(item))
        except ValidationError as e:
            log.debug("Dropping invalid persona: %s", e)
    return out


async def generate_personas(
    total: int = 500,
    batch_size: int = 10,
    concurrency: int = 8,
) -> list[PersonaBase]:
    """Generate `total` personas via concurrent LLM batches."""
    num_batches = (total + batch_size - 1) // batch_size
    sem = asyncio.Semaphore(concurrency)

    async def one(i: int) -> list[PersonaBase]:
        async with sem:
            try:
                personas = await _generate_batch(batch_size)
                log.info("batch %d/%d: %d personas", i + 1, num_batches, len(personas))
                return personas
            except Exception as exc:
                log.exception("batch %d failed: %s", i + 1, exc)
                return []

    results = await asyncio.gather(*(one(i) for i in range(num_batches)))
    flat = [p for batch in results for p in batch][:total]
    return flat


def persist_personas(db: Session, personas: Iterable[PersonaBase]) -> int:
    """Insert validated personas. Returns count actually inserted."""
    n = 0
    for p in personas:
        db.add(Persona(**p.model_dump(), source="llm_generated"))
        n += 1
    db.commit()
    return n


async def seed_if_empty(
    db: Session,
    target: int = 500,
    batch_size: int = 10,
    concurrency: int = 8,
) -> GenerationStats:
    """Idempotent seed — only generates if persona table is below `target`."""
    existing = db.query(Persona).count()
    if existing >= target:
        log.info("Persona table has %d rows (>= %d) — skipping generation", existing, target)
        return GenerationStats(target, 0, 0, 0, 0)
    needed = target - existing
    log.info("Generating %d personas (existing=%d, target=%d)", needed, existing, target)
    personas = await generate_personas(needed, batch_size, concurrency)
    inserted = persist_personas(db, personas)
    return GenerationStats(
        requested=needed,
        generated=len(personas),
        inserted=inserted,
        invalid=needed - len(personas),
        failed_batches=0,
    )
