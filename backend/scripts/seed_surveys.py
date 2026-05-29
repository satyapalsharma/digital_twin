"""Seed pre-built survey templates (idempotent — skips by name).

Usage:
    python -m scripts.seed_surveys
    python -m scripts.seed_surveys --force
"""

from __future__ import annotations

import argparse
import logging
import sys

from app.db import SessionLocal, init_db
from app.models.survey import Survey
from app.seed_data.surveys import DEMO_SURVEYS


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--force", action="store_true")
    parser.add_argument("-v", "--verbose", action="store_true")
    args = parser.parse_args()

    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(asctime)s %(levelname)-7s %(name)s: %(message)s",
    )
    log = logging.getLogger("seed_surveys")

    init_db()
    db = SessionLocal()
    try:
        names = [s["name"] for s in DEMO_SURVEYS]
        if args.force:
            n = db.query(Survey).filter(Survey.name.in_(names)).delete()
            db.commit()
            log.info("force=on — wiped %d existing", n)

        existing = {n for (n,) in db.query(Survey.name).filter(Survey.name.in_(names))}
        new_count = 0
        for spec in DEMO_SURVEYS:
            if spec["name"] in existing:
                log.debug("skip (exists): %s", spec["name"])
                continue
            db.add(Survey(**spec))
            new_count += 1
            log.info("seeded '%s' with %d questions", spec["name"], len(spec["questions"]))
        db.commit()
        total = db.query(Survey).count()
        log.info("done — %d new (table total: %d)", new_count, total)
    finally:
        db.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
