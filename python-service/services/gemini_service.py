import logging
import os
import threading

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
        "_2/_3/_4) in python-service/.env"
    )

# Rotation state, shared across requests within this process.
# `_current_index` is the key tried first on the next call (stays put while
# it keeps working). `_exhausted` holds indices whose quota has been hit —
# skipped until the process restarts, since Gemini quotas are typically
# daily/per-minute windows we have no reliable reset timestamp for here.
_lock = threading.Lock()
_current_index = 0
_exhausted: set[int] = set()


def _is_quota_error(exc: Exception) -> bool:
    """
    Best-effort detection of a rate-limit / quota-exceeded error. Checks
    common google-genai error attributes first, then falls back to matching
    the error text, so this doesn't depend on one exact SDK version's
    exception shape.
    """
    code = getattr(exc, "code", None)
    status = str(getattr(exc, "status", "") or "").upper()
    if code == 429 or status in ("RESOURCE_EXHAUSTED", "429"):
        return True
    text = str(exc).upper()
    return "RESOURCE_EXHAUSTED" in text or "429" in text or "QUOTA" in text


def _candidate_keys():
    """Yields (index, client) starting from the current key, rotating
    through the rest, skipping any already marked exhausted."""
    with _lock:
        start = _current_index
    for offset in range(len(_clients)):
        idx = (start + offset) % len(_clients)
        if idx not in _exhausted:
            yield idx, _clients[idx]


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
            "(and optionally _2/_3/_4) in python-service/.env."
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
                with _lock:
                    _exhausted.add(key_index)
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
    yield "Out of tokens: all configured Gemini API keys have reached their quota limit. Please try again later."
