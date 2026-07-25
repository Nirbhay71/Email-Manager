"""
Unit tests for the Gmail-style operator parser.

Covers 25 test cases across operator-only, NL-only, mixed, edge cases,
and quoted value handling.
"""

from __future__ import annotations

import sys
import os
from datetime import datetime

import pytest

# Ensure the project root is on sys.path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from router.operator_parser import parse_operators


# ── Operator-only queries ──────────────────────────────────────────────────


class TestOperatorOnly:
    """Tests for queries that contain only structured operators."""

    def test_from_operator(self):
        ops, free = parse_operators("from:sarah")
        assert ops["from"] == "sarah"
        assert free == ""

    def test_to_operator(self):
        ops, free = parse_operators("to:john")
        assert ops["to"] == ["john"]
        assert free == ""

    def test_subject_operator(self):
        ops, free = parse_operators("subject:budget")
        assert ops["subject"] == "budget"
        assert free == ""

    def test_has_attachment(self):
        ops, free = parse_operators("has:attachment")
        assert ops["has_attachment"] is True
        assert free == ""

    def test_is_unread(self):
        ops, free = parse_operators("is:unread")
        assert ops["is_unread"] is True
        assert free == ""

    def test_is_read(self):
        ops, free = parse_operators("is:read")
        assert ops["is_unread"] is False
        assert free == ""

    def test_after_date_slash(self):
        ops, free = parse_operators("after:2024/01/15")
        assert ops["after"] == datetime(2024, 1, 15)
        assert free == ""

    def test_before_date_dash(self):
        ops, free = parse_operators("before:2024-06-30")
        assert ops["before"] == datetime(2024, 6, 30)
        assert free == ""

    def test_label_operator(self):
        ops, free = parse_operators("label:important")
        assert ops["label"] == "important"
        assert free == ""

    def test_in_folder_operator(self):
        ops, free = parse_operators("in:inbox")
        assert ops["folder"] == "inbox"
        assert free == ""

    def test_category_operator(self):
        ops, free = parse_operators("category:promotions")
        assert ops["folder"] == "promotions"
        assert free == ""

    def test_multiple_operators(self):
        ops, free = parse_operators("from:sarah to:john has:attachment")
        assert ops["from"] == "sarah"
        assert ops["to"] == ["john"]
        assert ops["has_attachment"] is True
        assert free == ""

    def test_date_range(self):
        ops, free = parse_operators("after:2024/01/01 before:2024/12/31")
        assert ops["after"] == datetime(2024, 1, 1)
        assert ops["before"] == datetime(2024, 12, 31)
        assert free == ""


# ── Quoted values ──────────────────────────────────────────────────────────


class TestQuotedValues:
    """Tests for operators with quoted multi-word values."""

    def test_quoted_from(self):
        ops, free = parse_operators('from:"Sarah Johnson"')
        assert ops["from"] == "Sarah Johnson"
        assert free == ""

    def test_quoted_subject(self):
        ops, free = parse_operators('subject:"Q3 Budget Report"')
        assert ops["subject"] == "Q3 Budget Report"
        assert free == ""

    def test_quoted_to(self):
        ops, free = parse_operators('to:"Team Lead"')
        assert ops["to"] == ["Team Lead"]
        assert free == ""


# ── Free-text only (no operators) ──────────────────────────────────────────


class TestFreeTextOnly:
    """Tests for queries with no structured operators."""

    def test_plain_text(self):
        ops, free = parse_operators("meeting notes from yesterday")
        assert ops == {}
        assert free == "meeting notes from yesterday"

    def test_empty_query(self):
        ops, free = parse_operators("")
        assert ops == {}
        assert free == ""

    def test_whitespace_only(self):
        ops, free = parse_operators("   ")
        assert ops == {}
        assert free == ""


# ── Mixed queries ──────────────────────────────────────────────────────────


class TestMixedQueries:
    """Tests for queries combining operators with free text."""

    def test_from_with_free_text(self):
        ops, free = parse_operators("from:sarah Q3 budget report")
        assert ops["from"] == "sarah"
        assert "Q3 budget report" in free

    def test_mixed_operators_and_text(self):
        ops, free = parse_operators(
            "from:sarah subject:budget important meeting notes after:2024/01/01"
        )
        assert ops["from"] == "sarah"
        assert ops["subject"] == "budget"
        assert ops["after"] == datetime(2024, 1, 1)
        assert "important meeting notes" in free

    def test_operators_around_text(self):
        ops, free = parse_operators("from:john hello world to:jane")
        assert ops["from"] == "john"
        assert ops["to"] == ["jane"]
        assert "hello world" in free

    def test_has_attachment_with_query(self):
        ops, free = parse_operators("has:attachment quarterly report")
        assert ops["has_attachment"] is True
        assert "quarterly report" in free


# ── Edge cases ─────────────────────────────────────────────────────────────


class TestEdgeCases:
    """Edge case tests for robustness."""

    def test_invalid_date_ignored(self):
        ops, free = parse_operators("after:not-a-date")
        assert "after" not in ops

    def test_case_insensitive_operators(self):
        ops, free = parse_operators("FROM:sarah IS:unread")
        assert ops["from"] == "sarah"
        assert ops["is_unread"] is True

    def test_multiple_to_recipients(self):
        ops, free = parse_operators("to:alice to:bob to:charlie")
        assert ops["to"] == ["alice", "bob", "charlie"]

    def test_has_attachments_plural(self):
        ops, free = parse_operators("has:attachments")
        assert ops["has_attachment"] is True
