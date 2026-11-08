"""The rephrase model: Gemma 4 E2B (instruction-tuned, Q4_K_M GGUF) through llama-cpp-python.

Gemma 4 (April 2026) replaced the Qwen3 1.7B of the first spec: it is newer and the strongest
open family on Norwegian in EuroEval, and the Opera Edition runs the same E2B model. Set
GHOST_REPHRASE_MODEL=gemma-4-e4b for the larger E4B on a machine with RAM to spare.

The model is loaded from disk only (ADR-0001). scripts/fetch_rephrase_model.py downloads it,
and so does POST /rephrase/model/download when the user asks in the popup.
"""

import os
from dataclasses import dataclass
from functools import cache
from pathlib import Path
from typing import Any

from ghost_engine.detectors.gliner import MODELS_DIR
from ghost_engine.model_download import ModelDownload, in_background
from ghost_engine.ports import ChatModel
from ghost_engine.rephrase import RephraseModelMissingError, Rephraser

CONTEXT_TOKENS = 2048  # the prompt with its examples plus a 1000-character sentence


@dataclass(frozen=True)
class ModelSpec:
    repo: str
    revision: str
    file: str


REPHRASE_MODELS = {
    "gemma-4-e2b": ModelSpec(  # about 3.1 GB
        "unsloth/gemma-4-E2B-it-GGUF",
        "0314792d7f1f7e229411f620751375812bb9faf2",
        "gemma-4-E2B-it-Q4_K_M.gguf",
    ),
    "gemma-4-e4b": ModelSpec(  # about 5.0 GB
        "unsloth/gemma-4-E4B-it-GGUF",
        "bfc15c382204943c3a8fff0c750b94ae2364d7a3",
        "gemma-4-E4B-it-Q4_K_M.gguf",
    ),
}
DEFAULT_MODEL = "gemma-4-e2b"


def model_spec(name: str | None = None) -> ModelSpec:
    name = name or os.environ.get("GHOST_REPHRASE_MODEL") or DEFAULT_MODEL
    if name not in REPHRASE_MODELS:
        raise ValueError(f"unknown rephrase model {name!r}; use one of {sorted(REPHRASE_MODELS)}")
    return REPHRASE_MODELS[name]


def model_path(spec: ModelSpec, models_dir: Path = MODELS_DIR) -> Path:
    return models_dir / spec.repo.split("/")[1] / spec.file


def download_model(spec: ModelSpec, models_dir: Path = MODELS_DIR) -> Path:
    """Fetch the pinned GGUF file. Only scripts/fetch_rephrase_model.py calls this."""
    from huggingface_hub import hf_hub_download  # only needed for the download

    from ghost_engine.hub import plain_http

    plain_http()
    path = model_path(spec, models_dir)
    hf_hub_download(spec.repo, spec.file, revision=spec.revision, local_dir=path.parent)
    return path


class LlamaChatModel:
    """ChatModel on llama-cpp-python. The GGUF file carries Gemma's own chat template."""

    def __init__(self, llama: Any) -> None:
        self._llama = llama

    def chat(self, messages: list[dict[str, str]], *, temperature: float, max_tokens: int) -> str:
        reply = self._llama.create_chat_completion(
            messages=messages, temperature=temperature, max_tokens=max_tokens
        )
        content = reply["choices"][0]["message"]["content"]
        return content if isinstance(content, str) else ""


def load_model(spec: ModelSpec | None = None, models_dir: Path = MODELS_DIR) -> ChatModel:
    """Load the model from disk only. Rephrasing never downloads (ADR-0001)."""
    path = model_path(spec or model_spec(), models_dir)
    if not path.is_file():
        raise RephraseModelMissingError(
            f"Rephrase model not found at {path}. "
            "Run from engine/: uv run python scripts/fetch_rephrase_model.py"
        )
    from llama_cpp import Llama  # heavy import, only when the model is needed

    # n_gpu_layers=-1 puts every layer on Metal or CUDA when the build has it, else the CPU.
    llama = Llama(model_path=str(path), n_ctx=CONTEXT_TOKENS, n_gpu_layers=-1, verbose=False)
    return LlamaChatModel(llama)


@cache
def rephraser() -> Rephraser:
    return Rephraser(load_model)


@cache
def rephrase_download(models_dir: Path = MODELS_DIR) -> ModelDownload:
    """The popup's download of the rephrase model. Once it is on disk, the model loads."""
    spec = model_spec()

    def download(target: Path) -> None:
        download_model(spec, models_dir)

    return ModelDownload(
        download,
        model_path(spec, models_dir).parent,
        spec.file,
        run=in_background,
        on_ready=rephraser().warm,
    )
