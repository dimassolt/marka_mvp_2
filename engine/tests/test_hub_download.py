"""Model downloads write the file steadily, so the popup's progress bar moves (fix/rephrase).

With Xet, huggingface_hub writes a model in blocks of about 67 MB: the bar stood still for
80 s, then jumped. Plain HTTP writes about 10 MB a second, and was faster too.
"""

from pathlib import Path
from typing import Any

import huggingface_hub
import pytest
from huggingface_hub import constants

from ghost_engine.detectors import gliner
from ghost_engine.rephrase_model import download_model, model_spec


@pytest.fixture
def xet_at_call(monkeypatch: pytest.MonkeyPatch) -> list[bool]:
    """Whether Xet was off when each huggingface_hub download was called."""
    seen: list[bool] = []

    def record(*args: Any, **kwargs: Any) -> str:
        seen.append(constants.HF_HUB_DISABLE_XET)
        return ""

    monkeypatch.setattr(constants, "HF_HUB_DISABLE_XET", False)
    monkeypatch.setattr(huggingface_hub, "snapshot_download", record)
    monkeypatch.setattr(huggingface_hub, "hf_hub_download", record)
    return seen


def test_the_gliner_download_uses_plain_http(xet_at_call: list[bool], tmp_path: Path) -> None:
    gliner.download_model(tmp_path)

    assert xet_at_call == [True]


def test_the_rephrase_download_uses_plain_http(xet_at_call: list[bool], tmp_path: Path) -> None:
    download_model(model_spec(), tmp_path)

    assert xet_at_call == [True]
