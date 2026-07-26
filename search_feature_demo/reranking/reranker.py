"""
Cross-encoder reranker using ``BAAI/bge-reranker-v2-m3``.

Reranks fused candidate lists against the original free-text query
using a cross-encoder model for high-precision relevance scoring.

The reranker is **lazy-loaded** on first use to conserve GPU memory —
with a 6 GB VRAM budget shared between the embedding model (~3 GB)
and the reranker (~2.2 GB), this avoids OOM by only loading the
reranker when it's actually needed. Falls back to CPU if CUDA memory
is insufficient.
"""

from __future__ import annotations

import logging
import time
from typing import Any

import config as cfg

logger = logging.getLogger(__name__)

# Lazy singleton
_model = None
_model_device: str | None = None


def _get_model():
    """
    Lazy-load the cross-encoder reranker model.

    Attempts GPU first; falls back to CPU if CUDA OOM occurs.
    """
    global _model, _model_device
    if _model is not None:
        return _model

    from sentence_transformers import CrossEncoder

    device = cfg.resolve_device()
    model_name = cfg.RERANKER_MODEL

    try:
        logger.info("Loading reranker model: %s on %s", model_name, device)
        _model = CrossEncoder(model_name, device=device, local_files_only=True)
        _model_device = device
        logger.info("Reranker loaded successfully on %s.", device)
    except Exception as exc:
        if device == "cuda":
            logger.warning(
                "Failed to load reranker on CUDA (%s). Falling back to CPU.",
                exc,
            )
            _model = CrossEncoder(model_name, device="cpu", local_files_only=True)
            _model_device = "cpu"
            logger.info("Reranker loaded on CPU (fallback).")
        else:
            raise

    return _model


def _extract_snippet(body: str, query: str, max_len: int = 200) -> str:
    """
    Extract a relevant snippet from the email body.

    Searches for the first occurrence of any query word in the body
    and returns a window around it.

    Args:
        body: Full email body text.
        query: The user's search query.
        max_len: Maximum snippet length.

    Returns:
        A text snippet, or the first ``max_len`` chars if no match found.
    """
    if not body:
        return ""

    body_lower = body.lower()
    query_words = query.lower().split()

    best_pos = len(body)
    for word in query_words:
        pos = body_lower.find(word)
        if 0 <= pos < best_pos:
            best_pos = pos

    if best_pos >= len(body):
        # No match; return beginning
        return body[:max_len].strip() + ("..." if len(body) > max_len else "")

    # Window around the match
    start = max(0, best_pos - 40)
    end = min(len(body), start + max_len)
    snippet = body[start:end].strip()
    if start > 0:
        snippet = "..." + snippet
    if end < len(body):
        snippet += "..."
    return snippet


def rerank(
    query: str,
    candidates: list[dict[str, Any]],
    batch_size: int | None = None,
    top_n: int | None = None,
) -> list[dict[str, Any]]:
    """
    Rerank candidates using the cross-encoder model.

    Pairs the query with each candidate's ``subject + body`` text,
    runs cross-encoder inference in batches, and returns re-sorted
    results with reranker scores.

    Args:
        query: The user's original free-text query.
        candidates: List of candidate dicts, each with at least
            ``message_id``, ``subject``, and optionally ``body``.
        batch_size: Inference batch size (default from config).
        top_n: Maximum candidates to process (default from config).

    Returns:
        Re-sorted list of dicts with added ``rerank_score``,
        ``matched_snippet``, and ``final_score`` fields.
    """
    if batch_size is None:
        batch_size = cfg.RERANK_BATCH_SIZE
    if top_n is None:
        top_n = cfg.RERANK_TOP_N

    if not candidates or not query.strip():
        return candidates

    # Cap at top_n candidates
    candidates = candidates[:top_n]

    t0 = time.perf_counter()
    model = _get_model()

    # Build query-document pairs
    pairs: list[list[str]] = []
    for cand in candidates:
        doc_text = cand.get("subject", "")
        body = cand.get("body", "")
        if body:
            # Truncate body to avoid exceeding model's max sequence length
            doc_text = f"{doc_text} {body[:1500]}"
        pairs.append([query, doc_text])

    # Batch inference
    scores = model.predict(pairs, batch_size=batch_size, show_progress_bar=False)

    # Attach reranker scores and compute final score
    for idx, cand in enumerate(candidates):
        rerank_score = float(scores[idx])
        cand["rerank_score"] = rerank_score

        # Final score: weighted combination of RRF and reranker
        rrf_score = cand.get("rrf_score", 0.0)
        # Normalize reranker score to [0, 1] range using sigmoid-like mapping
        # bge-reranker outputs logits; higher = more relevant
        import math

        norm_rerank = 1.0 / (1.0 + math.exp(-rerank_score))
        cand["final_score"] = 0.3 * rrf_score * 100 + 0.7 * norm_rerank

        # Extract snippet
        cand["matched_snippet"] = _extract_snippet(
            cand.get("body", ""), query
        )

    # Sort by final_score descending
    candidates.sort(key=lambda x: x.get("final_score", 0.0), reverse=True)

    elapsed_ms = (time.perf_counter() - t0) * 1000
    logger.info(
        "Reranked %d candidates in %.1f ms (device=%s, batch=%d)",
        len(candidates),
        elapsed_ms,
        _model_device,
        batch_size,
    )
    return candidates
