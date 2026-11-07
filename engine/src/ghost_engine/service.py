"""The detect use case: run every Detector, apply the overlap rule, convert offsets."""

from collections.abc import Callable, Sequence
from dataclasses import replace

from ghost_engine.detectors.base_regex import BaseRegexDetector
from ghost_engine.detectors.health import health_detector
from ghost_engine.findings import Finding, resolve_overlaps
from ghost_engine.offsets import Utf16Offsets
from ghost_engine.ports import Detector

BASE_DETECTORS: tuple[Detector, ...] = (BaseRegexDetector(),)

DOMAIN_DETECTORS: dict[str, Callable[[], Sequence[Detector]]] = {
    "health": lambda: (health_detector(),),
}


class UnknownDomainError(ValueError):
    """The requested Domain has no Detectors."""


def detect(text: str, domain: str) -> list[Finding]:
    """Findings sorted by start, never overlapping, positions in UTF-16 units."""
    if domain not in DOMAIN_DETECTORS:
        raise UnknownDomainError(domain)
    detectors = (*BASE_DETECTORS, *DOMAIN_DETECTORS[domain]())
    findings = resolve_overlaps(f for d in detectors for f in d.detect(text))
    offsets = Utf16Offsets(text)
    return [
        replace(f, start=offsets.convert(f.start), end=offsets.convert(f.end)) for f in findings
    ]
