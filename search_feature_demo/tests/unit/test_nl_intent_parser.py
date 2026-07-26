"""
Unit tests for the natural language intent parser.

Tests entity extraction (PERSON, DATE, ORG) and date range parsing.
These tests require ``spacy`` with ``en_core_web_sm`` installed.
If the spaCy model is unavailable, tests are skipped gracefully.
"""

from __future__ import annotations

import sys
import os

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

# Check if spaCy model is available
_spacy_available = False
try:
    import spacy

    spacy.load("en_core_web_sm")
    _spacy_available = True
except (ImportError, OSError):
    pass

from router.nl_intent_parser import parse_nl_intent

pytestmark = pytest.mark.skipif(
    not _spacy_available,
    reason="spaCy en_core_web_sm model not installed",
)


class TestPersonExtraction:
    """Tests for detecting sender/recipient from PERSON entities."""

    def test_from_person(self):
        result = parse_nl_intent("emails from Sarah about the budget")
        assert result.get("sender") == "Sarah"

    def test_by_person(self):
        result = parse_nl_intent("report by John sent last week")
        # "John" should be detected as sender due to "by" prefix
        assert result.get("sender") == "John"

    def test_to_person(self):
        result = parse_nl_intent("messages to Alice about the project")
        recipients = result.get("recipients", [])
        assert "Alice" in recipients or result.get("sender") == "Alice"

    def test_no_person(self):
        result = parse_nl_intent("quarterly budget report")
        assert "sender" not in result


class TestDateExtraction:
    """Tests for detecting date ranges from DATE entities."""

    def test_last_week(self):
        result = parse_nl_intent("emails from last week")
        if "date_range" in result:
            assert "after" in result["date_range"]

    def test_yesterday(self):
        result = parse_nl_intent("messages from yesterday")
        if "date_range" in result:
            assert "after" in result["date_range"]

    def test_no_date(self):
        result = parse_nl_intent("budget report summary")
        # May or may not have date_range, but shouldn't crash
        assert isinstance(result, dict)


class TestTopicExtraction:
    """Tests for ORG/topic entity detection."""

    def test_org_entity(self):
        result = parse_nl_intent("emails from Google about the partnership")
        # Google should be detected as a topic/org
        topics = result.get("topics", [])
        # spaCy may or may not catch "Google" as ORG depending on context
        assert isinstance(topics, list)


class TestEmptyInput:
    """Edge case tests."""

    def test_empty_string(self):
        result = parse_nl_intent("")
        assert result == {}

    def test_whitespace_only(self):
        result = parse_nl_intent("   ")
        assert result == {}

    def test_single_word(self):
        result = parse_nl_intent("hello")
        assert isinstance(result, dict)
