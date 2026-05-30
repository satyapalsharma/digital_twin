from datetime import datetime
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field


class PersonaBase(BaseModel):
    name: str
    age: int = Field(ge=18, le=100)
    gender: Literal["male", "female", "non_binary", "other"]
    income: int = Field(ge=0)
    occupation: str
    region: str
    marital_status: Literal["single", "married", "divorced", "widowed"]
    dependents: int = Field(ge=0, default=0)
    risk_tolerance: Literal["low", "medium", "high"]
    claims_history: Literal["none", "few", "many"]
    attributes: dict = Field(default_factory=dict)
    bio: str = ""


class PersonaCreate(PersonaBase):
    source: str = "llm_generated"


class PersonaUpdate(BaseModel):
    """Partial update — every field optional. Used by the persona editor."""
    name: str | None = None
    age: int | None = Field(default=None, ge=18, le=100)
    gender: Literal["male", "female", "non_binary", "other"] | None = None
    income: int | None = Field(default=None, ge=0)
    occupation: str | None = None
    region: str | None = None
    marital_status: Literal["single", "married", "divorced", "widowed"] | None = None
    dependents: int | None = Field(default=None, ge=0)
    risk_tolerance: Literal["low", "medium", "high"] | None = None
    claims_history: Literal["none", "few", "many"] | None = None
    attributes: dict | None = None
    bio: str | None = None


class PersonaBulkCreate(BaseModel):
    """Bulk insert payload used by the persona import wizard."""
    personas: list[PersonaCreate] = Field(min_length=1, max_length=2000)


class PersonaBulkResult(BaseModel):
    inserted: int
    ids: list[int]


class PersonaOut(PersonaBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    source: str
    created_at: datetime


class PersonaFilter(BaseModel):
    """Filter criteria used by audience builder."""
    age_min: int | None = None
    age_max: int | None = None
    income_min: int | None = None
    income_max: int | None = None
    genders: list[str] | None = None
    regions: list[str] | None = None
    occupations: list[str] | None = None
    marital_statuses: list[str] | None = None
    risk_tolerances: list[str] | None = None
    claims_histories: list[str] | None = None
    dependents_min: int | None = None
    limit: int | None = Field(default=None, ge=1, le=10000)
