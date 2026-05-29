from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.persona import Persona
from app.schemas.persona import PersonaCreate, PersonaFilter, PersonaOut

router = APIRouter(prefix="/personas", tags=["personas"])


def _apply_filter(query, f: PersonaFilter):
    conds = []
    if f.age_min is not None:
        conds.append(Persona.age >= f.age_min)
    if f.age_max is not None:
        conds.append(Persona.age <= f.age_max)
    if f.income_min is not None:
        conds.append(Persona.income >= f.income_min)
    if f.income_max is not None:
        conds.append(Persona.income <= f.income_max)
    if f.genders:
        conds.append(Persona.gender.in_(f.genders))
    if f.regions:
        # Substring/ILIKE match so chip "Texas" catches "Houston, TX" too.
        # PersonaGen produces varied formats — strict equality misses too many.
        conds.append(or_(*(Persona.region.ilike(f"%{r}%") for r in f.regions)))
    if f.occupations:
        conds.append(or_(*(Persona.occupation.ilike(f"%{o}%") for o in f.occupations)))
    if f.marital_statuses:
        conds.append(Persona.marital_status.in_(f.marital_statuses))
    if f.risk_tolerances:
        conds.append(Persona.risk_tolerance.in_(f.risk_tolerances))
    if f.claims_histories:
        conds.append(Persona.claims_history.in_(f.claims_histories))
    if f.dependents_min is not None:
        conds.append(Persona.dependents >= f.dependents_min)
    if conds:
        query = query.where(and_(*conds))
    return query


@router.get("/count")
def count_personas(db: Session = Depends(get_db)):
    """Returns the total number of personas in the database."""
    total = db.query(Persona).count()
    return {"total": total}


@router.get("", response_model=list[PersonaOut])
def list_personas(
    limit: int = Query(default=50, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    rows = db.query(Persona).offset(offset).limit(limit).all()
    return rows


@router.get("/{persona_id}", response_model=PersonaOut)
def get_persona(persona_id: int, db: Session = Depends(get_db)):
    p = db.get(Persona, persona_id)
    if not p:
        raise HTTPException(404, "persona not found")
    return p


@router.post("", response_model=PersonaOut, status_code=201)
def create_persona(payload: PersonaCreate, db: Session = Depends(get_db)):
    p = Persona(**payload.model_dump())
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


@router.post("/filter/preview")
def preview_filter(f: PersonaFilter, db: Session = Depends(get_db)):
    """Returns {total, sample[]} for a candidate audience filter — used by the
    cohort builder for live counts."""
    q = _apply_filter(db.query(Persona), f)
    total = q.count()
    sample = q.limit(min(f.limit or 12, 12)).all()
    return {
        "total": total,
        "sample": [
            {
                "id": s.id, "name": s.name, "age": s.age, "occupation": s.occupation,
                "income": s.income, "region": s.region,
                "risk_tolerance": s.risk_tolerance,
            }
            for s in sample
        ],
    }


@router.post("/filter/resolve")
def resolve_filter(f: PersonaFilter, db: Session = Depends(get_db)):
    """Returns the full list of matching persona IDs."""
    q = _apply_filter(db.query(Persona.id), f)
    ids = [row[0] for row in q.all()]
    return {"persona_ids": ids, "total": len(ids)}
