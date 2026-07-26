"""
Search pipeline — the single shared orchestrator for HTTP and gRPC.

Coordinates:
  1. Query routing (operator + NL parsing)
  2. Parallel retrieval (metadata filter, BM25, vector search)
  3. Reciprocal Rank Fusion
  4. Cross-encoder reranking
  5. Response assembly

Each stage is independently timed and wrapped in error handling so
that a failure in one retrieval path (e.g. vector search) degrades
gracefully to the remaining paths rather than failing the request.
"""

from __future__ import annotations

import logging
import time
import uuid
import concurrent.futures
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Any

import config as cfg
from cache.query_cache import InMemoryQueryCache, get_query_cache
from reranking.reranker import rerank
from retrieval.bm25_search import search_bm25
from retrieval.fusion import filter_by_metadata_candidates, reciprocal_rank_fusion
from retrieval.mongo_metadata_search import get_email_bodies, search_metadata
from retrieval.vector_search import search_vectors
from router.models import (
    QueryInterpretation,
    ScoreBreakdown,
    SearchQuery,
    SearchResponse,
    SearchResult,
    StageTimings,
)
from router.query_router import needs_bm25_search, needs_vector_search, route_query

logger = logging.getLogger(__name__)


class SearchPipeline:
    """
    Orchestrates the full search pipeline from raw query to ranked results.

    Both the HTTP API and gRPC server call :meth:`search` on a shared
    instance — no duplicated logic.

    Args:
        cache: Query cache instance (defaults to module singleton).
    """

    def __init__(self, cache: InMemoryQueryCache | None = None) -> None:
        self._cache = cache or get_query_cache()
        self._executor = ThreadPoolExecutor(max_workers=3)

    def _stage_timeout(self, name: str) -> float:
        return cfg.STAGE_TIMEOUTS.get(name, 2.0)

    def search(
        self,
        raw_query: str,
        user_email: str,
        limit: int = 20,
        offset: int = 0,
        request_id: str | None = None,
    ) -> SearchResponse:
        """
        Execute the full search pipeline.

        Args:
            raw_query: The user's raw search string.
            user_email: Authenticated user email for per-user filtering.
            limit: Maximum results to return.
            offset: Pagination offset.
            request_id: Optional request ID for log correlation.

        Returns:
            A :class:`SearchResponse` with ranked results, interpretation,
            and per-stage timing information.
        """
        if not request_id:
            request_id = uuid.uuid4().hex[:8]

        log = logger.bind(request_id=request_id) if hasattr(logger, "bind") else logger
        log.info("Search request: query='%s', user=%s", raw_query, user_email)

        timings = StageTimings()
        t_total = time.perf_counter()

        # ── Check cache ─────────────────────────────────────────────────
        cache_key = InMemoryQueryCache.make_key(
            raw_query, user_email, limit=limit, offset=offset
        )
        cached = self._cache.get(cache_key)
        if cached is not None:
            log.info("Returning cached result for key=%s", cache_key)
            return cached

        # ── Stage 1: Query Routing ──────────────────────────────────────
        t0 = time.perf_counter()
        query = route_query(raw_query, user_email, limit=limit, offset=offset)
        timings.routing_ms = (time.perf_counter() - t0) * 1000

        interpretation = QueryInterpretation(
            operators=query.operators,
            free_text=query.free_text,
            detected_sender=query.sender,
            detected_date_range=query.date_range if (query.date_range.after or query.date_range.before) else None,
        )

        # ── Stage 2: Parallel Retrieval ─────────────────────────────────
        metadata_results: list[dict] = []
        bm25_results: list[dict[str, Any]] = []
        vector_results: list[dict[str, Any]] = []

        futures = {}
        has_structured_filters = bool(
            query.sender
            or query.recipients
            or query.date_range.after
            or query.date_range.before
            or query.subject_filter
            or query.has_attachment is not None
            or query.is_unread is not None
            or query.folder
            or query.label
        )

        def _run_stage(func, *args):
            t_start = time.perf_counter()
            res = func(*args)
            return res, (time.perf_counter() - t_start) * 1000

        # Always run metadata search if structured filters exist
        if has_structured_filters:
            futures["metadata"] = self._executor.submit(_run_stage, search_metadata, query)

        # BM25 if free text present
        if needs_bm25_search(query):
            search_text = query.free_text or query.subject_filter or ""
            futures["bm25"] = self._executor.submit(
                _run_stage, search_bm25, search_text, user_email
            )

        # Vector search if free text present
        if needs_vector_search(query):
            futures["vector"] = self._executor.submit(
                _run_stage, search_vectors, query.free_text, user_email
            )

        # If no retrieval paths were triggered (e.g. empty query), do a broad metadata fetch
        if not futures:
            futures["metadata"] = self._executor.submit(_run_stage, search_metadata, query)

        degraded = False
        stages_timed_out = []

        # Collect results with error isolation
        for name, future in futures.items():
            try:
                result, elapsed_ms = future.result(timeout=self._stage_timeout(name))
                if name == "metadata":
                    metadata_results = result
                    timings.metadata_ms = elapsed_ms
                elif name == "bm25":
                    bm25_results = result
                    timings.bm25_ms = elapsed_ms
                elif name == "vector":
                    vector_results = result
                    timings.vector_ms = elapsed_ms
            except (TimeoutError, concurrent.futures.TimeoutError):
                log.warning("Stage '%s' timed out — continuing without it.", name)
                degraded = True
                stages_timed_out.append(name)
            except Exception as exc:
                log.warning(
                    "Stage '%s' failed (%s) — continuing without it.",
                    name,
                    exc,
                    exc_info=True,
                )

        # ── Stage 3: Fusion ─────────────────────────────────────────────
        t0 = time.perf_counter()

        # Build ranker lists for RRF
        ranker_lists: list[list[dict[str, Any]]] = []
        if bm25_results:
            ranker_lists.append(bm25_results)
        if vector_results:
            ranker_lists.append(vector_results)

        if ranker_lists:
            fused = reciprocal_rank_fusion(*ranker_lists)
        elif metadata_results:
            # Only metadata — use it directly with synthetic scores
            fused = [
                {
                    "message_id": r["message_id"],
                    "subject": r.get("subject", ""),
                    "rrf_score": 1.0,
                    "bm25_score": 0.0,
                    "vector_score": 0.0,
                }
                for r in metadata_results
            ]
        else:
            fused = []

        # Apply metadata filter if structured filters were used
        if has_structured_filters and metadata_results:
            metadata_ids = {r["message_id"] for r in metadata_results}
            fused = filter_by_metadata_candidates(fused, metadata_ids)

        timings.fusion_ms = (time.perf_counter() - t0) * 1000

        # ── Stage 4: Fetch bodies for reranking ─────────────────────────
        t0 = time.perf_counter()
        if fused and query.free_text.strip():
            fused_ids = [r["message_id"] for r in fused[: cfg.RERANK_TOP_N]]
            bodies = get_email_bodies(fused_ids, user_email)
            for item in fused:
                mid = item["message_id"]
                if mid in bodies:
                    item["body"] = bodies[mid].get("body", "")
                    item["from"] = bodies[mid].get("from", "")
                    item["to"] = bodies[mid].get("to", "")
                    item["date"] = bodies[mid].get("date", "")
                    if not item.get("subject"):
                        item["subject"] = bodies[mid].get("subject", "")
        timings.fetch_ms = (time.perf_counter() - t0) * 1000

        # ── Stage 5: Reranking ──────────────────────────────────────────
        t0 = time.perf_counter()
        if fused and query.free_text.strip():
            try:
                fused = rerank(query.free_text, fused)
            except Exception as exc:
                log.warning("Reranking failed (%s) — using fusion order.", exc)
                # Fall back to RRF order; set rerank scores to 0
                for item in fused:
                    item.setdefault("rerank_score", 0.0)
                    item.setdefault("final_score", item.get("rrf_score", 0.0))
                    item.setdefault("matched_snippet", "")
        else:
            # No free text — skip reranking, use RRF scores as final
            for item in fused:
                item.setdefault("rerank_score", 0.0)
                item.setdefault("final_score", item.get("rrf_score", 0.0))
                item.setdefault("matched_snippet", "")

        timings.rerank_ms = (time.perf_counter() - t0) * 1000

        # ── Stage 6: Assemble response ─────────────────────────────────
        # Apply offset and limit
        paginated = fused[offset : offset + limit]

        results: list[SearchResult] = []
        for item in paginated:
            results.append(
                SearchResult(
                    email_id=item["message_id"],
                    subject=item.get("subject", ""),
                    sender=item.get("from", ""),
                    date=item.get("date", ""),
                    snippet=item.get("matched_snippet", ""),
                    scores=ScoreBreakdown(
                        bm25=item.get("bm25_score", 0.0),
                        vector=item.get("vector_score", 0.0),
                        rerank=item.get("rerank_score", 0.0),
                        final=item.get("final_score", 0.0),
                    ),
                )
            )

        timings.total_ms = (time.perf_counter() - t_total) * 1000

        response = SearchResponse(
            results=results,
            total=len(fused),
            query_interpretation=interpretation,
            timings=timings,
            degraded=degraded,
            stages_timed_out=stages_timed_out,
        )

        # Cache the response
        self._cache.set(cache_key, response, user_email=user_email)

        log.info(
            "Search completed: %d results in %.1f ms "
            "(routing=%.1f, meta=%.1f, bm25=%.1f, vec=%.1f, fusion=%.1f, rerank=%.1f)",
            len(results),
            timings.total_ms,
            timings.routing_ms,
            timings.metadata_ms,
            timings.bm25_ms,
            timings.vector_ms,
            timings.fusion_ms,
            timings.rerank_ms,
        )
        return response

    @staticmethod
    def _stage_timeout(stage_name: str) -> float:
        """Return the timeout budget (seconds) for a given stage."""
        timeouts = {
            "metadata": cfg.TIMEOUT_METADATA_S,
            "bm25": cfg.TIMEOUT_BM25_S,
            "vector": cfg.TIMEOUT_VECTOR_S,
            "fusion": cfg.TIMEOUT_FUSION_S,
            "rerank": cfg.TIMEOUT_RERANK_S,
        }
        return timeouts.get(stage_name, 5.0)

    @staticmethod
    def _elapsed_from(future) -> float:
        """
        Placeholder for future-based elapsed time tracking.

        In the current implementation, per-stage timing is handled
        by the stage functions themselves (they log internally).
        This returns 0.0 as a default.
        """
        return 0.0


# Module-level singleton
_pipeline: SearchPipeline | None = None


def get_search_pipeline() -> SearchPipeline:
    """Return the module-level singleton SearchPipeline."""
    global _pipeline
    if _pipeline is None:
        _pipeline = SearchPipeline()
    return _pipeline
