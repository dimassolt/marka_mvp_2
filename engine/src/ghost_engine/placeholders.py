"""Ghost's own Placeholders (docs/spec.md §3) are never Findings.

A hidden value is already gone; flagging `[PERSON_1]` again would ask the user to hide it twice.
"""

import re
from collections.abc import Iterable

from ghost_engine.findings import Finding

# `[<PREFIX>_<n>]`, as the Extension writes it: an uppercase prefix and a number.
PLACEHOLDER = re.compile(r"\[[A-Z]+_\d+\]")


def outside_placeholders(text: str, findings: Iterable[Finding]) -> list[Finding]:
    """The Findings that don't touch a Placeholder in the text."""
    spans = [m.span() for m in PLACEHOLDER.finditer(text)]
    return [f for f in findings if not any(f.start < end and start < f.end for start, end in spans)]
