from collections.abc import Callable, Iterator
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from ghost_engine import service
from ghost_engine.api import app, model_download, rephrase_download, rephraser
from ghost_engine.model_download import ModelDownload
from ghost_engine.rephrase import (
    RephraseFailedError,
    RephraseInputError,
    RephraseModelFailedError,
    RephraseModelMissingError,
    RephraseStatus,
)

client = TestClient(app)


def test_health_endpoint_reports_ok() -> None:
    response = client.get("/health")

    assert (response.status_code, response.json()) == (200, {"status": "ok"})


def test_detect_returns_findings_in_spec_shape() -> None:
    response = client.post("/detect", json={"text": "fnr 01019000083", "domain": "health"})

    assert response.status_code == 200
    assert response.json() == {
        "findings": [
            {
                "start": 4,
                "end": 15,
                "category": "fodselsnummer",
                "confidence": 0.99,
                "prefix": "FNR",
                "name": "Fødselsnummer",
                "group": "id",
            }
        ]
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


def test_custom_findings_hide_as_data() -> None:
    response = client.post("/detect", json={"text": "Møte på Ullevål", "words": ["ullevål"]})

    finding = response.json()["findings"][0]
    assert (finding["prefix"], finding["name"], finding["group"]) == ("DATA", "Your word", "domain")


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


# GLiNER model download (docs/spec.md §2, ADR-0004) -----------------------------------


@pytest.fixture
def model(tmp_path: Path) -> Iterator[ModelDownload]:
    """A model download that writes a fake model at once, in place of the real one."""

    def download(target: Path) -> None:
        (target / "onnx").mkdir(parents=True)
        (target / "onnx" / "model.onnx").write_bytes(b"x")

    fake = ModelDownload(download, tmp_path, "onnx/model.onnx", run=lambda job: job())
    app.dependency_overrides[model_download] = lambda: fake
    yield fake
    app.dependency_overrides.clear()


def test_model_endpoint_reports_a_missing_model(model: ModelDownload) -> None:
    response = client.get("/model")

    assert (response.status_code, response.json()) == (
        200,
        {"state": "missing", "downloaded_mb": 0, "error": None},
    )


def test_download_endpoint_starts_the_download(model: ModelDownload) -> None:
    response = client.post("/model/download")

    assert response.status_code == 202
    assert response.json()["state"] == "ready"
    assert model.status().state == "ready"


def test_the_extension_may_start_the_download(model: ModelDownload) -> None:
    response = client.post("/model/download", headers={"Origin": "chrome-extension://abcdef"})

    assert response.status_code == 202


def test_a_web_page_may_not_start_the_download(model: ModelDownload) -> None:
    response = client.post("/model/download", headers={"Origin": "https://example.com"})

    assert response.status_code == 403
    assert model.status().state == "missing"


# POST /rephrase -------------------------------------------------------------------------


class FakeRephraser:
    def __init__(self, result: str | Exception) -> None:
        self.result = result
        self.calls: list[tuple[str, str, list[str]]] = []

    def rephrase(self, sentence: str, domain: str, words: list[str]) -> str:
        self.calls.append((sentence, domain, list(words)))
        if isinstance(self.result, Exception):
            raise self.result
        return self.result


@pytest.fixture
def fake_rephraser() -> Iterator[FakeRephraser]:
    fake = FakeRephraser("En kvinne i 30-årene har en kronisk sykdom.")
    app.dependency_overrides[rephraser] = lambda: fake
    yield fake
    app.dependency_overrides.pop(rephraser)


def test_rephrase_returns_the_text_in_spec_shape(fake_rephraser: FakeRephraser) -> None:
    sentence = "Kari, 34 år, jobber som lærer i Bærum og har diabetes type 1."

    response = client.post("/rephrase", json={"sentence": sentence, "domain": "health"})

    assert (response.status_code, response.json()) == (
        200,
        {"text": "En kvinne i 30-årene har en kronisk sykdom."},
    )
    assert fake_rephraser.calls == [(sentence, "health", [])]


def test_rephrase_defaults_to_the_free_domain_and_passes_words(
    fake_rephraser: FakeRephraser,
) -> None:
    client.post("/rephrase", json={"sentence": "Møte på Ullevål.", "words": ["ullevål"]})

    assert fake_rephraser.calls == [("Møte på Ullevål.", "free", ["ullevål"])]


@pytest.mark.parametrize(
    ("error", "status"),
    [
        (RephraseInputError("too long"), 422),
        (service.UnknownDomainError("legal"), 422),
        (RephraseModelMissingError("not downloaded"), 503),
        (RephraseFailedError("unsafe"), 409),
    ],
)
def test_rephrase_errors_map_to_status_codes(
    fake_rephraser: FakeRephraser, error: Exception, status: int
) -> None:
    fake_rephraser.result = error

    response = client.post("/rephrase", json={"sentence": "Kari har diabetes."})

    assert response.status_code == status


def test_rephrase_model_reports_the_state_and_error() -> None:
    class Status:
        def status(self) -> RephraseStatus:
            return RephraseStatus("failed", "not a GGUF file")

    app.dependency_overrides[rephraser] = lambda: Status()
    try:
        response = client.get("/rephrase/model")
    finally:
        app.dependency_overrides.pop(rephraser)

    assert (response.status_code, response.json()) == (
        200,
        {"state": "failed", "downloaded_mb": 0, "error": "not a GGUF file"},
    )


def test_a_rephrase_model_that_failed_to_load_answers_503(fake_rephraser: FakeRephraser) -> None:
    fake_rephraser.result = RephraseModelFailedError("not a GGUF file")

    response = client.post("/rephrase", json={"sentence": "Kari har diabetes."})

    assert response.status_code == 503


# Rephrase model download (docs/spec.md §2) ----------------------------------------------


class StatusOnly:
    def __init__(self, status: RephraseStatus) -> None:
        self._status = status

    def status(self) -> RephraseStatus:
        return self._status


@pytest.fixture
def rephrase_model(tmp_path: Path) -> Iterator[list[ModelDownload]]:
    """A missing rephrase model; its download writes a fake GGUF file, or fails if told to.
    The list holds the download, so a test can replace it."""

    def download(target: Path) -> None:
        target.mkdir(parents=True, exist_ok=True)
        (target / "model.gguf").write_bytes(b"x")

    downloads = [ModelDownload(download, tmp_path, "model.gguf", run=lambda job: job())]
    app.dependency_overrides[rephrase_download] = lambda: downloads[0]
    app.dependency_overrides[rephraser] = lambda: StatusOnly(RephraseStatus("missing"))
    yield downloads
    app.dependency_overrides.clear()


def test_rephrase_model_reports_a_missing_model(rephrase_model: list[ModelDownload]) -> None:
    response = client.get("/rephrase/model")

    assert response.json() == {"state": "missing", "downloaded_mb": 0, "error": None}


def test_rephrase_model_reports_the_download_progress(
    rephrase_model: list[ModelDownload], tmp_path: Path
) -> None:
    jobs: list[Callable[[], None]] = []
    (tmp_path / "part").write_bytes(b"x" * 2_000_000)
    rephrase_model[0] = ModelDownload(lambda target: None, tmp_path, "model.gguf", run=jobs.append)
    rephrase_model[0].start()

    response = client.get("/rephrase/model")

    assert response.json() == {"state": "downloading", "downloaded_mb": 2, "error": None}


def test_a_failed_rephrase_download_is_missing_with_the_error(
    rephrase_model: list[ModelDownload], tmp_path: Path
) -> None:
    def fail(target: Path) -> None:
        raise OSError("no network")

    rephrase_model[0] = ModelDownload(fail, tmp_path, "model.gguf", run=lambda job: job())
    rephrase_model[0].start()

    response = client.get("/rephrase/model")

    assert response.json() == {"state": "missing", "downloaded_mb": 0, "error": "no network"}


def test_a_downloaded_rephrase_model_not_yet_loaded_is_idle(
    rephrase_model: list[ModelDownload],
) -> None:
    response = client.post("/rephrase/model/download")

    assert response.status_code == 202
    assert response.json() == {"state": "idle", "downloaded_mb": 0, "error": None}


def test_a_web_page_may_not_start_the_rephrase_download(
    rephrase_model: list[ModelDownload],
) -> None:
    response = client.post("/rephrase/model/download", headers={"Origin": "https://example.com"})

    assert response.status_code == 403
    assert rephrase_model[0].status().state == "missing"


def test_the_extension_may_start_the_rephrase_download(
    rephrase_model: list[ModelDownload],
) -> None:
    response = client.post(
        "/rephrase/model/download", headers={"Origin": "chrome-extension://abcdef"}
    )

    assert response.status_code == 202
