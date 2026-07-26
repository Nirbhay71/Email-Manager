"""
Query router — orchestrates operator parsing and NL intent detection.

Takes a raw user query, runs it through the operator parser (regex) and
NL intent parser (spaCy), merges results into a single normalized
:class:`SearchQuery`, and decides the retrieval strategy.
"""

from __future__ import annotations

import logging
from typing import Any

from router.models import DateRange, SearchQuery
from router.nl_intent_parser import parse_nl_intent
from router.operator_parser import parse_operators

logger = logging.getLogger(__name__)


def route_query(
    raw_query: str,
    user_email: str,
    limit: int = 20,
    offset: int = 0,
) -> SearchQuery:
    """
    Parse, interpret, and normalize a raw search query.

    Pipeline:
    1. Extract structured operators via regex (``operator_parser``).
    2. Run NL intent detection on remaining free text (``nl_intent_parser``).
    3. Merge both into a single ``SearchQuery``, with operators taking
       precedence over NL-detected entities where they overlap.

    Args:
        raw_query: The user's original search string.
        user_email: Authenticated user's email (for per-user filtering).
        limit: Maximum results to return.
        offset: Pagination offset.

    Returns:
        A fully normalized ``SearchQuery`` ready for the retrieval pipeline.
    """
    # ── Step 1: Operator parsing ────────────────────────────────────────
    operators, free_text = parse_operators(raw_query)
    logger.debug("Operators parsed: %s | Free text: '%s'", operators, free_text)

    # ── Step 2: NL intent parsing on remaining free text ────────────────
    nl_intent: dict[str, Any] = {}
    if free_text.strip():
        nl_intent = parse_nl_intent(free_text)
        logger.debug("NL intent detected: %s", nl_intent)

    # ── Step 3: Merge into SearchQuery ──────────────────────────────────
    # Operators take precedence; NL fills gaps.

    # Sender
    sender = operators.get("from") or nl_intent.get("sender")

    # Recipients
    recipients: list[str] = operators.get("to", [])
    if not recipients and "recipients" in nl_intent:
        recipients = nl_intent["recipients"]

    # Subject filter
    subject_filter = operators.get("subject")

    # Date range — merge operator dates with NL-detected dates
    date_range = DateRange()
    if "after" in operators:
        date_range.after = operators["after"]
    elif "date_range" in nl_intent and "after" in nl_intent["date_range"]:
        date_range.after = nl_intent["date_range"]["after"]

    if "before" in operators:
        date_range.before = operators["before"]
    elif "date_range" in nl_intent and "before" in nl_intent["date_range"]:
        date_range.before = nl_intent["date_range"]["before"]

    # Boolean flags
    has_attachment = operators.get("has_attachment")
    is_unread = operators.get("is_unread")
    folder = operators.get("folder")
    label = operators.get("label")

    query = SearchQuery(
        raw_query=raw_query,
        operators=operators,
        free_text=free_text,
        date_range=date_range,
        sender=sender,
        recipients=recipients,
        has_attachment=has_attachment,
        folder=folder,
        is_unread=is_unread,
        label=label,
        subject_filter=subject_filter,
        limit=limit,
        offset=offset,
        user_email=user_email,
    )

    logger.info(
        "Query routed: sender=%s, free_text='%s', has_ops=%d",
        query.sender,
        query.free_text,
        len(query.operators),
    )
    return query


def needs_vector_search(query: SearchQuery) -> bool:
    """
    Decide whether a query needs vector semantic search.

    Pure-operator queries (no free text) skip the vector path since
    there's no semantic content to embed.

    Args:
        query: A normalized SearchQuery.

    Returns:
        True if vector search should be invoked.
    """
    return bool(query.free_text.strip())


def needs_bm25_search(query: SearchQuery) -> bool:
    """
    Decide whether a query needs BM25 keyword search.

    Queries with free text or a subject filter benefit from BM25.

    Args:
        query: A normalized SearchQuery.

    Returns:
        True if BM25 search should be invoked.
    """
    return bool(query.free_text.strip() or query.subject_filter)
