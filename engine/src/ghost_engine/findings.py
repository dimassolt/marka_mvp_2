"""Findings and the overlap rule (docs/spec.md §2)."""

from collections.abc import Iterable
from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class Finding:
    """A stretch of text a Detector believes is sensitive.

    `start` is inclusive and `end` exclusive. Detectors return Python string
    indices; the API converts them to UTF-16 units at the edge.
    """

    start: int
    end: int
    category: str
    confidence: float

    @property
    def length(self) -> int:
        return self.end - self.start

    def overlaps(self, other: "Finding") -> bool:
        return self.start < other.end and other.start < self.end


CATEGORIES: dict[str, dict[str, str]] = {
    # The Placeholder prefix, the Card's name in English, and the underline group (docs/spec.md §1).
    # The Extension knows only the groups: id is red, contact amber, domain teal.
    "fodselsnummer": {"prefix": "FNR", "name": "Fødselsnummer", "group": "id"},
    "d_nummer": {"prefix": "DNR", "name": "D-nummer", "group": "id"},
    "bank_account": {"prefix": "ACCOUNT", "name": "Bank account", "group": "id"},
    "payment_card": {"prefix": "CARD", "name": "Payment card", "group": "id"},
    "iban": {"prefix": "IBAN", "name": "IBAN", "group": "id"},
    "secret": {"prefix": "SECRET", "name": "Secret", "group": "id"},
    "password": {"prefix": "PASSWORD", "name": "Password", "group": "id"},
    "email": {"prefix": "EMAIL", "name": "Email", "group": "contact"},
    "phone": {"prefix": "PHONE", "name": "Phone", "group": "contact"},
    "person_name": {"prefix": "PERSON", "name": "Name", "group": "contact"},
    "health": {"prefix": "HEALTH", "name": "Health", "group": "domain"},
    "education": {"prefix": "EDUCATION", "name": "Education", "group": "domain"},
    "courts": {"prefix": "COURTS", "name": "Courts", "group": "domain"},
    "industrial": {"prefix": "INDUSTRIAL", "name": "Industrial", "group": "domain"},
    "religious": {"prefix": "RELIGIOUS", "name": "Religious", "group": "domain"},
    "custom": {"prefix": "DATA", "name": "Your word", "group": "domain"},
}


UNKNOWN_CATEGORY = {"prefix": "DATA", "name": "Sensitive data", "group": "domain"}


def category_info(category: str) -> dict[str, str]:
    """The prefix, name and group of a Category; DATA for one missing from the table."""
    return CATEGORIES.get(category, UNKNOWN_CATEGORY)


def resolve_overlaps(findings: Iterable[Finding]) -> list[Finding]:
    """Keep non-overlapping Findings: the longer wins, then the higher confidence."""
    ranked = sorted(findings, key=lambda f: (-f.length, -f.confidence, f.start))
    kept: list[Finding] = []
    for candidate in ranked:
        if not any(candidate.overlaps(k) for k in kept):
            kept.append(candidate)
    return sorted(kept, key=lambda f: f.start)
