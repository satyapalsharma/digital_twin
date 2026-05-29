"""Simulation routes — POST starts a run, GET fetches state, SSE streams progress."""

from __future__ import annotations

import asyncio
import json
import logging

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.db import SessionLocal, get_db
from app.models.simulation import AgentResponse, Insight, Simulation
from app.schemas.simulation import (
    AgentResponseOut,
    InsightOut,
    SimulationCreate,
    SimulationOut,
)

log = logging.getLogger(__name__)
router = APIRouter(prefix="/simulations", tags=["simulations"])


def _run_sim_blocking(sim_id: int) -> None:
    """Entry point for BackgroundTasks (sync). Spins up an event loop for the
    async sim_engine driver. We import lazily so the router file is cheap to import."""
    from app.services.sim_engine import run_simulation

    try:
        asyncio.run(run_simulation(sim_id))
    except Exception:
        log.exception("background sim %d crashed", sim_id)


def _run_debate_blocking(sim_id: int) -> None:
    from app.services.debate_engine import run_debate

    try:
        asyncio.run(run_debate(sim_id))
    except Exception:
        log.exception("background debate %d crashed", sim_id)


@router.get("", response_model=list[SimulationOut])
def list_simulations(db: Session = Depends(get_db)):
    return db.query(Simulation).order_by(Simulation.created_at.desc()).all()


@router.get("/{sim_id}", response_model=SimulationOut)
def get_simulation(sim_id: int, db: Session = Depends(get_db)):
    s = db.get(Simulation, sim_id)
    if not s:
        raise HTTPException(404, "simulation not found")
    return s


@router.post("", response_model=SimulationOut, status_code=201)
def create_simulation(
    payload: SimulationCreate,
    background: BackgroundTasks,
    db: Session = Depends(get_db),
):
    sim = Simulation(
        name=payload.name or f"Run #{int(__import__('time').time())}",
        mode=payload.mode,
        audience_id=payload.audience_id,
        product_id=payload.product_id,
        survey_id=payload.survey_id,
        status="pending",
    )
    db.add(sim)
    db.commit()
    db.refresh(sim)

    if payload.mode == "survey":
        background.add_task(_run_sim_blocking, sim.id)
    elif payload.mode == "debate":
        background.add_task(_run_debate_blocking, sim.id)

    return sim


@router.get("/{sim_id}/responses", response_model=list[AgentResponseOut])
def list_responses(sim_id: int, db: Session = Depends(get_db)):
    return db.query(AgentResponse).where(AgentResponse.simulation_id == sim_id).all()


@router.post("/{sim_id}/restart", response_model=SimulationOut)
def restart_simulation(
    sim_id: int,
    background: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """Reset a simulation (clear responses, insight, error) and re-run it.
    Useful for recovering stuck/failed runs without re-creating from scratch."""
    sim = db.get(Simulation, sim_id)
    if not sim:
        raise HTTPException(404, "simulation not found")
    db.query(AgentResponse).filter(AgentResponse.simulation_id == sim_id).delete()
    db.query(Insight).filter(Insight.simulation_id == sim_id).delete()
    sim.status = "pending"
    sim.progress = 0.0
    sim.error = None
    sim.started_at = None
    sim.completed_at = None
    db.commit()
    db.refresh(sim)
    if sim.mode == "survey":
        background.add_task(_run_sim_blocking, sim.id)
    elif sim.mode == "debate":
        background.add_task(_run_debate_blocking, sim.id)
    return sim


@router.delete("/{sim_id}", status_code=204)
def delete_simulation(sim_id: int, db: Session = Depends(get_db)):
    sim = db.get(Simulation, sim_id)
    if not sim:
        raise HTTPException(404, "simulation not found")
    db.delete(sim)
    db.commit()


@router.get("/{sim_id}/insight", response_model=InsightOut)
def get_insight(sim_id: int, db: Session = Depends(get_db)):
    insight = db.query(Insight).where(Insight.simulation_id == sim_id).one_or_none()
    if not insight:
        raise HTTPException(404, "insight not yet available")
    return insight


@router.post("/{sim_id}/synthesize", response_model=InsightOut)
async def synthesize_insight_now(sim_id: int, db: Session = Depends(get_db)):
    """Manually trigger (or re-trigger) insight synthesis for a completed sim."""
    from app.services.insights import synthesize_insight

    insight = await synthesize_insight(db, sim_id)
    if not insight:
        raise HTTPException(400, "synthesis failed — check simulation has responses")
    return insight


@router.get("/{sim_id}/stream")
async def stream_simulation(sim_id: int):
    """SSE — emits progress events until simulation reaches a terminal state."""

    async def event_gen():
        last_progress = -1.0
        last_status = ""
        last_response_count = 0
        # Cap the watch at ~10 minutes
        deadline = asyncio.get_event_loop().time() + 600
        while True:
            db = SessionLocal()
            try:
                s = db.get(Simulation, sim_id)
                if not s:
                    yield f"event: error\ndata: {json.dumps({'error': 'simulation not found'})}\n\n"
                    return
                r_count = (
                    db.query(AgentResponse)
                    .filter(AgentResponse.simulation_id == sim_id)
                    .count()
                )
                if (
                    s.progress != last_progress
                    or s.status != last_status
                    or r_count != last_response_count
                ):
                    payload = {
                        "status": s.status,
                        "progress": s.progress,
                        "responses": r_count,
                        "error": s.error,
                    }
                    yield f"event: progress\ndata: {json.dumps(payload)}\n\n"
                    last_progress = s.progress
                    last_status = s.status
                    last_response_count = r_count
                if s.status in {"completed", "failed"}:
                    yield f"event: done\ndata: {json.dumps({'status': s.status})}\n\n"
                    return
            finally:
                db.close()
            if asyncio.get_event_loop().time() > deadline:
                yield f"event: timeout\ndata: {json.dumps({'message': 'stream deadline reached'})}\n\n"
                return
            await asyncio.sleep(0.5)

    return StreamingResponse(
        event_gen(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
