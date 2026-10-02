"""
Background worker that classifies queued emails in batches.

The Node backend XADDs {user_email, message_id} to a Redis Stream for every
new email once the user has categories. This worker (a daemon thread inside
classifier_server, so it shares the already-loaded embedding model):

1. reads up to CLASSIFY_BATCH_SIZE jobs at a time via a consumer group,
2. embeds each email and runs the vector-only prescreen — clear matches and
   cold starts are written to Mongo immediately, no LLM call,
3. groups the ambiguous rest per user and resolves them with ONE Gemini call
   per GEMINI_BATCH_SIZE emails (all calls rate-limited by gemini_limiter),
4. acks a job only once its result is written. Jobs that hit an unavailable
   Gemini stay pending and are reclaimed after CLASSIFY_RETRY_IDLE_MS; after
   CLASSIFY_MAX_ATTEMPTS deliveries the email is left uncategorized for the
   user to sort, rather than guessed. Unclassified results are never written.
"""

import logging
import os
import socket
import threading
import time

import redis

from services.gemini_limiter import GeminiUnavailable
from services.pipeline import db_service

logger = logging.getLogger("ClassifyWorker")

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
STREAM = os.getenv("CLASSIFY_STREAM", "mailsense:classify")
GROUP = "classifier"
CONSUMER = f"{socket.gethostname()}-{os.getpid()}"
ATTEMPTS_KEY = f"{STREAM}:attempts"

BATCH_SIZE = int(os.getenv("CLASSIFY_BATCH_SIZE", "20"))
GEMINI_BATCH_SIZE = int(os.getenv("GEMINI_BATCH_SIZE", "15"))
MAX_ATTEMPTS = int(os.getenv("CLASSIFY_MAX_ATTEMPTS", "5"))
RETRY_IDLE_MS = int(os.getenv("CLASSIFY_RETRY_IDLE_MS", str(5 * 60 * 1000)))
BLOCK_MS = 5000
# redis-py 8 defaults socket_timeout to 5s — the same length as our blocking
# XREADGROUP, so every idle wait would time out. Keep the socket timeout
# comfortably above BLOCK_MS.
SOCKET_TIMEOUT_S = BLOCK_MS / 1000 + 10
BODY_SNIPPET_CHARS = 500


