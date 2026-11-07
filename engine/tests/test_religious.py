import pytest

from ghost_engine.detectors.religious import religious_detector


def found(text: str) -> list[str]:
    findings = religious_detector().detect(text)
    assert all(f.category == "religious" for f in findings)
    return [text[f.start : f.end] for f in findings]


def test_parish_note_finds_pastoral_care_and_membership() -> None:
    text = "Kari kom til sjelesorg og vil melde seg ut av menigheten. Konfirmanter: Ida, Jonas."
    assert found(text) == ["sjelesorg", "melde seg ut", "menigheten", "Konfirmanter"]


@pytest.mark.parametrize(
    "term",
    [
        "menighetsmedlem",
        "medlemsregisteret",
        "dåp",
        "døpt",
        "konfirmant",
        "vigsel",
        "gravferd",
        "begravelsen",
        "skriftemål",
        "forbønn",
        "innmelding",
        "utmeldingen",
        "trossamfunn",
        "livssynssamfunnet",
        "moskeen",
        "synagogen",
        "gurdwara",
        "kirkeasyl",
        "givertjeneste",
        "kirkeskatt",
    ],
)
def test_norwegian_religious_terms_are_found(term: str) -> None:
    assert found(f"Det gjelder {term} nå.") == [term]


@pytest.mark.parametrize(
    "term",
    [
        "parishioner",
        "congregation",
        "pastoral care",
        "confession",
        "baptism",
        "baptized",
        "confirmation class",
        "funeral",
        "church member",
        "mosque",
        "synagogue",
    ],
)
def test_english_religious_terms_are_found(term: str) -> None:
    assert found(f"This is about {term} today.") == [term]


@pytest.mark.parametrize(
    "text",
    [
        "Gudstjenesten starter kl. 11.",
        "Kirken ligger ved torget.",
        "Medlemmene i fotballklubben møttes.",
        "Han er medlem av styret.",
        "Vi kjøpte en dåse med kjeks.",
    ],
)
def test_public_church_talk_is_not_a_religious_finding(text: str) -> None:
    assert found(text) == []
