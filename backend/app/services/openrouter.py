"""OpenRouter client wrappers (sync for one-off calls, async for fan-out).

OpenRouter is OpenAI-compatible, so we use the official `openai` SDK with a
custom base_url. Phoenix's auto-instrumentation captures all calls transparently.
"""

from __future__ import annotations

from functools import lru_cache
from openai import AsyncOpenAI, OpenAI

from app.config import get_settings

_BASE_URL = "https://openrouter.ai/api/v1"


@lru_cache
def sync_client() -> OpenAI:
    s = get_settings()
    return OpenAI(
        base_url=_BASE_URL,
        api_key=s.openrouter_api_key,
        default_headers={
            "HTTP-Referer": s.openrouter_http_referer,
            "X-Title": s.openrouter_app_title,
        },
    )


@lru_cache
def async_client() -> AsyncOpenAI:
    s = get_settings()
    return AsyncOpenAI(
        base_url=_BASE_URL,
        api_key=s.openrouter_api_key,
        default_headers={
            "HTTP-Referer": s.openrouter_http_referer,
            "X-Title": s.openrouter_app_title,
        },
    )


def completion_route_for_model(model: str) -> dict:
    """Provider routing guardrails for OpenRouter.

    This avoids unstable upstream fallbacks (notably Azure for some encrypted
    payload paths) by preferring the native provider for each model family.
    """
    m = (model or "").lower()
    if "gemini" in m or m.startswith("google/"):
        return {"provider": {"order": ["Google AI Studio"], "allow_fallbacks": False}}
    if "anthropic" in m or "claude" in m:
        return {"provider": {"order": ["Anthropic"], "allow_fallbacks": False}}
    if m.startswith("openai/") or "gpt" in m:
        return {"provider": {"order": ["OpenAI"], "allow_fallbacks": False}}
    return {"provider": {"allow_fallbacks": False}}