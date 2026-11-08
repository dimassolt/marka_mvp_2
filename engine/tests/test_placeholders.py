import pytest

from ghost_engine.findings import Finding
from ghost_engine.placeholders import outside_placeholders
from ghost_engine.service import detect


def test_a_finding_inside_a_placeholder_is_dropped() -> None:
    # "[PERSON_1]" is Ghost's own Placeholder: the name it hides is already gone.
    text = "Hei [PERSON_1], ring Kari."
    findings = [
        Finding(5, 13, "person_name", 0.5),  # PERSON_1
        Finding(21, 25, "person_name", 0.6),  # Kari
    ]

    assert outside_placeholders(text, findings) == [Finding(21, 25, "person_name", 0.6)]


def test_a_finding_that_takes_in_a_placeholder_is_dropped() -> None:
    text = "[PERSON_1] Hansen kom."

    assert outside_placeholders(text, [Finding(0, 17, "person_name", 0.5)]) == []


def test_text_that_only_looks_like_a_placeholder_is_kept() -> None:
    # Lowercase or without a number, it isn't a Placeholder Ghost writes (docs/spec.md §3).
    text = "[Kari] og [person_1]"
    findings = [Finding(1, 5, "person_name", 0.6), Finding(11, 19, "custom", 0.8)]

    assert outside_placeholders(text, findings) == findings


def test_detect_finds_nothing_in_placeholders() -> None:
    # The user's own word PERSON* would match "PERSON_1" inside the Placeholder.
    assert detect("Send til [PERSON_1] og [EMAIL_2].", domain="free", words=["PERSON*"]) == []


@pytest.mark.gliner
def test_gliner_does_not_take_a_placeholder_for_a_name() -> None:
    text = "[PERSON_1] er syk i dag. [PERSON_1] kommer tilbake på mandag."

    assert detect(text, domain="free") == []
