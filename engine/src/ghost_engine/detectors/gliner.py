"""GLiNER Detector: names, organisations and places."""

import os
import threading
from collections.abc import Callable
from functools import cache
from pathlib import Path
from typing import Any, Protocol

from ghost_engine.findings import Finding
from ghost_engine.sentences import chunk_spans

GLINER_CONFIDENCE = 0.5
SCORE_THRESHOLD = 0.8
# GLiNER reads at most 384 words; 1000 characters stays well inside that.
MAX_CHARS = 1000

# The model tags these as persons; a name always has a capital letter anyway.
PRONOUNS = frozenset(
    ["hun", "han", "hen", "henne", "ham", "de", "dem", "she", "he", "her", "him", "they", "them"]
)

# GLiNER label -> Category id
LABELS = {"person": "person_name", "organization": "organization", "location": "location"}


# Pinned model. scripts/fetch_gliner.py downloads exactly these files into MODELS_DIR.
MODEL_ID = "onnx-community/gliner_multi-v2.1"
MODEL_REVISION = "6ddaeb9413b0e71ad8457da1aab378a165b24058"
MODEL_FILE = "onnx/model_fp16.onnx"
MODEL_FILES = ["*.json", "spm.model", MODEL_FILE]
MODELS_DIR = Path(
    os.environ.get("GHOST_MODELS_DIR", Path(__file__).resolve().parents[3] / "models")
)


class ModelMissingError(RuntimeError):
    """The GLiNER model has not been downloaded."""


class EntityModel(Protocol):
    """The part of fast_gliner's FastGLiNER the Detector uses."""

    def predict_entities(self, input_text: str, labels: list[str]) -> list[dict[str, Any]]: ...


class GlinerDetector:
    def __init__(
        self, load_model: Callable[[], EntityModel], *, max_chars: int = MAX_CHARS
    ) -> None:
        self._load_model = load_model
        self._max_chars = max_chars
        self._model: EntityModel | None = None
        # FastAPI runs requests in a thread pool; two first requests must not load twice.
        self._lock = threading.Lock()

    def _get_model(self) -> EntityModel:
        if self._model is None:
            with self._lock:
                if self._model is None:
                    self._model = self._load_model()
        return self._model

    def detect(self, text: str) -> list[Finding]:
        model = self._get_model()
        findings: list[Finding] = []
        for chunk_start, chunk_end in chunk_spans(text, self._max_chars):
            chunk = text[chunk_start:chunk_end]
            data = chunk.encode()
            for entity in model.predict_entities(chunk, list(LABELS)):
                if not _is_entity(entity):
                    continue
                # The model counts UTF-8 bytes; Findings use Python string indices.
                start = chunk_start + len(data[: entity["start"]].decode())
                end = chunk_start + len(data[: entity["end"]].decode())
                findings.append(Finding(start, end, LABELS[entity["label"]], GLINER_CONFIDENCE))
        return findings


def _is_entity(entity: dict[str, Any]) -> bool:
    text: str = entity["text"]
    return (
        entity["score"] >= SCORE_THRESHOLD
        and any(ch.isupper() for ch in text)
        and text.lower() not in PRONOUNS
    )


def model_dir(models_dir: Path = MODELS_DIR) -> Path:
    return models_dir / MODEL_ID.split("/")[1]


def load_model(models_dir: Path = MODELS_DIR) -> EntityModel:
    """Load the model from disk only. The Engine never downloads at runtime (ADR-0001)."""
    path = model_dir(models_dir)
    if not (path / MODEL_FILE).is_file():
        raise ModelMissingError(
            f"GLiNER model not found in {path}. "
            "Run from engine/: uv run python scripts/fetch_gliner.py"
        )
    from fast_gliner import FastGLiNER  # heavy import, only when the model is needed

    model: EntityModel = FastGLiNER.from_pretrained(str(path), onnx_path=MODEL_FILE)
    return model


@cache
def gliner_detector() -> GlinerDetector:
    return GlinerDetector(load_model)
