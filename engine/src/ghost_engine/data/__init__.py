"""Keyword lists and other data files."""

from importlib.resources import files


def load_list(name: str) -> list[str]:
    """Entries from a list in this folder, without comments and blank lines."""
    text = files(__name__).joinpath(name).read_text(encoding="utf-8")
    lines = (line.strip() for line in text.splitlines())
    return [line for line in lines if line and not line.startswith("#")]
