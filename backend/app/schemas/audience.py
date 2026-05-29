from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

from app.schemas.persona import PersonaFilter


class AudienceBase(BaseModel):
    name: str
    description: str = ""
    filter_json: dict = Field(default_factory=dict)


class AudienceCreate(AudienceBase):
    filter: PersonaFilter | None = None
    persona_ids: list[int] | None = None


class AudienceOut(AudienceBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    persona_ids: list[int]
    created_at: datetime


class AudiencePreview(BaseModel):
    total: int
    sample: list[dict]
