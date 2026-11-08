from collections.abc import Callable
from pathlib import Path

from ghost_engine.model_download import ModelDownload

MODEL_FILE = "onnx/model.onnx"


def write_model(target: Path) -> None:
    (target / "onnx").mkdir(parents=True, exist_ok=True)
    (target / MODEL_FILE).write_bytes(b"x")


def make(tmp_path: Path, download: Callable[[Path], None] = write_model) -> ModelDownload:
    # Runs the download in the calling thread, so the test sees the result at once.
    return ModelDownload(download, tmp_path / "model", MODEL_FILE, run=lambda job: job())


def test_status_is_missing_before_the_model_is_downloaded(tmp_path: Path) -> None:
    assert make(tmp_path).status().state == "missing"


def test_status_is_ready_when_the_model_file_is_on_disk(tmp_path: Path) -> None:
    write_model(tmp_path / "model")

    assert make(tmp_path).status().state == "ready"


def test_start_downloads_into_the_model_folder_and_becomes_ready(tmp_path: Path) -> None:
    targets: list[Path] = []

    def download(target: Path) -> None:
        targets.append(target)
        write_model(target)

    model = make(tmp_path, download)

    assert model.start().state == "ready"
    assert targets == [tmp_path / "model"]


def test_a_second_start_while_downloading_does_not_download_twice(tmp_path: Path) -> None:
    jobs: list[Callable[[], None]] = []  # started but not finished yet
    model = ModelDownload(write_model, tmp_path / "model", MODEL_FILE, run=jobs.append)

    assert model.start().state == "downloading"
    assert model.start().state == "downloading"
    assert len(jobs) == 1

    jobs[0]()
    assert model.status().state == "ready"


def test_start_when_ready_does_nothing(tmp_path: Path) -> None:
    write_model(tmp_path / "model")
    jobs: list[Callable[[], None]] = []
    model = ModelDownload(write_model, tmp_path / "model", MODEL_FILE, run=jobs.append)

    assert model.start().state == "ready"
    assert jobs == []


def test_a_failed_download_reports_the_error_and_can_be_retried(tmp_path: Path) -> None:
    attempts: list[Path] = []

    def flaky(target: Path) -> None:
        attempts.append(target)
        if len(attempts) == 1:
            raise OSError("no network")
        write_model(target)

    model = make(tmp_path, flaky)

    failed = model.start()
    assert (failed.state, failed.error) == ("failed", "no network")
    assert model.start().state == "ready"
    assert model.status().error is None


def test_status_counts_the_megabytes_on_disk_while_downloading(tmp_path: Path) -> None:
    jobs: list[Callable[[], None]] = []
    model = ModelDownload(write_model, tmp_path / "model", MODEL_FILE, run=jobs.append)
    model.start()
    # huggingface_hub keeps unfinished files in a hidden cache folder inside the target.
    partial = tmp_path / "model" / ".cache" / "download"
    partial.mkdir(parents=True)
    (partial / "model.onnx.incomplete").write_bytes(b"0" * 2_500_000)
    (tmp_path / "model" / "config.json").write_bytes(b"0" * 600_000)

    assert model.status().downloaded_mb == 3


def test_a_finished_download_calls_on_ready_once_the_status_is_ready(tmp_path: Path) -> None:
    # The rephrase model loads as soon as it is on disk (docs/spec.md §2, GET /rephrase/model).
    seen: list[str] = []
    model = ModelDownload(
        write_model,
        tmp_path / "model",
        MODEL_FILE,
        run=lambda job: job(),
        on_ready=lambda: seen.append(model.status().state),
    )

    model.start()

    assert seen == ["ready"]


def test_a_failed_download_does_not_call_on_ready(tmp_path: Path) -> None:
    def fail(target: Path) -> None:
        raise OSError("no network")

    seen: list[str] = []
    model = ModelDownload(
        fail,
        tmp_path / "model",
        MODEL_FILE,
        run=lambda job: job(),
        on_ready=lambda: seen.append("x"),
    )

    model.start()

    assert seen == []
