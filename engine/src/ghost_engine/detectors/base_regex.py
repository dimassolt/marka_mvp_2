"""Regex Detector for Base Categories (docs/spec.md §1)."""

import re
from collections.abc import Callable
from dataclasses import dataclass

from ghost_engine.detectors import checksums
from ghost_engine.findings import Finding, resolve_overlaps

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


def _bank_account(match: str) -> str | None:
    return "bank_account" if checksums.bank_account_valid(_digits(match)) else None


def _payment_card(match: str) -> str | None:
    digits = _digits(match)
    if 13 <= len(digits) <= 19 and checksums.luhn_valid(digits):
        return "payment_card"
    return None


_RULES: tuple[_Rule, ...] = (
    _Rule(
        pattern=re.compile(r"(?<!\w)\d{6} ?\d{5}(?!\w)"),
        classify=_national_id,
        confidence=0.99,
    ),
    _Rule(
        # 4.2.5 digits; the separator, if any, must be the same both times.
        pattern=re.compile(r"(?<!\w)\d{4}([. ]?)\d{2}\1\d{5}(?!\w)"),
        classify=_bank_account,
        confidence=0.9,
    ),
    _Rule(
        # 13–19 digits, optionally grouped by single spaces or dashes.
        pattern=re.compile(r"(?<!\w)\d(?:[ -]?\d){12,18}(?!\w)"),
        classify=_payment_card,
        confidence=0.95,
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
        # A valid fødselsnummer is also a valid account number; the overlap rule
        # keeps the higher-confidence one.
        return resolve_overlaps(findings)
