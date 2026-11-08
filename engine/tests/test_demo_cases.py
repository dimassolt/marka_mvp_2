"""demo/cases.json: the demo texts give exactly the Findings written down there."""

import json
from pathlib import Path
from typing import Any

import pytest

from ghost_engine.service import DOMAIN_DETECTORS, detect

CASES: list[dict[str, Any]] = json.loads(
    (Path(__file__).parents[2] / "demo" / "cases.json").read_text(encoding="utf-8")
)


@pytest.mark.gliner
@pytest.mark.parametrize("case", CASES, ids=[c["id"] for c in CASES])
def test_demo_case_gives_its_known_findings(case: dict[str, Any]) -> None:
    # The user's own Domain goes to the Engine as Free plus its words, as the Extension sends it.
    domain = case["domain"] if case["domain"] in DOMAIN_DETECTORS else "free"
    findings = detect(case["text"], domain, case.get("words", []))

    text = case["text"]
    expected = [(f["value"], f["start"], f["end"], f["category"]) for f in case["findings"]]
    assert [(text[f.start : f.end], f.start, f.end, f.category) for f in findings] == expected
