"""First-name Detector: a capitalised word on the SSB first-name list (docs/spec.md §1)."""

import re
from collections.abc import Iterable
from functools import cache

from ghost_engine.data import load_list
from ghost_engine.findings import Finding

PERSON_NAME_CONFIDENCE = 0.6


class FirstNameDetector:
    """Finds first names written with a capital letter, case-sensitive."""

    def __init__(self, names: Iterable[str]) -> None:
        ordered = sorted(set(names), key=len, reverse=True)
        alternatives = "|".join(re.escape(n) for n in ordered)
        # A genitive s may follow ("Karis lege"); it is not part of the Finding.
        self._pattern = re.compile(rf"(?<![\w-])(?:{alternatives})(?=s?(?![\w-]))")

    def detect(self, text: str) -> list[Finding]:
        return [
            Finding(m.start(), m.end(), "person_name", PERSON_NAME_CONFIDENCE)
            for m in self._pattern.finditer(text)
        ]


@cache
def first_name_detector() -> FirstNameDetector:
    return FirstNameDetector(load_list("first_names.txt"))
