"""
BM25 keyword search using ``rank_bm25``.

Fetches candidate documents from MongoDB (filtered by ``user_email``),
tokenizes ``subject + body``, builds a BM25Okapi index, and scores
against the free-text query.

Design choice: we use ``rank_bm25`` (in-memory pure-Python BM25) rather
than MongoDB's ``$text`` / ``textScore`` because:
  1. True BM25 (Okapi variant) produces more nuanced relevance scores
     than Mongo's simpler ``textScore`` implementation.
  2. The BM25 scores are on a comparable scale for RRF fusion.
  3. Mongo ``$text`` is still used as a pre-filter in the metadata path
     when a ``subject:`` operator is present.

The corpus is cached per-user so repeated queries within a session don't
re-fetch and re-tokenize every email.
"""

from __future__ import annotations

import logging
import re
import time
from typing import Any

from cachetools import TTLCache
from rank_bm25 import BM25Okapi

from retrieval.mongo_metadata_search import _get_collection

import config as cfg

logger = logging.getLogger(__name__)

# Per-user corpus cache: user_email -> (message_ids, bm25_index, doc_metadata)
_corpus_cache: TTLCache[str, tuple[list[str], BM25Okapi, list[dict]]] = TTLCache(
    maxsize=64, ttl=300  # 5-minute TTL; invalidated on new email ingestion
)

# Simple tokenizer: lowercase, split on non-alphanumeric
_TOKEN_RE = re.compile(r"[a-z0-9]+")


def _tokenize(text: str) -> list[str]:
    """
    Tokenize text for BM25 indexing.

    Lowercases and splits on non-alphanumeric characters.

    Args:
        text: Raw text to tokenize.

    Returns:
        List of lowercase tokens.
    """
    return _TOKEN_RE.findall(text.lower())


def _build_corpus(user_email: str) -> tuple[list[str], BM25Okapi, list[dict]]:
    """
    Build (or retrieve cached) BM25 corpus for a user.

    Fetches all emails for the user from MongoDB, tokenizes
    ``subject + body``, and constructs a BM25Okapi index.

    Args:
        user_email: The user whose emails to index.

    Returns:
        Tuple of (message_ids, bm25_index, doc_metadata_list).
    """
    cached = _corpus_cache.get(user_email)
    if cached is not None:
        logger.debug("BM25 corpus cache hit for user=%s", user_email)
        return cached

    logger.info("Building BM25 corpus for user=%s", user_email)
    t0 = time.perf_counter()

    coll = _get_collection()
    cursor = coll.find(
        {"userEmail": user_email},
        {"messageId": 1, "subject": 1, "body": 1, "from": 1, "to": 1, "createdAt": 1, "_id": 0},
    )

    message_ids: list[str] = []
    tokenized_corpus: list[list[str]] = []
    doc_metadata: list[dict] = []

    for doc in cursor:
        mid = doc.get("messageId", "")
        subject = doc.get("subject", "")
        body = doc.get("body", "")
        text = f"{subject} {body}"
        tokens = _tokenize(text)

        message_ids.append(mid)
        tokenized_corpus.append(tokens)
        doc_metadata.append(
            {
                "message_id": mid,
                "subject": subject,
                "from": doc.get("from", ""),
                "to": doc.get("to", ""),
                "date": str(doc.get("createdAt", "")),
            }
        )

    if not tokenized_corpus:
        # Empty corpus — create a dummy BM25 to avoid errors
        bm25 = BM25Okapi([["_empty_"]])
        result = (["_empty_"], bm25, [{}])
        _corpus_cache[user_email] = result
        return result

    bm25 = BM25Okapi(tokenized_corpus)
    elapsed_ms = (time.perf_counter() - t0) * 1000
    logger.info(
        "BM25 corpus built: %d documents in %.1f ms",
        len(message_ids),
        elapsed_ms,
    )

    result = (message_ids, bm25, doc_metadata)
    _corpus_cache[user_email] = result
    return result


def search_bm25(
    query_text: str,
    user_email: str,
    top_k: int | None = None,
    candidate_ids: set[str] | None = None,
) -> list[dict[str, Any]]:
    """
    Run BM25 keyword search for a query against a user's email corpus.

    Args:
        query_text: Free-text query to score against.
        user_email: User whose emails to search.
        top_k: Number of top results to return (default from config).
        candidate_ids: Optional set of message_ids to restrict search to
            (used when metadata pre-filtering has narrowed candidates).

    Returns:
        List of dicts with ``message_id``, ``score``, ``subject``.
        Sorted by score descending.
    """
    if top_k is None:
        top_k = cfg.BM25_TOP_K

    if not query_text.strip():
        return []

    t0 = time.perf_counter()
    message_ids, bm25, doc_metadata = _build_corpus(user_email)

    query_tokens = _tokenize(query_text)
    if not query_tokens:
        return []

    scores = bm25.get_scores(query_tokens)

    # Build scored results
    scored: list[tuple[int, float]] = []
    for idx, score in enumerate(scores):
        if score <= 0.0:
            continue
        mid = message_ids[idx]
        if candidate_ids is not None and mid not in candidate_ids:
            continue
        scored.append((idx, float(score)))

    # Sort by score descending, take top_k
    scored.sort(key=lambda x: x[1], reverse=True)
    scored = scored[:top_k]

    results = []
    for idx, score in scored:
        meta = doc_metadata[idx] if idx < len(doc_metadata) else {}
        results.append(
            {
                "message_id": message_ids[idx],
                "score": score,
                "subject": meta.get("subject", ""),
            }
        )

    elapsed_ms = (time.perf_counter() - t0) * 1000
    logger.info(
        "BM25 search returned %d results in %.1f ms (query='%s')",
        len(results),
        elapsed_ms,
        query_text[:50],
    )
    return results


def invalidate_user_corpus(user_email: str) -> None:
    """
    Invalidate the cached BM25 corpus for a user.

    Call this when new emails are ingested so the next search
    rebuilds the index with fresh data.

    Args:
        user_email: The user whose cache to invalidate.
    """
    _corpus_cache.pop(user_email, None)
    logger.info("BM25 corpus cache invalidated for user=%s", user_email)
