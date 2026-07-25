"""
MongoDB metadata search — structured filtering on indexed fields.

Filters emails by sender, date range, folder, attachment flag, and
read/unread status using MongoDB queries. Returns candidate email IDs
and basic metadata (subject, from, date) — **not** full body text.

Assumption: Emails are stored in a MongoDB collection with the schema
defined in ``backend/src/models/email.model.js``:
  - ``userEmail`` (String, required)
  - ``messageId`` (String, required, unique)
  - ``from`` (String, required)
  - ``to`` (String, required)
  - ``subject`` (String, required)
  - ``body`` (String, default "")
  - ``detectedDate`` (String, default null)
  - ``createdAt`` / ``updatedAt`` (timestamps)
"""

from __future__ import annotations

import logging
import time
from datetime import datetime

from pymongo import MongoClient
from pymongo.collection import Collection

import config as cfg
from router.models import SearchQuery

logger = logging.getLogger(__name__)

# Module-level connection (reused)
_client: MongoClient | None = None
_collection: Collection | None = None


def _get_collection() -> Collection:
    """Lazy-initialize and return the emails collection."""
    global _client, _collection
    if _collection is None:
        _client = MongoClient(cfg.MONGO_URI)
        db_name = cfg.resolve_mongo_db_name()
        _collection = _client[db_name]["emails"]
        logger.info("Connected to MongoDB: %s.emails", db_name)

        # Ensure useful indexes exist (idempotent)
        _collection.create_index("userEmail")
        _collection.create_index("messageId", unique=True)
        _collection.create_index("from")
        _collection.create_index("createdAt")
        _collection.create_index([("subject", "text"), ("body", "text")])
    return _collection


def search_metadata(
    query: SearchQuery,
    max_results: int = 10000,
) -> list[dict]:
    """
    Filter emails by structured metadata fields.

    Builds a MongoDB query from the SearchQuery's operators and returns
    lightweight result dicts with ``message_id``, ``subject``, ``from``,
    ``date``, and ``to`` — no body text (kept lean for the fusion stage).

    Args:
        query: Normalized SearchQuery with structured filters.
        max_results: Hard cap on returned candidates.

    Returns:
        List of dicts, each with keys:
        ``message_id``, ``subject``, ``from``, ``date``, ``to``.
    """
    coll = _get_collection()
    mongo_filter: dict = {"userEmail": query.user_email}

    # Sender filter
    if query.sender:
        mongo_filter["from"] = {"$regex": query.sender, "$options": "i"}

    # Recipients filter
    if query.recipients:
        # Match any of the specified recipients
        patterns = [{"to": {"$regex": r, "$options": "i"}} for r in query.recipients]
        mongo_filter.setdefault("$and", []).append({"$or": patterns})

    # Date range filter — use createdAt (timestamps from Mongoose)
    date_filter: dict = {}
    if query.date_range.after:
        date_filter["$gte"] = query.date_range.after
    if query.date_range.before:
        date_filter["$lte"] = query.date_range.before
    if date_filter:
        mongo_filter["createdAt"] = date_filter

    # Subject keyword filter (from subject: operator)
    if query.subject_filter:
        mongo_filter["subject"] = {
            "$regex": query.subject_filter,
            "$options": "i",
        }

    # Folder / label filters — stored as fields if present in schema
    if query.folder:
        mongo_filter["folder"] = {"$regex": query.folder, "$options": "i"}

    if query.label:
        mongo_filter["label"] = {"$regex": query.label, "$options": "i"}

    # Projection: lightweight, no body
    projection = {
        "messageId": 1,
        "subject": 1,
        "from": 1,
        "to": 1,
        "createdAt": 1,
        "_id": 0,
    }

    t0 = time.perf_counter()
    cursor = coll.find(mongo_filter, projection).limit(max_results)
    results = []
    for doc in cursor:
        created = doc.get("createdAt")
        date_str = ""
        if isinstance(created, datetime):
            date_str = created.isoformat()
        elif created is not None:
            date_str = str(created)

        results.append(
            {
                "message_id": doc.get("messageId", ""),
                "subject": doc.get("subject", ""),
                "from": doc.get("from", ""),
                "to": doc.get("to", ""),
                "date": date_str,
            }
        )

    elapsed_ms = (time.perf_counter() - t0) * 1000
    logger.info(
        "Metadata search returned %d candidates in %.1f ms (filter=%s)",
        len(results),
        elapsed_ms,
        mongo_filter,
    )
    return results


def get_email_bodies(
    message_ids: list[str], user_email: str
) -> dict[str, dict]:
    """
    Fetch full email documents for a list of message IDs.

    Used after fusion to retrieve body text for BM25 scoring and
    reranker input.

    Args:
        message_ids: List of messageId values to fetch.
        user_email: User email for security filtering.

    Returns:
        Dict mapping messageId -> full email document dict.
    """
    if not message_ids:
        return {}

    coll = _get_collection()
    cursor = coll.find(
        {"messageId": {"$in": message_ids}, "userEmail": user_email}
    )

    result = {}
    for doc in cursor:
        mid = doc.get("messageId", "")
        created = doc.get("createdAt")
        date_str = ""
        if isinstance(created, datetime):
            date_str = created.isoformat()
        elif created is not None:
            date_str = str(created)

        result[mid] = {
            "message_id": mid,
            "subject": doc.get("subject", ""),
            "from": doc.get("from", ""),
            "to": doc.get("to", ""),
            "body": doc.get("body", ""),
            "date": date_str,
        }
    return result
