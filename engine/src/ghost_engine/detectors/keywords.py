"""Keyword-list Detector, compiled into one regex (used by Domains such as Health)."""

import re
from collections.abc import Iterable

from ghost_engine.findings import Finding


def _entry_pattern(entry: str) -> str:
    return re.escape(entry)


def _compile(entries: Iterable[str]) -> re.Pattern[str]:
    # Longest entries first, so the regex prefers "høyt blodtrykk" over "blodtrykk".
    ordered = sorted({e.strip() for e in entries if e.strip()}, key=len, reverse=True)
    alternatives = "|".join(_entry_pattern(e) for e in ordered)
    return re.compile(rf"(?<!\w)(?:{alternatives})(?!\w)", re.IGNORECASE)


class KeywordDetector:
    """Finds words and phrases from a list, as one Category."""

    def __init__(self, keywords: Iterable[str], *, category: str, confidence: float) -> None:
        self._pattern = _compile(keywords)
        self._category = category
        self._confidence = confidence

    def detect(self, text: str) -> list[Finding]:
        return [
            Finding(m.start(), m.end(), self._category, self._confidence)
            for m in self._pattern.finditer(text)
        ]
