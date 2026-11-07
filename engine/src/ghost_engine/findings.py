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


def resolve_overlaps(findings: Iterable[Finding]) -> list[Finding]:
    """Keep non-overlapping Findings: the longer wins, then the higher confidence."""
    ranked = sorted(findings, key=lambda f: (-f.length, -f.confidence, f.start))
    kept: list[Finding] = []
    for candidate in ranked:
        if not any(candidate.overlaps(k) for k in kept):
            kept.append(candidate)
    return sorted(kept, key=lambda f: f.start)
