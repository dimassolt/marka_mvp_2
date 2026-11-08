"""The detect use case: run every Detector, apply the overlap rule, convert offsets."""

from collections.abc import Callable, Sequence
from dataclasses import replace

from ghost_engine.detectors.base_regex import BaseRegexDetector
from ghost_engine.detectors.courts import courts_detector
from ghost_engine.detectors.education import education_detector
from ghost_engine.detectors.first_names import first_name_detector
from ghost_engine.detectors.gliner import gliner_detector
from ghost_engine.detectors.health import health_detector
from ghost_engine.detectors.industrial import industrial_detector
from ghost_engine.detectors.keywords import KeywordDetector
from ghost_engine.detectors.religious import religious_detector
from ghost_engine.findings import Finding, resolve_overlaps
from ghost_engine.name_repeats import name_repeats
from ghost_engine.offsets import Utf16Offsets
from ghost_engine.placeholders import outside_placeholders
from ghost_engine.ports import Detector

DEFAULT_DOMAIN = "free"

# GLiNER loads its model lazily, on the first detect call.
BASE_DETECTORS: tuple[Detector, ...] = (
    BaseRegexDetector(),
    first_name_detector(),
    gliner_detector(),
)

DOMAIN_DETECTORS: dict[str, Callable[[], Sequence[Detector]]] = {
    "free": lambda: (),  # Base Findings only
    "health": lambda: (health_detector(),),
    "education": lambda: (education_detector(),),
    "courts": lambda: (courts_detector(),),
    "industrial": lambda: (industrial_detector(),),
    "religious": lambda: (religious_detector(),),
}


class UnknownDomainError(ValueError):
    """The requested Domain has no Detectors."""


def detect(text: str, domain: str, words: Sequence[str] = ()) -> list[Finding]:
    """Findings sorted by start, never overlapping, positions in UTF-16 units.

    Nothing inside a Placeholder like `[PERSON_1]` is a Finding.

    `words` are the user's own words (keyword syntax), found as Category "custom".
    """
    if domain not in DOMAIN_DETECTORS:
        raise UnknownDomainError(domain)
    detectors = (*BASE_DETECTORS, *DOMAIN_DETECTORS[domain]())
    # An empty or all-"*" entry would match the empty string everywhere.
    words = [w for w in words if w.strip("* ")]
    if words:
        detectors = (*detectors, KeywordDetector(words, category="custom", confidence=0.8))
    found = (f for d in detectors for f in d.detect(text))
    findings = resolve_overlaps(outside_placeholders(text, found))
    # A found full name also marks its surname or first name alone, anywhere in the text.
    findings = sorted(
        [*findings, *outside_placeholders(text, name_repeats(text, findings))],
        key=lambda f: f.start,
    )
    offsets = Utf16Offsets(text)
    return [
        replace(f, start=offsets.convert(f.start), end=offsets.convert(f.end)) for f in findings
    ]
