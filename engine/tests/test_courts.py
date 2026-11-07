import pytest

from ghost_engine.detectors.courts import courts_detector


def found(text: str) -> list[str]:
    findings = courts_detector().detect(text)
    assert all(f.category == "courts" for f in findings)
    return [text[f.start : f.end] for f in findings]


def test_closed_custody_case_finds_status_and_case_type() -> None:
    text = "Saken går for lukkede dører. Utkast til dom: far får samvær annenhver helg."
    assert found(text) == ["lukkede dører", "Utkast til dom", "samvær"]


@pytest.mark.parametrize(
    "term",
    [
        "dørlukking",
        "referatforbud",
        "unntatt offentlighet",
        "taushetsplikt",
        "rådslagningen",
        "votering",
        "utkast til kjennelse",
        "ikke avsagt",
        "barnevernssak",
        "omsorgsovertakelse",
        "foreldretvist",
        "samværsrett",
        "barneloven",
        "voldtektssak",
        "seksuallovbrudd",
        "mindreårig",
        "tvungent psykisk helsevern",
        "vergemål",
        "fornærmede",
        "siktede",
    ],
)
def test_norwegian_court_terms_are_found(term: str) -> None:
    assert found(f"Retten nevner {term} her.") == [term]


@pytest.mark.parametrize(
    "term",
    [
        "closed doors",
        "reporting ban",
        "draft judgment",
        "sealed",
        "child custody",
        "child welfare",
        "sexual offence",
        "deliberations",
        "victim",
    ],
)
def test_english_court_terms_are_found(term: str) -> None:
    assert found(f"The court mentions {term} here.") == [term]


@pytest.mark.parametrize(
    "text",
    [
        "Retten er satt klokka ni.",
        "Se HR-2023-1234-A om dette.",
        "Dommen ble avsagt i går.",
        "Han liker barnesanger.",
        "Vi har en åpen dør for alle.",
        "The dog grooming salon opened today.",
        "She has a strong conviction about it.",
        "Han er fortrolig med Python.",
    ],
)
def test_public_court_talk_is_not_a_courts_finding(text: str) -> None:
    assert found(text) == []
