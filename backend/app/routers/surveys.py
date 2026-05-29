from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.survey import Survey
from app.schemas.survey import SurveyCreate, SurveyOut

router = APIRouter(prefix="/surveys", tags=["surveys"])


@router.get("", response_model=list[SurveyOut])
def list_surveys(db: Session = Depends(get_db)):
    return db.query(Survey).order_by(Survey.created_at.desc()).all()


@router.get("/{survey_id}", response_model=SurveyOut)
def get_survey(survey_id: int, db: Session = Depends(get_db)):
    s = db.get(Survey, survey_id)
    if not s:
        raise HTTPException(404, "survey not found")
    return s


@router.post("", response_model=SurveyOut, status_code=201)
def create_survey(payload: SurveyCreate, db: Session = Depends(get_db)):
    s = Survey(
        name=payload.name,
        description=payload.description,
        questions=[q.model_dump() for q in payload.questions],
    )
    db.add(s)
    db.commit()
    db.refresh(s)
    return s


@router.delete("/{survey_id}", status_code=204)
def delete_survey(survey_id: int, db: Session = Depends(get_db)):
    s = db.get(Survey, survey_id)
    if not s:
        raise HTTPException(404, "survey not found")
    db.delete(s)
    db.commit()
