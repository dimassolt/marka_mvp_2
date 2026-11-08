"""scripts/fetch_gliner.py, which the install scripts run on every install."""

import importlib.util
from pathlib import Path
from types import ModuleType

import pytest

from ghost_engine.detectors.gliner import MODEL_FILE

SCRIPT = Path(__file__).parents[1] / "scripts" / "fetch_gliner.py"


def load_script(monkeypatch: pytest.MonkeyPatch, target: Path, downloads: list[Path]) -> ModuleType:
    spec = importlib.util.spec_from_file_location("fetch_gliner", SCRIPT)
    assert spec and spec.loader
    script = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(script)

    def download(path: Path) -> None:
        downloads.append(path)
        (path / MODEL_FILE).parent.mkdir(parents=True, exist_ok=True)
        (path / MODEL_FILE).write_bytes(b"x")

    monkeypatch.setattr(script, "download_model", download)
    monkeypatch.setattr(script, "model_dir", lambda: target)
    return script


def test_a_model_already_on_disk_is_not_downloaded_again(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    # Re-running install.sh must not reach the Hugging Face Hub, and works offline.
    (tmp_path / MODEL_FILE).parent.mkdir(parents=True)
    (tmp_path / MODEL_FILE).write_bytes(b"x")
    downloads: list[Path] = []

    load_script(monkeypatch, tmp_path, downloads).main()

    assert downloads == []


def test_a_missing_model_is_downloaded(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    downloads: list[Path] = []

    load_script(monkeypatch, tmp_path, downloads).main()

    assert downloads == [tmp_path]
