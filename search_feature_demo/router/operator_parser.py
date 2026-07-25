"""
Gmail-style structured operator parser.

Extracts operators like ``from:``, ``to:``, ``subject:``, ``has:attachment``,
``after:YYYY/MM/DD``, ``before:YYYY/MM/DD``, ``is:unread``, ``is:read``,
``label:``, ``in:`` from a raw query string using regex.

Returns a dict of extracted operators and the remaining free-text portion.
"""

from __future__ import annotations

import re
from datetime import datetime
from typing import Any


# Regex that matches KEY:VALUE pairs.
# Handles quoted values: from:"John Doe"
# Handles unquoted single-word values: from:sarah
_OPERATOR_PATTERN = re.compile(
    r"""
    (?P<key>from|to|subject|has|after|before|is|label|in|category|filename)
    :                           # colon separator
    (?:
        "(?P<quoted>[^"]*)"     # quoted value
        |
        (?P<unquoted>\S+)       # unquoted single-word value
    )
    """,
    re.IGNORECASE | re.VERBOSE,
)

# Date formats we accept for after:/before: operators
_DATE_FORMATS = [
    "%Y/%m/%d",
    "%Y-%m-%d",
    "%Y/%m",
    "%Y-%m",
    "%m/%d/%Y",
    "%m-%d-%Y",
    "%d/%m/%Y",
]


def _parse_date(date_str: str) -> datetime | None:
    """
    Attempt to parse a date string in multiple common formats.

    Args:
        date_str: Raw date string from an operator value.

    Returns:
        Parsed datetime or None if no format matched.
    """
    for fmt in _DATE_FORMATS:
        try:
            return datetime.strptime(date_str, fmt)
        except ValueError:
            continue
    return None


def parse_operators(raw_query: str) -> tuple[dict[str, Any], str]:
    """
    Parse structured operators from a raw query string.

    Extracts Gmail-style operators (``from:``, ``to:``, ``subject:``, etc.)
    and returns them as a normalized dict along with the remaining free-text.

    Args:
        raw_query: The user's raw search query string.

    Returns:
        A tuple of (operators_dict, remaining_free_text).

        The operators dict may contain:
        - ``"from"`` (str): sender filter
        - ``"to"`` (list[str]): recipient filters
        - ``"subject"`` (str): subject keyword filter
        - ``"has_attachment"`` (bool): attachment presence flag
        - ``"after"`` (datetime): lower date bound
        - ``"before"`` (datetime): upper date bound
        - ``"is_unread"`` (bool): read/unread filter
        - ``"label"`` (str): label filter
        - ``"folder"`` (str): folder/mailbox filter
    """
    operators: dict[str, Any] = {}
    to_list: list[str] = []

    for match in _OPERATOR_PATTERN.finditer(raw_query):
        key = match.group("key").lower()
        value = match.group("quoted") or match.group("unquoted")
        value = value.strip()

        if key == "from":
            operators["from"] = value

        elif key == "to":
            to_list.append(value)

        elif key == "subject":
            operators["subject"] = value

        elif key == "has":
            if value.lower() in ("attachment", "attachments"):
                operators["has_attachment"] = True

        elif key == "after":
            parsed = _parse_date(value)
            if parsed:
                operators["after"] = parsed

        elif key == "before":
            parsed = _parse_date(value)
            if parsed:
                operators["before"] = parsed

        elif key == "is":
            val_lower = value.lower()
            if val_lower == "unread":
                operators["is_unread"] = True
            elif val_lower == "read":
                operators["is_unread"] = False
            elif val_lower == "starred":
                operators["is_starred"] = True

        elif key == "label":
            operators["label"] = value

        elif key in ("in", "category"):
            operators["folder"] = value

        elif key == "filename":
            operators["filename"] = value

    if to_list:
        operators["to"] = to_list

    # Remove all matched operator tokens from the query to get free text
    free_text = _OPERATOR_PATTERN.sub("", raw_query).strip()
    # Collapse multiple spaces
    free_text = re.sub(r"\s+", " ", free_text)

    return operators, free_text
