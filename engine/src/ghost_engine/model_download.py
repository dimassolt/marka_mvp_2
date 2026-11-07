"""Download the GLiNER model when the user asks for it in the popup (ADR-0004).

The Engine sends no user text anywhere. This is its only network call: it fetches the
pinned model files, and only after POST /model/download.
"""

import threading
from collections.abc import Callable
from dataclasses import dataclass
from functools import cache
from pathlib import Path
from typing import Literal

from ghost_engine.detectors.gliner import MODEL_FILE, download_model, model_dir

State = Literal["missing", "downloading", "ready", "failed"]


@dataclass(frozen=True)
class DownloadStatus:
    state: State
    error: str | None = None
    downloaded_mb: int = 0  # so far, while downloading


class ModelDownload:
    def __init__(
        self,
        download: Callable[[Path], None],
        target: Path,
        model_file: str,
        *,
        run: Callable[[Callable[[], None]], None],
    ) -> None:
        self._download = download
        self._target = target
        self._model_file = model_file
        self._run = run
        # Requests run in a thread pool; two clicks must not start two downloads.
        self._lock = threading.Lock()
        self._downloading = False
        self._error: str | None = None

    def status(self) -> DownloadStatus:
        if self._downloading:
            return DownloadStatus("downloading", downloaded_mb=_megabytes(self._target))
        if (self._target / self._model_file).is_file():
            return DownloadStatus("ready")
        if self._error is not None:
            return DownloadStatus("failed", self._error)
        return DownloadStatus("missing")

    def start(self) -> DownloadStatus:
        """Starts the download in the background, unless it runs or is done already."""
        with self._lock:
            if self.status().state in ("downloading", "ready"):
                return self.status()
            self._downloading = True
            self._error = None
        self._run(self._job)
        return self.status()

    def _job(self) -> None:
        try:
            self._download(self._target)
        except Exception as error:  # shown in the popup; the user can try again
            self._error = str(error) or type(error).__name__
        finally:
            self._downloading = False


def _megabytes(folder: Path) -> int:
    """Size of everything in the folder, unfinished downloads included."""
    total = 0
    for path in folder.rglob("*"):
        try:
            if path.is_file():
                total += path.stat().st_size
        except FileNotFoundError:  # renamed when its download finished
            continue
    return round(total / 1_000_000)


def _in_background(job: Callable[[], None]) -> None:
    # Daemon: stopping the Engine mid-download doesn't wait; the next start resumes it.
    threading.Thread(target=job, name="gliner-download", daemon=True).start()


@cache
def gliner_download() -> ModelDownload:
    return ModelDownload(download_model, model_dir(), MODEL_FILE, run=_in_background)
