from ghost_engine.detectors.keywords import KeywordDetector
from ghost_engine.findings import Finding


def found(keywords: list[str], text: str) -> list[str]:
    detector = KeywordDetector(keywords, category="health", confidence=0.8)
    return [text[f.start : f.end] for f in detector.detect(text)]


def test_exact_keyword_is_found_with_category_and_position() -> None:
    detector = KeywordDetector(["diabetes"], category="health", confidence=0.8)

    assert detector.detect("Kari har diabetes.") == [
        Finding(start=9, end=17, category="health", confidence=0.8)
    ]


def test_matching_ignores_case() -> None:
    assert found(["kols"], "KOLS og Kols") == ["KOLS", "Kols"]


def test_exact_keyword_does_not_match_inside_a_longer_word() -> None:
    assert found(["kreft"], "Hun har krefter igjen") == []
