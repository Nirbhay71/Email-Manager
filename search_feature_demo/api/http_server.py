"""
FastAPI HTTP server for the search service.

Exposes two endpoints:
  - ``POST /api/v1/search`` — primary search endpoint.
  - ``GET  /api/v1/search/health`` — readiness health check.

Delegates all search logic to :class:`SearchPipeline` — no business
logic lives in this file.
"""

from __future__ import annotations

import logging
import uuid

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from pipeline.search_pipeline import get_search_pipeline
from router.models import SearchResponse

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Request / Response models for the HTTP layer
# ---------------------------------------------------------------------------


class SearchRequest(BaseModel):
    """Request body for ``POST /api/v1/search``."""

    query: str = Field(..., min_length=1, description="The search query string.")
    user_email: str = Field(
        ..., min_length=1, description="Authenticated user's email address."
    )
    limit: int = Field(default=20, ge=1, le=100, description="Max results to return.")
    offset: int = Field(default=0, ge=0, description="Pagination offset.")


class HealthResponse(BaseModel):
    """Response for ``GET /api/v1/search/health``."""

    status: str = "ok"
    service: str = "search-service"
    version: str = "1.0.0"


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------


def create_app() -> FastAPI:
    """
    Create and configure the FastAPI application.

    Returns:
        Configured FastAPI instance with search routes and CORS middleware.
    """
    app = FastAPI(
        title="AI Email Search Service",
        description=(
            "Hybrid email search combining structured operators, "
            "BM25 keyword search, semantic vector search, and cross-encoder "
            "reranking."
        ),
        version="1.0.0",
    )

    # CORS — allow the existing Express frontend to call this service
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Health check ────────────────────────────────────────────────────

    @app.get("/api/v1/search/health", response_model=HealthResponse)
    async def health_check():
        """
        Readiness health check.

        Returns a simple JSON object confirming the service is alive.
        """
        return HealthResponse()

    # ── Search endpoint ─────────────────────────────────────────────────

    @app.post("/api/v1/search", response_model=SearchResponse)
    async def search(body: SearchRequest, request: Request):
        """
        Primary search endpoint.

        Accepts a search query and returns ranked email results with
        score breakdowns and query interpretation.

        Args:
            body: SearchRequest with query, user_email, limit, offset.
            request: FastAPI request object for headers/state.

        Returns:
            SearchResponse with ranked results and metadata.
        """
        request_id = request.headers.get("X-Request-ID", uuid.uuid4().hex[:8])

        logger.info(
            "[%s] POST /api/v1/search query='%s' user=%s",
            request_id,
            body.query,
            body.user_email,
        )

        pipeline = get_search_pipeline()

        try:
            response = pipeline.search(
                raw_query=body.query,
                user_email=body.user_email,
                limit=body.limit,
                offset=body.offset,
                request_id=request_id,
            )
            return response
        except Exception as exc:
            logger.error(
                "[%s] Search pipeline error: %s", request_id, exc, exc_info=True
            )
            return JSONResponse(
                status_code=500,
                content={"error": f"Internal search error: {str(exc)}"},
            )

    # ── Cache invalidation webhook ──────────────────────────────────────

    @app.post("/api/v1/search/invalidate")
    async def invalidate_cache(request: Request):
        """
        Invalidate search cache for a user.

        Called when new emails are ingested to ensure fresh results.
        Expects JSON body: ``{"user_email": "..."}``
        """
        body = await request.json()
        user_email = body.get("user_email", "")
        if not user_email:
            return JSONResponse(
                status_code=400,
                content={"error": "user_email is required"},
            )

        pipeline = get_search_pipeline()
        count = pipeline._cache.invalidate_user(user_email)

        # Also invalidate BM25 corpus cache
        from retrieval.bm25_search import invalidate_user_corpus

        invalidate_user_corpus(user_email)

        return {"invalidated_entries": count, "user_email": user_email}

    return app
