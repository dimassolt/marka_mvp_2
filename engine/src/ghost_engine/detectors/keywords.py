"""Keyword-list Detector, compiled into one regex (used by Domains such as Health).

Entry syntax, one entry per keyword:

- `diabetes`        the whole word, any case
- `sykemeld*`       the word plus any ending: sykemeldt, sykemelding, sykemeldingen
- `*kreft`          any word ending in it, for Norwegian compounds: brystkreft, lungekreft
- `*depresjon*`     both: fødselsdepresjonen
- `høyt blodtrykk`  a phrase; the space matches any run of whitespace
"""

import re
from collections.abc import Iterable

from ghost_engine.findings import Finding


def _entry_pattern(entry: str) -> str:
    compound = entry.startswith("*")
    inflected = entry.endswith("*")
    core = entry.strip("*")
    words = (re.escape(word) for word in core.split())
    pattern = r"\s+".join(words)
    if compound:
        pattern = r"\w*" + pattern
    if inflected:
        pattern += r"\w*"
    return pattern


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
