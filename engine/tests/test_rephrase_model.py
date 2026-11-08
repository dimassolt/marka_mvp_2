from pathlib import Path

import pytest

from ghost_engine.rephrase import RephraseModelMissingError
from ghost_engine.rephrase_model import (
    DEFAULT_MODEL,
    REPHRASE_MODELS,
    load_model,
    model_path,
    model_spec,
)


def test_the_default_is_gemma_4_e2b_q4_k_m() -> None:
    spec = model_spec(DEFAULT_MODEL)

    assert spec.repo == "unsloth/gemma-4-E2B-it-GGUF"
    assert spec.file == "gemma-4-E2B-it-Q4_K_M.gguf"
    assert len(spec.revision) == 40  # pinned to a commit


def test_e4b_can_be_chosen_by_name() -> None:
    assert model_spec("gemma-4-e4b").file == "gemma-4-E4B-it-Q4_K_M.gguf"


def test_an_unknown_model_name_is_rejected() -> None:
    with pytest.raises(ValueError, match="gemma-4-e2b"):
        model_spec("qwen3-1.7b")


def test_the_model_file_lives_in_a_folder_named_after_the_repo(tmp_path: Path) -> None:
    spec = REPHRASE_MODELS[DEFAULT_MODEL]

    assert model_path(spec, tmp_path) == tmp_path / "gemma-4-E2B-it-GGUF" / spec.file


def test_loading_a_missing_model_says_how_to_get_it(tmp_path: Path) -> None:
    with pytest.raises(RephraseModelMissingError, match="fetch_rephrase_model"):
        load_model(REPHRASE_MODELS[DEFAULT_MODEL], tmp_path)
