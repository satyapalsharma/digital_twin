from datetime import datetime
from sqlalchemy import JSON, DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class Persona(Base):
    __tablename__ = "personas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120), index=True)
    source: Mapped[str] = mapped_column(String(32), default="llm_generated")
    # Structured demographics — used for fast filtering in audience builder
    age: Mapped[int] = mapped_column(Integer, index=True)
    gender: Mapped[str] = mapped_column(String(20), index=True)
    income: Mapped[int] = mapped_column(Integer, index=True)  # annual USD
    occupation: Mapped[str] = mapped_column(String(80), index=True)
    region: Mapped[str] = mapped_column(String(40), index=True)
    marital_status: Mapped[str] = mapped_column(String(20), index=True)
    dependents: Mapped[int] = mapped_column(Integer, default=0)
    risk_tolerance: Mapped[str] = mapped_column(String(20), index=True)  # low|medium|high
    claims_history: Mapped[str] = mapped_column(String(20), index=True)  # none|few|many
    # Rich attributes — full JSON for prompting
    attributes: Mapped[dict] = mapped_column(JSON, default=dict)
    bio: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, index=True
    )
