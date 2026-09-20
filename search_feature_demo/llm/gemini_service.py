import logging
import os
import re
import threading
import time

from google import genai
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("GeminiService")

MAX_KEYS = 4


def _load_api_keys() -> list[str]:
    """
    Reads up to MAX_KEYS Gemini API keys from GEMINI_API_KEY_1..GEMINI_API_KEY_4.
    Falls back to a single GEMINI_API_KEY for backward compatibility.
    """
    keys = []
    for i in range(1, MAX_KEYS + 1):
        key = os.getenv(f"GEMINI_API_KEY_{i}")
        if key and key != "YOUR_GEMINI_API_KEY_HERE":
            keys.append(key)

    if not keys:
        single = os.getenv("GEMINI_API_KEY")
        if single and single != "YOUR_GEMINI_API_KEY_HERE":
            keys.append(single)

    return keys


_api_keys = _load_api_keys()
_clients = [genai.Client(api_key=key) for key in _api_keys]

if not _clients:
    logger.warning(
        "No Gemini API keys configured! Set GEMINI_API_KEY_1 (and optionally "
        "_2/_3/_4) in search_feature_demo/.env"
    )

# Rotation state, shared across requests within this process.
# `_current_index` is the key tried first on the next call (stays put while
# it keeps working). `_cooldown_until` maps a key's index to the time
# (time.monotonic()) before which it is skipped after hitting its quota, so a
# per-minute limit recovers on its own instead of sidelining the key until
# the process restarts.
_lock = threading.Lock()
_current_index = 0
_cooldown_until: dict[int, float] = {}

DEFAULT_COOLDOWN_S = float(os.getenv("GEMINI_KEY_COOLDOWN_SECONDS", "300"))
DAILY_COOLDOWN_S = 3600.0  # daily quotas don't reset for hours; recheck hourly

_RETRY_DELAY_RE = re.compile(r"retry(?:\s+in|Delay['\"]?\s*[:=]\s*['\"]?)\s*([0-9]+(?:\.[0-9]+)?)\s*s", re.IGNORECASE)
_HTTP_429_RE = re.compile(r"(?<![0-9])429(?![0-9])")


def _is_quota_error(exc: Exception) -> bool:
    """
    True only for a genuine rate-limit / quota-exhausted response.

    google-genai API errors carry a numeric `code` (HTTP status) and a `status`
    string; when either is present we trust it and nothing else, so a 500 or
    400 whose message merely mentions "quota" or contains "429" is not treated
    as exhaustion. Only exceptions without a structured code (e.g. a wrapped
    transport error) fall back to matching text, and then only for the two
    exact markers Google uses.
    """
    code = getattr(exc, "code", None)
    status = str(getattr(exc, "status", "") or "").upper()
    if isinstance(code, int):
        return code == 429
    if status:
        return status == "RESOURCE_EXHAUSTED"
    text = str(exc)
    return "RESOURCE_EXHAUSTED" in text.upper() or bool(_HTTP_429_RE.search(text))


def _cooldown_seconds(exc: Exception) -> float:
    """How long to keep a key out of rotation: the server's own retry hint if
    it gave one, an hour for a per-day quota, otherwise the default."""
    text = str(exc)
    match = _RETRY_DELAY_RE.search(text)
    if match:
        return max(float(match.group(1)) + 2.0, 5.0)
    if "PERDAY" in text.upper().replace(" ", "").replace("_", ""):
        return DAILY_COOLDOWN_S
    return DEFAULT_COOLDOWN_S


def _mark_exhausted(key_index: int, exc: Exception) -> None:
    with _lock:
        _cooldown_until[key_index] = time.monotonic() + _cooldown_seconds(exc)


def _candidate_keys():
    """Yields (index, client) starting from the current key, rotating through
    the rest, skipping any key still cooling down after a quota error."""
    now = time.monotonic()
    with _lock:
        start = _current_index
        cooling = {i for i, until in _cooldown_until.items() if until > now}
    for offset in range(len(_clients)):
        idx = (start + offset) % len(_clients)
        if idx not in cooling:
            yield idx, _clients[idx]


def _minutes_until_a_key_recovers() -> int:
    now = time.monotonic()
    with _lock:
        waits = [until - now for until in _cooldown_until.values() if until > now]
    return max(1, round(min(waits) / 60)) if waits else 1


def stream_answer(question: str, context_emails: list[dict]):
    """
    Streams tokens from Gemini 2.5 Flash using provided email context.

    Rotates across up to MAX_KEYS configured API keys: if the key currently
    in use has hit its quota, the next configured key is tried automatically
    within the same request. If every configured key is exhausted, yields a
    clear "out of tokens" message instead of failing silently.
    """
    if not _clients:
        yield (
            "Gemini API key is missing. Please configure GEMINI_API_KEY_1 "
            "(and optionally _2/_3/_4) in search_feature_demo/.env."
        )
        return

    context_text = ""
    for idx, email in enumerate(context_emails, 1):
        context_text += f"\n--- Email {idx}: {email.get('subject', 'No Subject')} ---\n"
        context_text += f"From: {email.get('from', 'Unknown')}\n"
        context_text += f"Content:\n{email.get('body', '')}\n"

    prompt = f"""You are an intelligent email assistant. Answer the user's question using ONLY the provided email excerpts below.
If the answer is not contained in these emails, state clearly: "I don't see that information in your emails." Do not guess or fabricate dates or details.

Email Excerpts:
{context_text}

User Question: {question}
Answer:"""

    global _current_index

    for key_index, client in _candidate_keys():
        yielded_any = False
        try:
            response = client.models.generate_content_stream(
                model="gemini-2.5-flash",
                contents=prompt
            )
            for chunk in response:
                if chunk.text:
                    yielded_any = True
                    yield chunk.text
            with _lock:
                _current_index = key_index  # keep using this key next time
            return
        except Exception as e:
            if _is_quota_error(e):
                logger.warning(f"Gemini API key #{key_index + 1} hit its quota — rotating to the next key.")
                _mark_exhausted(key_index, e)
                with _lock:
                    _current_index = (key_index + 1) % len(_clients)
                if yielded_any:
                    # Already streamed part of an answer on this key — don't
                    # silently restart from scratch on a different key.
                    yield "\n[Response interrupted by an API quota limit — please resend your question.]"
                    return
                continue  # try the next candidate key for this same request

            logger.error(f"Gemini streaming error on key #{key_index + 1}: {e}")
            yield f"\n[Error generating answer: {str(e)}]"
            return

    logger.error("All configured Gemini API keys have reached their quota.")
    yield (
        "Out of tokens: all configured Gemini API keys have reached their quota limit. "
        f"Please try again in about {_minutes_until_a_key_recovers()} min."
    )
