import pytest

from ghost_engine.detectors.health import health_detector


def found(text: str) -> list[str]:
    findings = health_detector().detect(text)
    assert all(f.category == "health" for f in findings)
    return [text[f.start : f.end] for f in findings]


def test_demo_note_has_exactly_three_health_findings(demo_note: str) -> None:
    # docs/spec.md §4 check 1: diabetes, sykemeldt and insulin are purple.
    assert found(demo_note) == ["diabetes", "sykemeldt", "insulin"]


@pytest.mark.parametrize(
    "term",
    [
        "innlagt",
        "sykmeldt",
        "sykemeldingen",
        "brystkreft",
        "KOLS",
        "fødselsdepresjon",
        "høyt blodtrykk",
        "Paracet",
        "antidepressiva",
        "uføretrygdet",
        "gravid",
        "hjerteinfarkt",
        "angstlidelse",
        "diagnostisert",
        "psykiater",
    ],
)
def test_norwegian_health_terms_are_found(term: str) -> None:
    assert found(f"Pasienten er {term} nå.") == [term]


@pytest.mark.parametrize(
    "term",
    [
        "diabetes",
        "breast cancer",
        "depression",
        "anxiety",
        "sick leave",
        "chemotherapy",
        "high blood pressure",
        "ADHD",
        "hospitalized",
        "pregnant",
        "antidepressants",
        "Metformin",
        "diagnosed",
    ],
)
def test_english_health_terms_are_found(term: str) -> None:
    assert found(f"The patient has {term} today.") == [term]


@pytest.mark.parametrize(
    "text",
    [
        "Hun har krefter igjen",
        "the hospitality industry",
        "Pasienten heter Kari",
        "kolsvart natt",
        "nettverksdiagnostikk og feilsøking",
        "psykologisk trygghet på jobb",
        "behandle saken raskt",
    ],
)
def test_everyday_words_are_not_health_findings(text: str) -> None:
    assert found(text) == []
