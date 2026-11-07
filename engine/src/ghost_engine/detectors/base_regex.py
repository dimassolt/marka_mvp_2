"""Regex Detector for Base Categories (docs/spec.md §1)."""

import re
from collections.abc import Callable
from dataclasses import dataclass

from ghost_engine.detectors import checksums
from ghost_engine.findings import Finding

Classifier = Callable[[str], str | None]
"""Takes the matched text, returns the Category id or None to reject it."""


@dataclass(frozen=True, slots=True)
class _Rule:
    pattern: re.Pattern[str]
    classify: Classifier
    confidence: float
    group: int = 0


def _digits(text: str) -> str:
    return re.sub(r"\D", "", text)


def _national_id(match: str) -> str | None:
    digits = _digits(match)
    if not checksums.fodselsnummer_valid(digits):
        return None
    if digits[0] in "0123":
        return "fodselsnummer"
    if digits[0] in "4567":
        return "d_nummer"
    return None


_RULES: tuple[_Rule, ...] = (
    _Rule(
        pattern=re.compile(r"(?<!\w)\d{6} ?\d{5}(?!\w)"),
        classify=_national_id,
        confidence=0.99,
    ),
)


class BaseRegexDetector:
    """Finds Base Categories that have a fixed shape and, where possible, a checksum."""

    def detect(self, text: str) -> list[Finding]:
        findings: list[Finding] = []
        for rule in _RULES:
            for match in rule.pattern.finditer(text):
                category = rule.classify(match.group(rule.group))
                if category is None:
                    continue
                start, end = match.span(rule.group)
                findings.append(Finding(start, end, category, rule.confidence))
        return sorted(findings, key=lambda f: f.start)
