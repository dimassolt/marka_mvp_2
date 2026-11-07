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


# stop-list ---------------------------------------------------------------------


@pytest.mark.parametrize(
    "text",
    [
        "Per dag tar hun to tabletter.",
        "Liv og helse henger sammen.",
        "Hun er sliten. Dag og natt er like.",
        "- Sol hele uka",
        "Even if it hurts, call me.",
        "Ask your doctor.",
    ],
)
def test_ambiguous_name_at_sentence_start_is_not_found(text: str) -> None:
    assert found(text) == []


@pytest.mark.parametrize(
    ("text", "name"),
    [("Jeg ringte Dag i går.", "Dag"), ("Liv er syk. Spør Liv.", "Liv"), ("Møt Per.", "Per")],
)
def test_ambiguous_name_inside_a_sentence_is_found(text: str, name: str) -> None:
    assert found(text) == [name]


@pytest.mark.parametrize("text", ["See you in May.", "Hun kom i August.", "Ma said no."])
def test_never_list_words_are_not_found(text: str) -> None:
    assert found(text) == []


def test_unambiguous_name_at_sentence_start_is_found() -> None:
    assert found("Kari, 34 år, er lærer.") == ["Kari"]


def test_every_stop_list_entry_is_on_the_name_list() -> None:
    from ghost_engine.data import load_list

    names = set(load_list("first_names.txt"))
    stop = load_list("first_names_ambiguous.txt") + load_list("first_names_never.txt")

    assert [entry for entry in stop if entry not in names] == []
