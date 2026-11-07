"""First-name Detector: a capitalised word on the SSB first-name list (docs/spec.md §1).

Two stop-lists cut false names: `first_names_never.txt` is never found, and
`first_names_ambiguous.txt` is not found at the start of a sentence.
"""

import re
from collections.abc import Iterable
from functools import cache

from ghost_engine.data import load_list
from ghost_engine.findings import Finding
from ghost_engine.sentences import split_sentences

PERSON_NAME_CONFIDENCE = 0.6


class FirstNameDetector:
    """Finds first names written with a capital letter, case-sensitive."""

    def __init__(
        self,
        names: Iterable[str],
        *,
        never: Iterable[str] = (),
        ambiguous: Iterable[str] = (),
    ) -> None:
        never_set = set(never)
        self._ambiguous = frozenset(ambiguous)
        ordered = sorted(set(names) - never_set, key=len, reverse=True)
        alternatives = "|".join(re.escape(n) for n in ordered)
        # A genitive s may follow ("Karis lege"); it is not part of the Finding.
        self._pattern = re.compile(rf"(?<![\w-])(?:{alternatives})(?=s?(?![\w-]))")

    def detect(self, text: str) -> list[Finding]:
        matches = list(self._pattern.finditer(text))
        if any(m.group() in self._ambiguous for m in matches):
            starts = _sentence_starts(text)
            matches = [
                m for m in matches if not (m.group() in self._ambiguous and m.start() in starts)
            ]
        return [Finding(m.start(), m.end(), "person_name", PERSON_NAME_CONFIDENCE) for m in matches]


def _sentence_starts(text: str) -> set[int]:
    """Index of the first letter or digit of each sentence ("- Sol" starts at "S")."""
    starts: set[int] = set()
    for start, end in split_sentences(text):
        first = next((i for i in range(start, end) if text[i].isalnum()), None)
        if first is not None:
            starts.add(first)
    return starts


@cache
def first_name_detector() -> FirstNameDetector:
    return FirstNameDetector(
        load_list("first_names.txt"),
        never=load_list("first_names_never.txt"),
        ambiguous=load_list("first_names_ambiguous.txt"),
    )
