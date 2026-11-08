"""Every later mention of a found person (docs/spec.md §1, `person_name`).

GLiNER finds "Ola Nordmann" once, but not "Nordmann" alone two sentences later. Once a name
of two or more words is found, each of its words and the whole name are names wherever else
they stand. One-word names are left to the first-name list, which finds them itself.
"""

import re
from collections.abc import Iterable

from ghost_engine.findings import Finding, resolve_overlaps

# Below the list and regex Detectors, like GLiNER: a repeat never beats a Finding of equal length.
REPEAT_CONFIDENCE = 0.5

_WORD = re.compile(r"\w[\w-]*")


def name_repeats(text: str, findings: Iterable[Finding]) -> list[Finding]:
    """New person_name Findings for other mentions of the full names in `findings`."""
    found = list(findings)
    names: set[str] = set()
    for f in found:
        if f.category != "person_name":
            continue
        words = [w for w in _WORD.findall(text[f.start : f.end]) if len(w) > 1 and w[0].isupper()]
        if len(words) >= 2:
            names.update(words)
            names.add(" ".join(words))
    if not names:
        return []
    alternatives = "|".join(
        r"\s+".join(map(re.escape, n.split())) for n in sorted(names, key=len, reverse=True)
    )
    # Case-sensitive, whole words; a genitive s may follow ("Nordmanns lege") but isn't kept.
    pattern = re.compile(rf"(?<![\w-])(?:{alternatives})(?=s?(?![\w-]))")
    repeats = [
        Finding(m.start(), m.end(), "person_name", REPEAT_CONFIDENCE)
        for m in pattern.finditer(text)
    ]
    return resolve_overlaps(r for r in repeats if not any(r.overlaps(f) for f in found))
