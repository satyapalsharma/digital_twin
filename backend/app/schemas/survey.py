from datetime import datetime
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field


QuestionType = Literal["likert", "multi_choice", "open_text", "yes_no"]


class SurveyQuestion(BaseModel):
    id: str
    type: QuestionType
    prompt: str
    options: list[str] | None = None
    scale_min: int | None = None  # for likert
    scale_max: int | None = None


class SurveyBase(BaseModel):
    name: str
    description: str = ""
    questions: list[SurveyQuestion] = Field(default_factory=list)


class SurveyCreate(SurveyBase):
    pass


class SurveyOut(SurveyBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime
