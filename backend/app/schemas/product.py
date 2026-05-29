from datetime import datetime
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field


ScenarioType = Literal[
    "premium_hike",
    "new_rider",
    "value_back",
    "telematics",
    "bundling",
    "claims_ux",
    "policy_renewal",
    "discount_offer",
    "channel_change",
    "custom",
]


class ProductBase(BaseModel):
    name: str
    category: str
    scenario_type: ScenarioType
    description: str = ""
    config: dict = Field(default_factory=dict)
    is_template: bool = False


class ProductCreate(ProductBase):
    pass


class ProductOut(ProductBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime
