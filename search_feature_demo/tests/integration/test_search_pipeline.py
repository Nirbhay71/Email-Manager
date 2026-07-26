"""
Integration tests for the full search pipeline.

Seeds a test MongoDB and ChromaDB with ~200 synthetic emails, then
runs operator-only, NL-only, and mixed queries with assertions on
result ranking and correctness.

Requires:
  - A running MongoDB instance (uses a test database that is cleaned up).
  - No ChromaDB server needed (uses PersistentClient with temp dir).

These tests are SKIPPED if MongoDB is not reachable to avoid CI failures
when a database isn't available.
"""

from __future__ import annotations

import os
import sys
import random
import shutil
import string
import tempfile
from datetime import datetime, timedelta

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

# Attempt MongoDB connection; skip all tests if unavailable
_mongo_available = False
try:
    from pymongo import MongoClient

    _client = MongoClient("mongodb://localhost:27017", serverSelectionTimeoutMS=2000)
    _client.server_info()
    _mongo_available = True
except Exception:
    pass

pytestmark = pytest.mark.skipif(
    not _mongo_available,
    reason="MongoDB not reachable at localhost:27017",
)

TEST_DB = "test_search_integration"
TEST_USER = "testuser@integration.com"
CHROMA_TMP: str = ""

# Synthetic email data
SENDERS = [
    "sarah.johnson@company.com",
    "john.doe@partner.org",
    "alice.wong@startup.io",
    "bob.smith@university.edu",
    "carol.martinez@agency.gov",
]

SUBJECTS_POOL = [
    "Q3 Budget Review and Approval",
    "Meeting Notes: Product Roadmap",
    "Internship Application Deadline Extended",
    "Project Alpha Status Update",
    "Invoice #2024-0847 Payment Due",
    "Conference Travel Approval Request",
    "Weekly Sprint Standup Summary",
    "Partnership Opportunity with TechCorp",
    "Employee Onboarding Checklist",
    "Quarterly Sales Report Draft",
    "Server Migration Timeline",
    "Customer Feedback Analysis Results",
    "New Feature Spec: Search Engine",
    "Holiday Schedule Announcement",
    "Security Audit Findings Report",
]

BODY_SNIPPETS = [
    "Please review the attached budget spreadsheet for Q3.",
    "As discussed in today's meeting, we need to finalize the roadmap by Friday.",
    "The internship application deadline has been extended to December 15th.",
    "Project Alpha is on track. All milestones are green.",
    "Payment for invoice #2024-0847 is due by end of month.",
    "I'd like to request travel approval for the upcoming conference.",
    "Sprint velocity improved by 15% this week.",
    "TechCorp is interested in a strategic partnership.",
    "New employee onboarding should follow the attached checklist.",
    "Q3 sales exceeded projections by 12%.",
    "Server migration to cloud is scheduled for next week.",
    "Customer satisfaction scores improved across all segments.",
    "The search engine feature specification is ready for review.",
    "Office will be closed on December 25th and January 1st.",
    "Security audit found 3 medium-severity issues.",
]


def _generate_emails(count: int = 200) -> list[dict]:
    """Generate synthetic email documents for testing."""
    emails = []
    base_date = datetime(2024, 6, 1)

    for i in range(count):
        subject_idx = i % len(SUBJECTS_POOL)
        body_idx = i % len(BODY_SNIPPETS)
        sender_idx = i % len(SENDERS)

        # Add some variation
        suffix = "".join(random.choices(string.ascii_lowercase, k=8))
        emails.append(
            {
                "userEmail": TEST_USER,
                "messageId": f"msg-{i:04d}-{suffix}",
                "from": SENDERS[sender_idx],
                "to": TEST_USER,
                "subject": SUBJECTS_POOL[subject_idx],
                "body": BODY_SNIPPETS[body_idx]
                + f"\n\nReference: DOC-{i:04d}",
                "createdAt": base_date + timedelta(days=i, hours=random.randint(0, 23)),
            }
        )
    return emails


@pytest.fixture(scope="module", autouse=True)
def setup_test_data():
    """Seed MongoDB and ChromaDB with synthetic emails before tests."""
    global CHROMA_TMP

    # Set up temp ChromaDB directory
    CHROMA_TMP = tempfile.mkdtemp(prefix="chroma_test_")

    # Override config before importing pipeline modules
    os.environ["MONGO_URI"] = f"mongodb://localhost:27017/{TEST_DB}"
    os.environ["CHROMA_PERSIST_DIR"] = CHROMA_TMP
    os.environ["DEVICE"] = "cpu"  # Use CPU for tests

    # Seed MongoDB
    client = MongoClient("mongodb://localhost:27017")
    db = client[TEST_DB]
    db.drop_collection("emails")
    coll = db["emails"]

    emails = _generate_emails(200)
    coll.insert_many(emails)
    coll.create_index([("subject", "text"), ("body", "text")])
    coll.create_index("userEmail")

    yield

    # Cleanup
    client.drop_database(TEST_DB)
    client.close()
    if os.path.exists(CHROMA_TMP):
        shutil.rmtree(CHROMA_TMP, ignore_errors=True)


class TestMetadataSearch:
    """Integration tests for MongoDB metadata search."""

    def test_search_by_sender(self):
        from retrieval.mongo_metadata_search import search_metadata
        from router.models import DateRange, SearchQuery

        query = SearchQuery(
            user_email=TEST_USER,
            sender="sarah.johnson",
            date_range=DateRange(),
        )
        results = search_metadata(query)
        assert len(results) > 0
        for r in results:
            assert "sarah" in r["from"].lower()

    def test_search_by_date_range(self):
        from retrieval.mongo_metadata_search import search_metadata
        from router.models import DateRange, SearchQuery

        query = SearchQuery(
            user_email=TEST_USER,
            date_range=DateRange(
                after=datetime(2024, 6, 1),
                before=datetime(2024, 7, 1),
            ),
        )
        results = search_metadata(query)
        assert len(results) > 0

    def test_search_returns_no_body(self):
        from retrieval.mongo_metadata_search import search_metadata
        from router.models import DateRange, SearchQuery

        query = SearchQuery(user_email=TEST_USER, date_range=DateRange())
        results = search_metadata(query)
        for r in results:
            assert "body" not in r


class TestBM25Search:
    """Integration tests for BM25 keyword search."""

    def test_bm25_basic_query(self):
        from retrieval.bm25_search import search_bm25

        results = search_bm25("budget review", TEST_USER, top_k=10)
        assert len(results) > 0
        # "budget" should appear in top results
        assert any("budget" in r["subject"].lower() for r in results[:5])

    def test_bm25_empty_query(self):
        from retrieval.bm25_search import search_bm25

        results = search_bm25("", TEST_USER)
        assert results == []

    def test_bm25_scores_descending(self):
        from retrieval.bm25_search import search_bm25

        results = search_bm25("internship deadline", TEST_USER, top_k=10)
        if len(results) > 1:
            for i in range(len(results) - 1):
                assert results[i]["score"] >= results[i + 1]["score"]


class TestQueryRouter:
    """Integration tests for the full query routing pipeline."""

    def test_operator_only_query(self):
        from router.query_router import route_query

        query = route_query("from:sarah.johnson", TEST_USER)
        assert query.sender == "sarah.johnson"
        assert query.free_text == ""

    def test_free_text_only_query(self):
        from router.query_router import route_query

        query = route_query("budget review for Q3", TEST_USER)
        assert query.free_text != ""
        assert "budget" in query.free_text.lower()

    def test_mixed_query(self):
        from router.query_router import route_query

        query = route_query(
            "from:sarah budget review after:2024/06/01", TEST_USER
        )
        assert query.sender == "sarah"
        assert "budget review" in query.free_text
        assert query.date_range.after is not None
