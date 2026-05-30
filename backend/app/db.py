import logging
from collections.abc import Generator
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

log = logging.getLogger(__name__)

from app.config import get_settings

settings = get_settings()

engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False}
    if settings.database_url.startswith("sqlite")
    else {},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    from app.models import all_models  # noqa: F401  (ensures models are registered)

    Base.metadata.create_all(bind=engine)
    _ensure_added_columns()


# Lightweight, idempotent column migrations. `create_all` only creates missing
# tables — it never adds columns to a table that already exists — so columns
# introduced after a DB was first created need a small ALTER. Alembic would be
# the heavier-weight answer; this covers the handful of additive changes here.
_ADDED_COLUMNS: list[tuple[str, str, str]] = [
    # (table, column, column definition incl. default for existing rows)
    ("insights", "recommendations", "TEXT DEFAULT '[]'"),
]


def _ensure_added_columns() -> None:
    inspector = inspect(engine)
    with engine.begin() as conn:
        for table, column, ddl in _ADDED_COLUMNS:
            if not inspector.has_table(table):
                continue
            existing = {c["name"] for c in inspector.get_columns(table)}
            if column in existing:
                continue
            conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {ddl}"))
            log.info("migrated: added %s.%s", table, column)
