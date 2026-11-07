import pytest

from ghost_engine.detectors.first_names import first_name_detector


def found(text: str) -> list[str]:
    findings = first_name_detector().detect(text)
    assert all(f.category == "person_name" and f.confidence == 0.6 for f in findings)
    return [text[f.start : f.end] for f in findings]


def test_demo_note_finds_kari_twice_and_no_other_names(demo_note: str) -> None:
    # docs/spec.md §5: Nordmann (surname) and Bærum (place) are not found in V1.
    assert found(demo_note) == ["Kari", "Kari"]


def test_hyphenated_first_name_is_one_finding() -> None:
    assert found("Hilsen fra Anne-Lise.") == ["Anne-Lise"]


def test_genitive_s_is_not_part_of_the_finding() -> None:
    assert found("Det er Karis lege.") == ["Kari"]


@pytest.mark.parametrize("text", ["kari har ferie", "KARI HAR FERIE", "Familien Olafsen"])
def test_name_must_be_a_capitalised_whole_word(text: str) -> None:
    assert found(text) == []
