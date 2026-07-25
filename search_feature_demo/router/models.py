"""
Pydantic models for the search API contract.

These models are shared across HTTP, gRPC, and internal pipeline interfaces
to ensure a single source of truth for data shapes.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Query Models
# ---------------------------------------------------------------------------


class DateRange(BaseModel):
    """Represents a date window for filtering emails."""

    after: datetime | None = None
    before: datetime | None = None


class SearchQuery(BaseModel):
    """
    Normalized, fully-parsed search query produced by the query router.

    Combines structured operators (from:, to:, etc.) with free-text
    extracted from the raw query string.
    """

    raw_query: str = ""
    operators: dict[str, Any] = Field(default_factory=dict)
    free_text: str = ""
    date_range: DateRange = Field(default_factory=DateRange)
    sender: str | None = None
    recipients: list[str] = Field(default_factory=list)
    has_attachment: bool | None = None
    folder: str | None = None
    is_unread: bool | None = None
    label: str | None = None
    subject_filter: str | None = None
    limit: int = 20
    offset: int = 0
    user_email: str = ""


# ---------------------------------------------------------------------------
# Score Breakdown
# ---------------------------------------------------------------------------


class ScoreBreakdown(BaseModel):
    """Per-result score breakdown from each pipeline stage."""

    bm25: float = 0.0
    vector: float = 0.0
    rerank: float = 0.0
    final: float = 0.0


# ---------------------------------------------------------------------------
# Result Models
# ---------------------------------------------------------------------------


class SearchResult(BaseModel):
    """A single search result with full score breakdown."""

    email_id: str
    subject: str = ""
    sender: str = ""
    date: str = ""
    snippet: str = ""
    scores: ScoreBreakdown = Field(default_factory=ScoreBreakdown)


class QueryInterpretation(BaseModel):
    """Shows how the query was parsed — returned to the caller for transparency."""

    operators: dict[str, Any] = Field(default_factory=dict)
    free_text: str = ""
    detected_sender: str | None = None
    detected_date_range: DateRange | None = None


class StageTimings(BaseModel):
    """Millisecond-resolution timings for each pipeline stage."""

    total_ms: float = 0.0
    routing_ms: float = 0.0
    metadata_ms: float = 0.0
    bm25_ms: float = 0.0
    vector_ms: float = 0.0
    fusion_ms: float = 0.0
    fetch_ms: float = 0.0
    rerank_ms: float = 0.0


class SearchResponse(BaseModel):
    """Top-level API response for a search request."""

    results: list[SearchResult] = Field(default_factory=list)
    total: int = 0
    query_interpretation: QueryInterpretation = Field(
        default_factory=QueryInterpretation
    )
    timings: StageTimings = Field(default_factory=StageTimings)
    degraded: bool = False
    stages_timed_out: list[str] = Field(default_factory=list)
