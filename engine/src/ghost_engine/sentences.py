"""Regex sentence splitter, used for GLiNER chunks and sentence-start checks.

A sentence ends at a line break, or at `.`, `!` or `?` followed by whitespace.
A full stop does not end it after a known abbreviation ("f.eks.", "dr.") or after
an ordinal number before a lowercase word ("1. januar").
"""

import re

Span = tuple[int, int]

_BOUNDARY = re.compile(r"[.!?]+(?=\s)|\n")
_WORD_BEFORE_DOT = re.compile(r"[\w.]*$")
_NEXT_WORD = re.compile(r"\s*(\S?)")

# Lowercase, without the final full stop. Left out on purpose because they
# usually end a sentence: "osv.", "etc.", "kr.", "no.".
# fmt: off
ABBREVIATIONS = frozenset([
    # Bokmål
    "f.eks", "feks", "dvs", "bl.a", "ca", "kl", "nr", "dr", "jf", "mht", "pga", "iht",
    "evt", "tlf", "mob", "st", "ref", "vedr", "ang", "inkl", "ekskl", "prof", "pr",
    "o.l", "m.m", "m.fl", "t.o.m", "f.o.m",
    # English
    "e.g", "i.e", "mr", "mrs", "ms", "vs", "approx", "fig",
])
# fmt: on
_LONGEST_ABBREVIATION = max(map(len, ABBREVIATIONS))


def split_sentences(text: str) -> list[Span]:
    """(start, end) of each sentence, as Python indices, trimmed of whitespace."""
    spans: list[Span] = []
    start = 0
    for match in _BOUNDARY.finditer(text):
        if _continues(text, match):
            continue
        end = match.end() if match.group() != "\n" else match.start()
        _append_trimmed(text, start, end, spans)
        start = match.end()
    _append_trimmed(text, start, len(text), spans)
    return spans


def _continues(text: str, boundary: re.Match[str]) -> bool:
    """True if a full stop here belongs to an abbreviation or an ordinal."""
    if boundary.group() != ".":
        return False
    # Look back only a little, so long texts stay linear.
    lookback = max(0, boundary.start() - _LONGEST_ABBREVIATION - 1)
    word_match = _WORD_BEFORE_DOT.search(text, lookback, boundary.start())
    word = word_match.group() if word_match else ""
    if word.lower() in ABBREVIATIONS:
        return True
    next_match = _NEXT_WORD.match(text, boundary.end())
    next_char = next_match.group(1) if next_match else ""
    return word.isdigit() and next_char.islower()


def _append_trimmed(text: str, start: int, end: int, spans: list[Span]) -> None:
    while start < end and text[start].isspace():
        start += 1
    while end > start and text[end - 1].isspace():
        end -= 1
    if start < end:
        spans.append((start, end))


def chunk_spans(text: str, max_chars: int) -> list[Span]:
    """Pack whole sentences into chunks of at most `max_chars`, for models with a
    limited input window (GLiNER). A longer sentence is cut at whitespace, and a
    longer word is cut hard."""
    pieces = [piece for span in split_sentences(text) for piece in _cut(text, span, max_chars)]
    chunks: list[Span] = []
    for start, end in pieces:
        if chunks and end - chunks[-1][0] <= max_chars:
            chunks[-1] = (chunks[-1][0], end)
        else:
            chunks.append((start, end))
    return chunks


def _cut(text: str, span: Span, max_chars: int) -> list[Span]:
    start, end = span
    pieces: list[Span] = []
    while end - start > max_chars:
        limit = start + max_chars
        space = max((i for i in range(start + 1, limit + 1) if text[i].isspace()), default=None)
        cut = space if space is not None else limit
        _append_trimmed(text, start, cut, pieces)
        start = cut
    _append_trimmed(text, start, end, pieces)
    return pieces
