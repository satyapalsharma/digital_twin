"""Seed 3 demo audiences (idempotent — skips by name).

Usage:
    python -m scripts.seed_audiences
    python -m scripts.seed_audiences --force  # wipe existing demo audiences first
"""

from __future__ import annotations

import argparse
import logging
import sys

from app.db import SessionLocal, init_db
from app.models.audience import Audience
from app.models.persona import Persona
from app.routers.personas import _apply_filter
from app.schemas.persona import PersonaFilter
from app.seed_data.audiences import DEMO_AUDIENCES


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--force", action="store_true", help="Wipe matching audiences before seeding")
    parser.add_argument("-v", "--verbose", action="store_true")
    args = parser.parse_args()

    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(asctime)s %(levelname)-7s %(name)s: %(message)s",
    )
    log = logging.getLogger("seed_audiences")

    init_db()
    db = SessionLocal()
    try:
        if db.query(Persona).count() == 0:
            log.error("No personas in DB — run `python -m scripts.seed_personas` first")
            return 2

        names = [a["name"] for a in DEMO_AUDIENCES]
        if args.force:
            n = db.query(Audience).filter(Audience.name.in_(names)).delete()
            db.commit()
            log.info("force=on — wiped %d existing demo audiences", n)

        existing = {n for (n,) in db.query(Audience.name).filter(Audience.name.in_(names))}
        new_count = 0

        for spec in DEMO_AUDIENCES:
            if spec["name"] in existing:
                log.debug("skip (exists): %s", spec["name"])
                continue
            f = PersonaFilter(**spec["filter"])
            q = _apply_filter(db.query(Persona.id), f)
            ids = [row[0] for row in q.all()]
            audience = Audience(
                name=spec["name"],
                description=spec["description"],
                filter_json=spec["filter"],
                persona_ids=ids,
            )
            db.add(audience)
            db.commit()
            log.info("seeded '%s' with %d personas", spec["name"], len(ids))
            new_count += 1

        total = db.query(Audience).count()
        log.info("done — %d new audiences (table total: %d)", new_count, total)
    finally:
        db.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
