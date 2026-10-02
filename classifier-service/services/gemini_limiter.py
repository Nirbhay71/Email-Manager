"""
Process-wide rate limiter + retry wrapper for every Gemini call this service makes.

The free tier allows only a handful of requests per minute per model, and
the model occasionally answers 503 under load. Without pacing, a burst of
incoming mail turns into a wall of 429s. Every Gemini call (reasoning and
summary refresh, from the queue worker and the Classify RPC alike) goes
through `call_gemini`, which:

- spaces requests to stay under GEMINI_RPM,
- on 429/5xx first fails over to the next model in GEMINI_FALLBACK_MODELS
  (free-tier quotas and "high demand" outages are per model),
- once every model has failed, waits as long as Google's RetryInfo asks
  (429, capped) or backs off exponentially (5xx), then tries again,
- raises GeminiUnavailable when it gives up, so callers can leave work
  queued instead of inventing an answer.
"""

import logging
import os
import re
import threading
import time

logger = logging.getLogger("GeminiLimiter")

# Primary model first, then fallbacks tried in order on 429/5xx.
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
GEMINI_FALLBACK_MODELS = [
    m.strip() for m in os.getenv("GEMINI_FALLBACK_MODELS", "gemini-3.5-flash-lite").split(",") if m.strip()
]
MODELS = [GEMINI_MODEL] + [m for m in GEMINI_FALLBACK_MODELS if m != GEMINI_MODEL]

GEMINI_RPM = max(float(os.getenv("GEMINI_RPM", "4")), 0.1)
MAX_ATTEMPTS = int(os.getenv("GEMINI_MAX_ATTEMPTS", "4"))
MAX_WAIT_SECONDS = float(os.getenv("GEMINI_MAX_WAIT_SECONDS", "90"))

_lock = threading.Lock()
_next_slot = 0.0  # monotonic time before which no new request may start


class GeminiUnavailable(Exception):
    """Gemini could not be reached within the retry budget — try again later."""


def _reserve_slot() -> None:
    global _next_slot
    interval = 60.0 / GEMINI_RPM
    with _lock:
        now = time.monotonic()
        start = max(now, _next_slot)
        _next_slot = start + interval
    if start > now:
        time.sleep(start - now)


def _push_back(seconds: float) -> None:
    """Delay every caller, not just this one — the quota is shared."""
    global _next_slot
    with _lock:
        _next_slot = max(_next_slot, time.monotonic() + seconds)


def _status_code(exc: Exception) -> int | None:
    code = getattr(exc, "code", None)
    if isinstance(code, int):
        return code
    match = re.match(r"\s*(\d{3})\b", str(exc))
    return int(match.group(1)) if match else None


def _retry_delay(exc: Exception) -> float | None:
    text = str(exc)
    match = re.search(r"retry in ([\d.]+)s", text) or re.search(r"retryDelay['\"]?:\s*['\"]([\d.]+)s", text)
    return float(match.group(1)) if match else None


def call_gemini(fn, *, what: str = "request"):
    """
    Run `fn(model)` — a single Gemini API call for the given model id — under
    the shared rate limit, failing over across MODELS.
    """
    last_exc: Exception | None = None
    for attempt in range(1, MAX_ATTEMPTS + 1):
        wait = 0.0
        for model in MODELS:
            _reserve_slot()
            try:
                return fn(model)
            except Exception as exc:  # google.genai raises ClientError/ServerError
                last_exc = exc
                code = _status_code(exc)
                if code == 429:
                    wait = max(wait, min(_retry_delay(exc) or 30.0, MAX_WAIT_SECONDS))
                elif code is not None and code >= 500:
                    wait = max(wait, min(2.0 ** attempt * 2, MAX_WAIT_SECONDS))
                else:
                    # 4xx other than 429 (bad request, retired model id, ...) won't fix itself.
                    raise GeminiUnavailable(f"Gemini {what} failed on {model}: {code or type(exc).__name__}") from exc
                logger.warning("Gemini %s got %s on %s (attempt %d/%d)", what, code, model, attempt, MAX_ATTEMPTS)

        if attempt == MAX_ATTEMPTS:
            break
        logger.warning("All Gemini models busy for %s — waiting %.0fs", what, wait)
        _push_back(wait)

    raise GeminiUnavailable(f"Gemini {what} unavailable after {MAX_ATTEMPTS} attempts") from last_exc
