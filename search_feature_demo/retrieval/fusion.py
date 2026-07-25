"""
Reciprocal Rank Fusion (RRF) for combining ranked result lists.

Merges BM25 and vector search results (and optionally more rankers)
into a single ranked list using the RRF formula:

    ``RRF_Score(doc) = sum( 1 / (k + rank_i) )``

where ``k`` is a constant (default 60, from the original RRF paper)
and ``rank_i`` is the 1-based rank of the document in each ranker's list.

After fusion, the results can be filtered against a metadata candidate
set to enforce structured constraints.
"""

from __future__ import annotations

import logging
from typing import Any

import config as cfg

logger = logging.getLogger(__name__)


def reciprocal_rank_fusion(
    *ranked_lists: list[dict[str, Any]],
    k: int | None = None,
    top_n: int | None = None,
) -> list[dict[str, Any]]:
    """
    Fuse multiple ranked result lists using Reciprocal Rank Fusion.

    Each ranked list is expected to be a list of dicts with at least
    a ``"message_id"`` key. Additional fields (``score``, ``subject``)
    are preserved from the first list that contains each document.

    Args:
        *ranked_lists: One or more ranked result lists to fuse.
        k: RRF constant (default 60). Higher values dampen rank differences.
        top_n: Maximum number of results to return after fusion.

    Returns:
        Fused and re-sorted list of dicts with ``message_id``,
        ``rrf_score``, and original per-ranker scores.
    """
    if k is None:
        k = cfg.RRF_K
    if top_n is None:
        top_n = cfg.RERANK_TOP_N

    # Accumulate RRF scores
    rrf_scores: dict[str, float] = {}
    # Track per-ranker scores and metadata for each doc
    doc_data: dict[str, dict[str, Any]] = {}

    for list_idx, ranked_list in enumerate(ranked_lists):
        ranker_name = f"ranker_{list_idx}"
        for rank, item in enumerate(ranked_list):
            msg_id = item["message_id"]
            rrf_contribution = 1.0 / (k + rank + 1)
            rrf_scores[msg_id] = rrf_scores.get(msg_id, 0.0) + rrf_contribution

            # Store metadata from first encounter
            if msg_id not in doc_data:
                doc_data[msg_id] = {
                    "message_id": msg_id,
                    "subject": item.get("subject", ""),
                    "bm25_score": 0.0,
                    "vector_score": 0.0,
                }

            # Track individual ranker scores
            raw_score = item.get("score", 0.0)
            if list_idx == 0:
                doc_data[msg_id]["bm25_score"] = raw_score
            elif list_idx == 1:
                doc_data[msg_id]["vector_score"] = raw_score

    # Sort by RRF score descending
    sorted_ids = sorted(rrf_scores.items(), key=lambda x: x[1], reverse=True)

    results: list[dict[str, Any]] = []
    for msg_id, rrf_score in sorted_ids[:top_n]:
        entry = doc_data[msg_id].copy()
        entry["rrf_score"] = rrf_score
        results.append(entry)

    logger.info(
        "RRF fusion: %d unique docs from %d rankers -> top %d returned",
        len(rrf_scores),
        len(ranked_lists),
        len(results),
    )
    return results


def filter_by_metadata_candidates(
    fused_results: list[dict[str, Any]],
    metadata_ids: set[str] | None,
) -> list[dict[str, Any]]:
    """
    Filter fused results to only include docs present in the metadata set.

    If ``metadata_ids`` is None (no metadata filtering was applied),
    all fused results pass through unchanged.

    Args:
        fused_results: Output of :func:`reciprocal_rank_fusion`.
        metadata_ids: Set of message_ids from the metadata filter,
            or None to skip filtering.

    Returns:
        Filtered list preserving the fused ranking order.
    """
    if metadata_ids is None:
        return fused_results

    filtered = [r for r in fused_results if r["message_id"] in metadata_ids]
    logger.info(
        "Metadata filter: %d -> %d candidates (removed %d)",
        len(fused_results),
        len(filtered),
        len(fused_results) - len(filtered),
    )
    return filtered
