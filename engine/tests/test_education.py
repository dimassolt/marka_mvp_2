import pytest

from ghost_engine.detectors.education import education_detector


def found(text: str) -> list[str]:
    findings = education_detector().detect(text)
    assert all(f.category == "education" for f in findings)
    return [text[f.start : f.end] for f in findings]


def test_student_note_finds_special_needs_and_absence() -> None:
    text = "Ola i 9B har IOP og mye fravær. Han fikk 2 i standpunkt i matte."
    assert found(text) == ["IOP", "fravær", "standpunkt"]


@pytest.mark.parametrize(
    "term",
    [
        "spesialundervisning",
        "PPT",
        "sakkyndig vurdering",
        "fraværet",
        "anmerkning",
        "bortvist",
        "tilrettelagt",
        "utsatt eksamen",
        "fusket",
        "karakterklage",
        "mobbet",
        "skolemiljøsak",
        "standpunktkarakter",
        "studentnummer",
        "kandidatnummer",
        "elevsamtale",
        "dysleksi",
    ],
)
def test_norwegian_education_terms_are_found(term: str) -> None:
    assert found(f"Eleven har {term} nå.") == [term]


@pytest.mark.parametrize(
    "term",
    [
        "special needs",
        "absence",
        "bullied",
        "expelled",
        "cheating",
        "exam results",
        "student ID",
        "grade appeal",
        "learning disability",
    ],
)
def test_english_education_terms_are_found(term: str) -> None:
    assert found(f"The student has {term} today.") == [term]


@pytest.mark.parametrize(
    "text",
    [
        "Snittet i 10A var 4,1.",
        "Skolen starter klokka åtte.",
        "Vi har matte og norsk i dag.",
        "Fusion er et fint ord.",
        "the important meeting",
        "Ta med deg tilbehør.",
    ],
)
def test_everyday_words_are_not_education_findings(text: str) -> None:
    assert found(text) == []
