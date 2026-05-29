from datetime import datetime
from sqlalchemy import JSON, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class Simulation(Base):
    __tablename__ = "simulations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(160), default="")
    mode: Mapped[str] = mapped_column(String(20), default="survey", index=True)
    # "survey" or "debate"
    audience_id: Mapped[int] = mapped_column(ForeignKey("audiences.id"), index=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), index=True)
    survey_id: Mapped[int | None] = mapped_column(
        ForeignKey("surveys.id"), nullable=True, index=True
    )
    status: Mapped[str] = mapped_column(String(20), default="pending", index=True)
    # pending | running | completed | failed
    progress: Mapped[float] = mapped_column(Float, default=0.0)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    started_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, index=True
    )

    responses: Mapped[list["AgentResponse"]] = relationship(
        back_populates="simulation", cascade="all, delete-orphan"
    )
    insight: Mapped["Insight | None"] = relationship(
        back_populates="simulation", uselist=False, cascade="all, delete-orphan"
    )


class AgentResponse(Base):
    __tablename__ = "agent_responses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    simulation_id: Mapped[int] = mapped_column(
        ForeignKey("simulations.id"), index=True
    )
    persona_id: Mapped[int] = mapped_column(ForeignKey("personas.id"), index=True)
    # Survey answers, sentiment, reasoning, etc.
    response: Mapped[dict] = mapped_column(JSON, default=dict)
    sentiment: Mapped[str] = mapped_column(String(20), default="neutral", index=True)
    purchase_intent: Mapped[int] = mapped_column(Integer, default=0)  # 1-5 Likert
    latency_ms: Mapped[int] = mapped_column(Integer, default=0)
    tokens_in: Mapped[int] = mapped_column(Integer, default=0)
    tokens_out: Mapped[int] = mapped_column(Integer, default=0)
    trace_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    failed: Mapped[bool] = mapped_column(default=False)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    simulation: Mapped["Simulation"] = relationship(back_populates="responses")


class Insight(Base):
    __tablename__ = "insights"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    simulation_id: Mapped[int] = mapped_column(
        ForeignKey("simulations.id"), unique=True, index=True
    )
    verdict: Mapped[str] = mapped_column(String(20), index=True)
    # "launch" | "optimize" | "halt"
    confidence: Mapped[float] = mapped_column(Float, default=0.0)  # 0..1
    summary: Mapped[str] = mapped_column(Text, default="")
    reasoning: Mapped[str] = mapped_column(Text, default="")
    top_concerns: Mapped[list[str]] = mapped_column(JSON, default=list)
    top_positives: Mapped[list[str]] = mapped_column(JSON, default=list)
    segment_breakdown: Mapped[list[dict]] = mapped_column(JSON, default=list)
    diverging_personas: Mapped[list[int]] = mapped_column(JSON, default=list)
    metrics: Mapped[dict] = mapped_column(JSON, default=dict)
    # {avg_purchase_intent, sentiment_pct: {pos, neu, neg}, churn_risk_pct, ...}
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    simulation: Mapped["Simulation"] = relationship(back_populates="insight")