class ClassifyWorker:
    def __init__(self, orchestrator, embedder, chroma_store, min_examples: int, redis_client=None):
        self.orchestrator = orchestrator
        self.embedder = embedder
        self.chroma_store = chroma_store
        self.min_examples = min_examples
        self.redis = redis_client or redis.Redis.from_url(
            REDIS_URL,
            decode_responses=True,
            socket_timeout=SOCKET_TIMEOUT_S,
            socket_connect_timeout=5,
            health_check_interval=30,
        )
        self._stop = threading.Event()

    # ── lifecycle ────────────────────────────────────────────────────────────
    def start(self) -> threading.Thread:
        thread = threading.Thread(target=self.run_forever, name="classify-worker", daemon=True)
        thread.start()
        return thread

    def stop(self) -> None:
        self._stop.set()

    def _ensure_group(self) -> None:
        try:
            self.redis.xgroup_create(STREAM, GROUP, id="0", mkstream=True)
        except redis.ResponseError as exc:
            if "BUSYGROUP" not in str(exc):
                raise

    def run_forever(self) -> None:
        logger.info("Classify worker starting (stream=%s, consumer=%s)", STREAM, CONSUMER)
        while not self._stop.is_set():
            try:
                self._ensure_group()
                while not self._stop.is_set():
                    self.run_once(block_ms=BLOCK_MS)
            except (redis.ConnectionError, redis.TimeoutError) as exc:
                logger.error("Redis unavailable (%s) — retrying in 10s", exc)
                self._stop.wait(10)
            except Exception:
                logger.exception("Classify worker loop error — retrying in 5s")
                self._stop.wait(5)

    # ── one iteration ────────────────────────────────────────────────────────
    def _fetch_batch(self, block_ms: int) -> list[tuple[str, dict]]:
        # Retry jobs another delivery left pending (Gemini was down, or a
        # previous worker process died mid-batch) before taking new ones.
        _, reclaimed, *_ = self.redis.xautoclaim(
            STREAM, GROUP, CONSUMER, min_idle_time=RETRY_IDLE_MS, start_id="0-0", count=BATCH_SIZE
        )
        if reclaimed:
            return [(mid, fields) for mid, fields in reclaimed if fields]

        response = self.redis.xreadgroup(GROUP, CONSUMER, {STREAM: ">"}, count=BATCH_SIZE, block=block_ms)
        return [entry for _, entries in (response or []) for entry in entries]

    def run_once(self, block_ms: int = 0) -> int:
        batch = self._fetch_batch(block_ms)
        if not batch:
            return 0
        self.process_batch(batch)
        return len(batch)

    def _ack(self, stream_id: str) -> None:
        pipe = self.redis.pipeline()
        pipe.xack(STREAM, GROUP, stream_id)
        pipe.xdel(STREAM, stream_id)
        pipe.hdel(ATTEMPTS_KEY, stream_id)
        pipe.execute()

    def process_batch(self, batch: list[tuple[str, dict]]) -> None:
        emails_col = db_service.get_emails_col()
        ambiguous_by_user: dict[str, list[dict]] = {}

        for stream_id, fields in batch:
            user_email = fields.get("user_email")
            message_id = fields.get("message_id")
            doc = emails_col.find_one({"messageId": message_id, "userEmail": user_email}) if user_email and message_id else None
            if not doc:
                self._ack(stream_id)  # email (or account) was deleted meanwhile
                continue

            email = {
                "stream_id": stream_id,
                "user_email": user_email,
                "email_id": message_id,
                "subject": doc.get("subject", ""),
                "body": (doc.get("body") or "")[:BODY_SNIPPET_CHARS],
                "sender": doc.get("from", ""),
            }
            try:
                vector = self.embedder.embed_query(email["subject"], email["body"], email["sender"])
                screened = self.orchestrator.prescreen(user_email, vector)
            except Exception:
                logger.exception("Prescreen failed for a queued email — will retry")
                self._record_failure(email)
                continue

            if "final" in screened:
                self._write_result(email, screened["final"])
                self._ack(stream_id)
            else:
                email["candidates"] = screened["candidates"]
                ambiguous_by_user.setdefault(user_email, []).append(email)

        for user_email, emails in ambiguous_by_user.items():
            for i in range(0, len(emails), GEMINI_BATCH_SIZE):
                self._reason_chunk(user_email, emails[i:i + GEMINI_BATCH_SIZE])

    def _reason_chunk(self, user_email: str, emails: list[dict]) -> None:
        category_names = sorted({c for e in emails for c in e["candidates"]})
        logger.info("Batch-reasoning %d ambiguous emails across %d categories", len(emails), len(category_names))
        try:
            summaries = self.orchestrator.resolve_summaries(user_email, category_names)
            answers = self.orchestrator.reasoning_engine.reason_batch(emails, summaries)
        except GeminiUnavailable as exc:
            logger.warning("Gemini unavailable for this batch (%s) — leaving %d jobs queued", exc, len(emails))
            for email in emails:
                self._record_failure(email)
            return

        for email in emails:
            answer = answers.get(email["email_id"])
            if not answer:
                self._record_failure(email)  # model skipped it or answered off-list
                continue
            self._write_result(email, {
                "predicted_category": answer["category"],
                "confidence": answer["confidence"],
                "needs_review": True,
                "reasoning": answer["reason"] or "Ambiguous classification resolved by reasoning.",
            })
            self._ack(email["stream_id"])

    def _record_failure(self, email: dict) -> None:
        attempts = self.redis.hincrby(ATTEMPTS_KEY, email["stream_id"], 1)
        if attempts >= MAX_ATTEMPTS:
            # Leave the email uncategorized for the user to sort by hand.
            logger.warning("Giving up on auto-classifying an email after %d attempts", attempts)
            self._ack(email["stream_id"])
        # Otherwise leave it pending; xautoclaim hands it back after RETRY_IDLE_MS.

    def _write_result(self, email: dict, result: dict) -> None:
        category = result["predicted_category"]
        # Unclassified leaves the email untouched (no category, no review
        # flag) — same as before the queue existed.
        if category == "Unclassified":
            return

        needs_review = result["needs_review"]
        if self.chroma_store.category_count(email["user_email"], category) < self.min_examples:
            needs_review = True  # category hasn't crossed the auto-classify threshold yet

        update = {
            "category": category,
            "needsReview": needs_review,
            "confidence": result["confidence"],
            "classifyReasoning": result.get("reasoning") or None,
        }

        # Never overwrite a category the user has already confirmed by hand.
        db_service.get_emails_col().update_one(
            {
                "messageId": email["email_id"],
                "userEmail": email["user_email"],
                "$or": [{"category": None}, {"needsReview": True}],
            },
            {"$set": update},
        )
