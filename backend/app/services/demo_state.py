"""Demo state management — repeatable "reset to clean state" for live demos.

A CXO walkthrough must start from an identical, known-good baseline every time.
A previous demo run leaves behind simulations, ad-hoc imported personas, and
custom product drafts that make the next run look messy or "broken".

`reset_demo_state` brings the database back to the seeded baseline **without**
touching the expensive LLM-generated persona pool and **without** any network /
LLM calls, so it is fast and reliable on stage:

  - clears all simulation artifacts (runs, agent responses, insights)
  - removes custom (non-template) products created during a demo
  - removes personas imported / hand-added during a demo (keeps llm_generated)
  - removes audiences / surveys that aren't part of the seeded demo set
  - re-seeds the baseline templates, demo surveys, and demo audiences if missing

The persona pool itself is preserved because regenerating it requires the LLM
and is slow; pass ``clear_personas=True`` only for a deeper wipe.
"""

from __future__ import annotations

import logging

from sqlalchemy.orm import Session

from app.models.audience import Audience
from app.models.persona import Persona
from app.models.product import Product
from app.models.simulation import AgentResponse, Insight, Simulation
from app.models.survey import Survey
from app.routers.personas import _apply_filter
from app.schemas.persona import PersonaFilter
from app.seed_data.audiences import DEMO_AUDIENCES
from app.seed_data.scenarios import SCENARIOS
from app.seed_data.surveys import DEMO_SURVEYS

log = logging.getLogger(__name__)

# Personas with these sources are the seeded baseline pool — never auto-removed.
_BASELINE_PERSONA_SOURCES = {"llm_generated"}


def demo_state_summary(db: Session) -> dict:
    """Counts per table — drives the "current state" readout in the UI."""
    return {
        "personas": db.query(Persona).count(),
        "personas_baseline": db.query(Persona)
        .filter(Persona.source.in_(_BASELINE_PERSONA_SOURCES))
        .count(),
        "audiences": db.query(Audience).count(),
        "products": db.query(Product).count(),
        "products_template": db.query(Product)
        .filter(Product.is_template.is_(True))
        .count(),
        "surveys": db.query(Survey).count(),
        "simulations": db.query(Simulation).count(),
    }


def _clear_simulations(db: Session) -> int:
    """Delete every simulation plus its responses and insight.

    Bulk deletes don't fire ORM cascade rules, so children go first explicitly.
    """
    db.query(Insight).delete(synchronize_session=False)
    db.query(AgentResponse).delete(synchronize_session=False)
    removed = db.query(Simulation).delete(synchronize_session=False)
    return removed


def _reseed_products(db: Session) -> int:
    """Ensure every template scenario exists (idempotent, by name)."""
    existing = {
        n for (n,) in db.query(Product.name).filter(Product.is_template.is_(True))
    }
    added = 0
    for spec in SCENARIOS:
        if spec["name"] in existing:
            continue
        db.add(Product(**spec))
        added += 1
    return added


def _reseed_surveys(db: Session) -> int:
    existing = {n for (n,) in db.query(Survey.name)}
    added = 0
    for spec in DEMO_SURVEYS:
        if spec["name"] in existing:
            continue
        db.add(Survey(**spec))
        added += 1
    return added


def _reseed_audiences(db: Session) -> int:
    """Re-create the demo audiences, resolving persona_ids against the live pool."""
    existing = {n for (n,) in db.query(Audience.name)}
    added = 0
    for spec in DEMO_AUDIENCES:
        if spec["name"] in existing:
            continue
        f = PersonaFilter(**spec["filter"])
        ids = [row[0] for row in _apply_filter(db.query(Persona.id), f).all()]
        db.add(
            Audience(
                name=spec["name"],
                description=spec["description"],
                filter_json=spec["filter"],
                persona_ids=ids,
            )
        )
        added += 1
    return added


def reset_demo_state(db: Session, *, clear_personas: bool = False) -> dict:
    """Restore the seeded baseline. Returns a report of what changed.

    Args:
        clear_personas: also delete the entire persona pool (requires a fresh
            LLM seed afterwards). Off by default to keep resets fast and offline.
    """
    report: dict[str, object] = {}

    report["simulations_cleared"] = _clear_simulations(db)

    # Custom products created during a demo — keep only the template gallery.
    report["custom_products_removed"] = (
        db.query(Product)
        .filter(Product.is_template.is_(False))
        .delete(synchronize_session=False)
    )

    if clear_personas:
        report["personas_removed"] = db.query(Persona).delete(
            synchronize_session=False
        )
    else:
        # Drop demo-session personas (imported / hand-added), keep the pool.
        report["personas_removed"] = (
            db.query(Persona)
            .filter(Persona.source.notin_(_BASELINE_PERSONA_SOURCES))
            .delete(synchronize_session=False)
        )

    # Remove audiences / surveys that aren't part of the canonical demo set.
    demo_audience_names = [a["name"] for a in DEMO_AUDIENCES]
    report["custom_audiences_removed"] = (
        db.query(Audience)
        .filter(Audience.name.notin_(demo_audience_names))
        .delete(synchronize_session=False)
    )
    demo_survey_names = [s["name"] for s in DEMO_SURVEYS]
    report["custom_surveys_removed"] = (
        db.query(Survey)
        .filter(Survey.name.notin_(demo_survey_names))
        .delete(synchronize_session=False)
    )

    db.commit()

    # Re-seed the baseline (audiences resolve against the surviving persona pool).
    report["templates_reseeded"] = _reseed_products(db)
    report["surveys_reseeded"] = _reseed_surveys(db)
    report["audiences_reseeded"] = _reseed_audiences(db)
    db.commit()

    report["state"] = demo_state_summary(db)
    log.info("demo state reset: %s", report)
    return report
