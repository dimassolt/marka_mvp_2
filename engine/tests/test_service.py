import pytest

from ghost_engine.findings import Finding
from ghost_engine.service import UnknownDomainError, detect


def test_spec_example_has_health_and_fodselsnummer_in_order() -> None:
    # docs/spec.md §2 (person_name comes with the first-name Detector).
    findings = detect("Kari har diabetes, fnr 01019000083", domain="health")

    assert findings == [
        Finding(start=9, end=17, category="health", confidence=0.8),
        Finding(start=23, end=34, category="fodselsnummer", confidence=0.99),
    ]


def test_positions_are_in_utf16_units() -> None:
    # docs/spec.md §2: in "👋 01019000083" the fødselsnummer is at 3–14.
    [finding] = detect("👋 01019000083", domain="health")

    assert (finding.start, finding.end) == (3, 14)


def test_overlap_between_detectors_keeps_one_finding() -> None:
    # "insulin123" is both a password value and a health stem; same length,
    # so the higher confidence (password) wins.
    findings = detect("passord: insulin123", domain="health")

    assert [(f.category, f.start, f.end) for f in findings] == [("password", 9, 19)]


def test_unknown_domain_is_rejected() -> None:
    with pytest.raises(UnknownDomainError):
        detect("tekst", domain="school")
