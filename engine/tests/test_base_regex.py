import pytest

from ghost_engine.detectors.base_regex import BaseRegexDetector
from ghost_engine.findings import Finding


def found(text: str) -> list[tuple[str, str]]:
    """(category, matched text) pairs, in order."""
    findings = BaseRegexDetector().detect(text)
    return [(f.category, text[f.start : f.end]) for f in findings]


# fodselsnummer and d_nummer --------------------------------------------------


def test_valid_fodselsnummer_is_found_with_position() -> None:
    findings = BaseRegexDetector().detect("fnr 01019000083")

    assert findings == [Finding(start=4, end=15, category="fodselsnummer", confidence=0.99)]


def test_fodselsnummer_with_space_after_birth_date_is_found() -> None:
    assert found("fnr 010190 00083.") == [("fodselsnummer", "010190 00083")]


def test_fodselsnummer_with_failed_checksum_is_not_found() -> None:
    # docs/spec.md §4 check 10
    assert found("ordrenummer 01019000084") == []


def test_d_nummer_starts_with_4_to_7() -> None:
    assert found("d-nr 41019000077") == [("d_nummer", "41019000077")]


@pytest.mark.parametrize("text", ["101019000083", "x01019000083", "0101900008"])
def test_fodselsnummer_must_stand_alone(text: str) -> None:
    assert ("fodselsnummer", "01019000083") not in found(text)
