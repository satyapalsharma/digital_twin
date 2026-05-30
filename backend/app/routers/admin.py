"""Admin / demo-operations routes.

These back the "demo control" surface used on stage:
  - GET  /admin/state       — current row counts (what the DB looks like now)
  - POST /admin/reset       — restore the seeded, known-good baseline
  - GET  /admin/llm-health  — is the LLM provider configured? (drives the
                              "LLM connected" health chip)

`/admin/reset` is destructive (it clears simulations and demo-session data), so
it is intentionally explicit rather than wired into any automatic flow.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.config import get_settings
from app.db import get_db
from app.services.demo_state import demo_state_summary, reset_demo_state

router = APIRouter(prefix="/admin", tags=["admin"])

# Substrings that mark the .env.example placeholder rather than a real key.
_PLACEHOLDER_MARKERS = ("replace_me", "your-key", "changeme", "xxxx")


@router.get("/state")
def get_state(db: Session = Depends(get_db)):
    """Current per-table counts — the live "demo state" readout."""
    return demo_state_summary(db)


@router.post("/reset")
def reset_state(
    clear_personas: bool = Query(
        default=False,
        description="Also wipe the persona pool (needs a fresh LLM seed afterwards).",
    ),
    db: Session = Depends(get_db),
):
    """Restore the known-good baseline so every demo run starts identical."""
    return reset_demo_state(db, clear_personas=clear_personas)


@router.get("/llm-health")
def llm_health():
    """Lightweight, no-network check of LLM provider configuration.

    Returns whether a real-looking OpenRouter key is present so the UI can show
    a "LLM connected ✓ / not configured" chip *before* a demo, without spending
    a token or risking a slow probe call on stage.
    """
    settings = get_settings()
    key = (settings.openrouter_api_key or "").strip()
    lowered = key.lower()
    is_placeholder = any(marker in lowered for marker in _PLACEHOLDER_MARKERS)
    configured = bool(key) and not is_placeholder

    if not key:
        reason = "OPENROUTER_API_KEY is not set"
    elif is_placeholder:
        reason = "OPENROUTER_API_KEY is still the placeholder value"
    else:
        reason = "API key present"

    return {
        "configured": configured,
        "reason": reason,
        "agent_model": settings.openrouter_agent_model,
        "synthesizer_model": settings.openrouter_synthesizer_model,
        "debate_model": settings.openrouter_debate_model,
    }
