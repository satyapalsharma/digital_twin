from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import and_, func, or_
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.persona import Persona
from app.schemas.persona import (
    PersonaBulkCreate,
    PersonaBulkResult,
    PersonaCreate,
    PersonaFilter,
    PersonaOut,
    PersonaUpdate,
)

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


@router.get("/facets")
def persona_facets(db: Session = Depends(get_db)):
    """Distinct values + counts for each filterable attribute, derived from the
    live persona pool. Drives the audience-builder chips so they match the data
    instead of a hardcoded list. Declared before /{persona_id} so the literal
    path isn't parsed as an id."""

    def top(column, limit: int):
        rows = (
            db.query(column, func.count())
            .group_by(column)
            .order_by(func.count().desc())
            .limit(limit)
            .all()
        )
        return [{"value": v, "count": c} for v, c in rows if v not in (None, "")]

    age_min, age_max = db.query(func.min(Persona.age), func.max(Persona.age)).one()
    inc_min, inc_max = db.query(func.min(Persona.income), func.max(Persona.income)).one()

    return {
        "total": db.query(Persona).count(),
        "genders": top(Persona.gender, 10),
        "marital_statuses": top(Persona.marital_status, 10),
        "risk_tolerances": top(Persona.risk_tolerance, 10),
        "claims_histories": top(Persona.claims_history, 10),
        "regions": top(Persona.region, 40),
        "occupations": top(Persona.occupation, 40),
        "age": {"min": age_min, "max": age_max},
        "income": {"min": inc_min, "max": inc_max},
    }


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


@router.patch("/{persona_id}", response_model=PersonaOut)
def update_persona(persona_id: int, payload: PersonaUpdate, db: Session = Depends(get_db)):
    p = db.get(Persona, persona_id)
    if not p:
        raise HTTPException(404, "persona not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(p, field, value)
    db.commit()
    db.refresh(p)
    return p


@router.delete("/{persona_id}", status_code=204)
def delete_persona(persona_id: int, db: Session = Depends(get_db)):
    p = db.get(Persona, persona_id)
    if not p:
        raise HTTPException(404, "persona not found")
    db.delete(p)
    db.commit()


@router.post("/bulk", response_model=PersonaBulkResult, status_code=201)
def create_personas_bulk(payload: PersonaBulkCreate, db: Session = Depends(get_db)):
    """Insert many personas in one transaction — used by the import wizard
    (CSV upload, paste, or sample dataset)."""
    rows = [Persona(**p.model_dump()) for p in payload.personas]
    db.add_all(rows)
    db.commit()
    for r in rows:
        db.refresh(r)
    return PersonaBulkResult(inserted=len(rows), ids=[r.id for r in rows])


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
