"""Arize Phoenix tracing — behind a feature flag.

If PHOENIX_ENABLED is false (default), this module is a no-op. Once
endpoint + API key are set in .env and the flag is flipped, every
OpenAI/OpenRouter call from the process is auto-traced.
"""

from __future__ import annotations

import logging
import os
from contextlib import contextmanager

from app.config import get_settings

log = logging.getLogger(__name__)

_initialized = False


def init_tracing() -> None:
    global _initialized
    if _initialized:
        return

    settings = get_settings()
    if not settings.phoenix_enabled:
        log.info("Phoenix tracing disabled (PHOENIX_ENABLED=false)")
        return

    if not settings.phoenix_collector_endpoint or not settings.phoenix_api_key:
        log.warning(
            "Phoenix enabled but endpoint/key missing — tracing will not start"
        )
        return

    # arize-phoenix-otel reads these env vars during register()
    os.environ.setdefault(
        "PHOENIX_COLLECTOR_ENDPOINT", settings.phoenix_collector_endpoint
    )
    os.environ.setdefault("PHOENIX_API_KEY", settings.phoenix_api_key)

    try:
        from phoenix.otel import register

        register(
            project_name=settings.phoenix_project_name,
            auto_instrument=True,
        )
        _initialized = True
        log.info(
            "Phoenix tracing initialized (project=%s)", settings.phoenix_project_name
        )
    except Exception as exc:
        log.exception("Failed to initialize Phoenix tracing: %s", exc)


@contextmanager
def trace_attributes(**attrs):
    """Tag the current span with arbitrary attributes (e.g. simulation_id,
    persona_id). No-op when Phoenix is disabled."""
    if not _initialized:
        yield
        return
    try:
        from openinference.instrumentation import using_attributes

        # Common keys: session_id, user_id, metadata
        with using_attributes(**attrs):
            yield
    except Exception:
        log.exception("trace_attributes failed; continuing without tracing")
        yield
