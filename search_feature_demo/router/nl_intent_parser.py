"""
Natural-language intent parser for email search queries.

Uses spaCy NER to detect PERSON entities (sender), DATE entities
(date ranges), and ORG entities (topic hints). Uses ``dateparser``
for relative date phrases ("last week", "yesterday").

This parser fills in gaps left by the operator parser — if the user
wrote "emails from Sarah about Q3 budget last week", and "from Sarah"
wasn't captured as a structured operator, this module detects "Sarah"
as a PERSON and "last week" as a DATE range.
"""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Any

logger = logging.getLogger(__name__)

# Lazy-loaded to avoid import-time cost if not used
_nlp = None


def _get_nlp():
    """Lazy-load spaCy model on first use."""
    global _nlp
    if _nlp is None:
        try:
            import spacy

            _nlp = spacy.load("en_core_web_sm")
            logger.info("spaCy en_core_web_sm loaded successfully.")
        except OSError:
            logger.warning(
                "spaCy model 'en_core_web_sm' not found. "
                "Run: python -m spacy download en_core_web_sm"
            )
            _nlp = False  # Mark as unavailable
    return _nlp if _nlp is not False else None


def _parse_relative_date(text: str) -> datetime | None:
    """
    Parse a relative or absolute date phrase using dateparser.

    Args:
        text: A date phrase like "last week", "yesterday", "2024-01-15".

    Returns:
        A datetime object, or None if parsing failed.
    """
    try:
        import dateparser

        result = dateparser.parse(
            text,
            settings={
                "PREFER_DATES_FROM": "past",
                "RELATIVE_BASE": datetime.now(),
            },
        )
        return result
    except Exception:
        return None


def _extract_date_range(date_entities: list[str]) -> dict[str, datetime | None]:
    """
    Convert a list of date-entity texts into an after/before range.

    If only one date is found, it's treated as the lower bound (after).
    If two are found, the earlier is "after" and the later is "before".

    Args:
        date_entities: List of date-phrase strings extracted by NER.

    Returns:
        Dict with optional "after" and "before" datetime values.
    """
    parsed_dates: list[datetime] = []
    for text in date_entities:
        dt = _parse_relative_date(text)
        if dt:
            parsed_dates.append(dt)

    if not parsed_dates:
        return {}

    parsed_dates.sort()
    result: dict[str, datetime | None] = {}

    if len(parsed_dates) == 1:
        result["after"] = parsed_dates[0]
    else:
        result["after"] = parsed_dates[0]
        result["before"] = parsed_dates[-1]

    return result


# Words that commonly appear before a person's name as a directional hint
_FROM_INDICATORS = {"from", "by", "sent by", "written by"}
_TO_INDICATORS = {"to", "for", "sent to", "addressed to"}


def parse_nl_intent(free_text: str) -> dict[str, Any]:
    """
    Extract natural-language intent from free text.

    Runs spaCy NER to find PERSON, DATE, and ORG entities, then
    infers sender/recipient, date ranges, and topic context.

    Args:
        free_text: The non-operator portion of the user's query.

    Returns:
        Dict with optional keys:
        - ``"sender"`` (str): detected sender name
        - ``"recipients"`` (list[str]): detected recipient names
        - ``"date_range"`` (dict): ``{"after": datetime, "before": datetime}``
        - ``"topics"`` (list[str]): ORG or key noun phrases for context
    """
    result: dict[str, Any] = {}
    nlp = _get_nlp()

    if not nlp or not free_text.strip():
        return result

    doc = nlp(free_text)
    text_lower = free_text.lower()

    # ── Extract PERSON entities ─────────────────────────────────────────
    persons: list[str] = []
    for ent in doc.ents:
        if ent.label_ == "PERSON":
            persons.append(ent.text)

    # Determine if persons are senders or recipients based on context
    for person in persons:
        person_idx = text_lower.find(person.lower())
        if person_idx == -1:
            continue

        # Check words before the person name
        prefix = text_lower[:person_idx].strip()
        prefix_words = prefix.split()

        if prefix_words:
            last_word = prefix_words[-1]
            if last_word in {"from", "by"}:
                result["sender"] = person
                continue
            if last_word in {"to", "for"}:
                result.setdefault("recipients", []).append(person)
                continue

        # Default: treat first person as sender if no directional hint
        if "sender" not in result:
            result["sender"] = person
        else:
            result.setdefault("recipients", []).append(person)

    # ── Extract DATE entities ───────────────────────────────────────────
    date_texts: list[str] = []
    for ent in doc.ents:
        if ent.label_ == "DATE":
            date_texts.append(ent.text)

    if date_texts:
        date_range = _extract_date_range(date_texts)
        if date_range:
            result["date_range"] = date_range

    # ── Extract ORG entities and noun phrases as topic hints ────────────
    topics: list[str] = []
    for ent in doc.ents:
        if ent.label_ in ("ORG", "PRODUCT", "EVENT", "WORK_OF_ART"):
            topics.append(ent.text)

    if topics:
        result["topics"] = topics

    return result
