"""Regex sentence splitter, used for GLiNER chunks and sentence-start checks.

A sentence ends at a line break, or at `.`, `!` or `?` followed by whitespace.
"""

import re

Span = tuple[int, int]

_BOUNDARY = re.compile(r"[.!?]+(?=\s)|\n")


def split_sentences(text: str) -> list[Span]:
    """(start, end) of each sentence, as Python indices, trimmed of whitespace."""
    spans: list[Span] = []
    start = 0
    for match in _BOUNDARY.finditer(text):
        end = match.end() if match.group() != "\n" else match.start()
        _append_trimmed(text, start, end, spans)
        start = match.end()
    _append_trimmed(text, start, len(text), spans)
    return spans


def _append_trimmed(text: str, start: int, end: int, spans: list[Span]) -> None:
    while start < end and text[start].isspace():
        start += 1
    while end > start and text[end - 1].isspace():
        end -= 1
    if start < end:
        spans.append((start, end))
