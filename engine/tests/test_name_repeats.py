import pytest

from ghost_engine.findings import Finding
from ghost_engine.name_repeats import REPEAT_CONFIDENCE, name_repeats
from ghost_engine.service import detect


def spans(text: str, findings: list[Finding]) -> list[str]:
    return [text[f.start : f.end] for f in findings]


def test_the_surname_of_a_found_full_name_is_found_again_alone() -> None:
    text = "Ola Nordmann er syk. Ring Nordmann i dag."
    found = [Finding(0, 12, "person_name", 0.5)]

    assert name_repeats(text, found) == [Finding(26, 34, "person_name", REPEAT_CONFIDENCE)]


def test_each_part_and_the_whole_name_are_found_everywhere_else() -> None:
    text = "Kari Hansen skrev. Kari svarte Hansen, og Kari Hansen takket."
    found = [Finding(0, 11, "person_name", 0.5)]

    assert spans(text, name_repeats(text, found)) == ["Kari", "Hansen", "Kari Hansen"]


def test_a_genitive_s_is_not_part_of_the_repeat() -> None:
    text = "Ola Nordmann kom. Nordmanns lege ringte."

    assert spans(text, name_repeats(text, [Finding(0, 12, "person_name", 0.5)])) == ["Nordmann"]


def test_only_whole_words_with_the_same_case_are_repeats() -> None:
    # "nordmannen" (a Norwegian) and "olav" are other words, not the person.
    text = "Ola Nordmann kom. En nordmann, Olav og Nordmannen."

    assert name_repeats(text, [Finding(0, 12, "person_name", 0.5)]) == []


def test_only_person_names_are_repeated() -> None:
    text = "Bærum er fint. Jeg bor i Bærum."

    assert name_repeats(text, [Finding(0, 5, "location", 0.5)]) == []


def test_a_one_word_name_is_not_repeated() -> None:
    # The first-name list finds those itself; it skips "Per" at a sentence start on purpose.
    text = "Spør Per. Per dag får han to."

    assert name_repeats(text, [Finding(5, 8, "person_name", 0.6)]) == []


@pytest.mark.gliner
def test_gliner_full_name_makes_the_surname_alone_a_name_too() -> None:
    text = "Ola Nordmann er syk i dag. Ola kommer tilbake på mandag. Ring Nordmann hvis det haster."
    found = [(text[f.start : f.end], f.category) for f in detect(text, domain="free")]

    assert found == [
        ("Ola Nordmann", "person_name"),
        ("Ola", "person_name"),
        ("Nordmann", "person_name"),
    ]
