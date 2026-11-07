"""Convert Python string indices to UTF-16 units, the way JavaScript counts."""

from itertools import accumulate


class Utf16Offsets:
    """Lookup table from Python index to UTF-16 index for one text."""

    def __init__(self, text: str) -> None:
        # Characters outside the BMP (emoji) take two UTF-16 units.
        widths = (2 if ord(ch) > 0xFFFF else 1 for ch in text)
        self._table = [0, *accumulate(widths)]

    def convert(self, index: int) -> int:
        return self._table[index]
