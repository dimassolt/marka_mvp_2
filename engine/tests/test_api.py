import pytest
from fastapi.testclient import TestClient

from ghost_engine.api import app

client = TestClient(app)


def test_health_endpoint_reports_ok() -> None:
    response = client.get("/health")

    assert (response.status_code, response.json()) == (200, {"status": "ok"})


def test_detect_returns_findings_in_spec_shape() -> None:
    response = client.post("/detect", json={"text": "fnr 01019000083", "domain": "health"})

    assert response.status_code == 200
    assert response.json() == {
        "findings": [{"start": 4, "end": 15, "category": "fodselsnummer", "confidence": 0.99}]
    }


@pytest.mark.gliner
def test_demo_note_gives_the_nine_findings_of_acceptance_check_1(demo_note: str) -> None:
    # docs/spec.md §4 check 1: the Ghost bar shows 9.
    response = client.post("/detect", json={"text": demo_note, "domain": "health"})
    findings = response.json()["findings"]

    assert [(f["category"], demo_note[f["start"] : f["end"]]) for f in findings] == [
        ("person_name", "Kari Nordmann"),
        ("fodselsnummer", "01019000083"),
        ("person_name", "Kari"),
        ("location", "Bærum"),
        ("health", "diabetes"),
        ("health", "sykemeldt"),
        ("health", "insulin"),
        ("phone", "+47 912 34 567"),
        ("email", "kari.nordmann@example.com"),
    ]


def test_words_become_custom_findings() -> None:
    # A custom Domain sends its own words; each match is Category "custom".
    response = client.post(
        "/detect", json={"text": "Møte på Ullevål om prosjektet", "words": ["ullevål", "prosjekt*"]}
    )

    assert [(f["category"], f["start"], f["end"]) for f in response.json()["findings"]] == [
        ("custom", 8, 15),
        ("custom", 19, 29),
    ]


def test_unknown_domain_returns_422() -> None:
    response = client.post("/detect", json={"text": "tekst", "domain": "school"})

    assert response.status_code == 422


def test_missing_text_returns_422() -> None:
    response = client.post("/detect", json={"domain": "health"})

    assert response.status_code == 422


def test_detect_without_domain_uses_free() -> None:
    # docs/spec.md §2: domain is optional and defaults to "free".
    response = client.post("/detect", json={"text": "Kari har diabetes, fnr 01019000083"})

    assert response.status_code == 200
    assert [f["category"] for f in response.json()["findings"]] == [
        "person_name",
        "fodselsnummer",
    ]


def test_detect_accepts_the_new_domains() -> None:
    for domain in ("education", "courts", "industrial", "religious"):
        response = client.post("/detect", json={"text": "tekst", "domain": domain})
        assert response.status_code == 200, domain
