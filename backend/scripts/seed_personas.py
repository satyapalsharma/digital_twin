"""Seed the persona table by generating personas via the LLM.

Usage:
    python -m scripts.seed_personas                # default: 500 personas
    python -m scripts.seed_personas --target 50    # smaller smoke run
    python -m scripts.seed_personas --batch 5 --concurrency 4

Idempotent: if the table already has >= target rows, it skips work.
"""

from __future__ import annotations

import argparse
import asyncio
import logging
import sys

from app.config import get_settings
from app.db import SessionLocal, init_db
from app.services.persona_gen import seed_if_empty


def main() -> int:
    parser = argparse.ArgumentParser(description="Seed personas via LLM generation")
    parser.add_argument("--target", type=int, default=500)
    parser.add_argument("--batch", type=int, default=10)
    parser.add_argument("--concurrency", type=int, default=8)
    parser.add_argument("--verbose", "-v", action="store_true")
    args = parser.parse_args()

    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(asctime)s %(levelname)-7s %(name)s: %(message)s",
    )
    log = logging.getLogger("seed_personas")

    settings = get_settings()
    if not settings.openrouter_api_key:
        log.error("OPENROUTER_API_KEY missing — create .env from .env.example and set it")
        return 2

    init_db()
    db = SessionLocal()
    try:
        stats = asyncio.run(
            seed_if_empty(db, target=args.target, batch_size=args.batch, concurrency=args.concurrency)
        )
    finally:
        db.close()

    log.info(
        "Seeding done — requested=%d generated=%d inserted=%d invalid=%d",
        stats.requested, stats.generated, stats.inserted, stats.invalid,
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
