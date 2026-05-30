from datetime import datetime
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field


SimMode = Literal["survey", "debate"]
SimStatus = Literal["pending", "running", "completed", "failed"]
Verdict = Literal["launch", "optimize", "halt"]


class SimulationCreate(BaseModel):
    name: str = ""
    mode: SimMode = "survey"
    audience_id: int
    product_id: int
    survey_id: int | None = None  # required for mode=survey


class SimulationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    mode: SimMode
    audience_id: int
    product_id: int
    survey_id: int | None
    status: SimStatus
    progress: float
    error: str | None
    started_at: datetime | None
    completed_at: datetime | None
    created_at: datetime


class AgentResponseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    persona_id: int
    response: dict
    sentiment: str
    purchase_intent: int
    latency_ms: int
    failed: bool
    error: str | None


class InsightOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    simulation_id: int
    verdict: Verdict
    confidence: float
    summary: str
    reasoning: str
    top_concerns: list[str]
    top_positives: list[str]
    recommendations: list[str] = []
    segment_breakdown: list[dict]
    diverging_personas: list[int]
    metrics: dict
    created_at: datetime
