from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.audience import Audience
from app.routers.personas import _apply_filter
from app.models.persona import Persona
from app.schemas.audience import AudienceCreate, AudienceOut

router = APIRouter(prefix="/audiences", tags=["audiences"])


@router.get("", response_model=list[AudienceOut])
def list_audiences(db: Session = Depends(get_db)):
    return db.query(Audience).order_by(Audience.created_at.desc()).all()


@router.get("/{audience_id}", response_model=AudienceOut)
def get_audience(audience_id: int, db: Session = Depends(get_db)):
    a = db.get(Audience, audience_id)
    if not a:
        raise HTTPException(404, "audience not found")
    return a


@router.post("", response_model=AudienceOut, status_code=201)
def create_audience(payload: AudienceCreate, db: Session = Depends(get_db)):
    persona_ids = payload.persona_ids or []
    if payload.filter and not persona_ids:
        q = _apply_filter(db.query(Persona.id), payload.filter)
        persona_ids = [r[0] for r in q.all()]
    filter_json = payload.filter.model_dump(exclude_none=True) if payload.filter else payload.filter_json
    a = Audience(
        name=payload.name,
        description=payload.description,
        filter_json=filter_json,
        persona_ids=persona_ids,
    )
    db.add(a)
    db.commit()
    db.refresh(a)
    return a


@router.delete("/{audience_id}", status_code=204)
def delete_audience(audience_id: int, db: Session = Depends(get_db)):
    a = db.get(Audience, audience_id)
    if not a:
        raise HTTPException(404, "audience not found")
    db.delete(a)
    db.commit()
