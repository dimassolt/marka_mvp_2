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


def test_detect_finds_every_regex_and_health_value_in_the_demo_note(demo_note: str) -> None:
    response = client.post("/detect", json={"text": demo_note, "domain": "health"})
    findings = response.json()["findings"]

    # Kari (person_name) comes with the first-name Detector; the rest is here.
    assert [(f["category"], demo_note[f["start"] : f["end"]]) for f in findings] == [
        ("fodselsnummer", "01019000083"),
        ("health", "diabetes"),
        ("health", "sykemeldt"),
        ("health", "insulin"),
        ("phone", "+47 912 34 567"),
        ("email", "kari.nordmann@example.com"),
    ]


def test_unknown_domain_returns_422() -> None:
    response = client.post("/detect", json={"text": "tekst", "domain": "school"})

    assert response.status_code == 422


def test_missing_text_returns_422() -> None:
    response = client.post("/detect", json={"domain": "health"})

    assert response.status_code == 422
