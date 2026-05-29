"""Seed the products table with 10 pre-built insurance scenarios.

Usage:
    python -m scripts.seed_scenarios          # idempotent — won't duplicate
    python -m scripts.seed_scenarios --force  # delete existing templates first
"""

from __future__ import annotations

import argparse
import logging
import sys

from app.db import SessionLocal, init_db
from app.models.product import Product
from app.seed_data.scenarios import SCENARIOS


def main() -> int:
    parser = argparse.ArgumentParser(description="Seed product/scenario library")
    parser.add_argument("--force", action="store_true", help="Wipe existing templates first")
    parser.add_argument("-v", "--verbose", action="store_true")
    args = parser.parse_args()

    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(asctime)s %(levelname)-7s %(name)s: %(message)s",
    )
    log = logging.getLogger("seed_scenarios")

    init_db()
    db = SessionLocal()
    try:
        if args.force:
            n = db.query(Product).filter(Product.is_template.is_(True)).delete()
            db.commit()
            log.info("force=on — wiped %d existing templates", n)

        existing_names = {n for (n,) in db.query(Product.name).filter(Product.is_template.is_(True))}
        new_count = 0
        for s in SCENARIOS:
            if s["name"] in existing_names:
                log.debug("skip (already seeded): %s", s["name"])
                continue
            db.add(Product(**s))
            new_count += 1
        db.commit()
        total = db.query(Product).count()
        log.info("Seeded %d new scenarios (table total: %d)", new_count, total)
    finally:
        db.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
