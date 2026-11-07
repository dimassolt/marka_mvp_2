"""Size and shape of the Domain keyword lists.

Every list is split into `## Bokmål: ...`, `## English: ...` and, for names and
codes that are the same in both languages, `## Shared: ...` sections.
"""

from collections import Counter
from importlib.resources import files

import pytest

DOMAIN_LISTS = [
    "health_keywords.txt",
    "education_keywords.txt",
    "courts_keywords.txt",
    "industrial_keywords.txt",
    "religious_keywords.txt",
]
LANGUAGES = ("Bokmål", "English", "Shared")
MIN_PER_LANGUAGE = 150


def sections(name: str) -> dict[str, list[str]]:
    """Entries per language, from the `## Language: topic` headers."""
    text = files("ghost_engine.data").joinpath(name).read_text(encoding="utf-8")
    entries: dict[str, list[str]] = {}
    language = None
    for raw in text.splitlines():
        line = raw.strip()
        if line.startswith("## "):
            language = line[3:].split(":")[0].strip()
            continue
        if not line or line.startswith("#"):
            continue
        assert language is not None, f"{name}: entry {line!r} before the first ## header"
        entries.setdefault(language, []).append(line)
    return entries


@pytest.mark.parametrize("name", DOMAIN_LISTS)
def test_every_section_header_names_a_language(name: str) -> None:
    assert set(sections(name)) <= set(LANGUAGES)


@pytest.mark.parametrize("name", DOMAIN_LISTS)
@pytest.mark.parametrize("language", ["Bokmål", "English"])
def test_every_domain_list_has_at_least_150_entries_per_language(name: str, language: str) -> None:
    assert len(sections(name).get(language, [])) >= MIN_PER_LANGUAGE


@pytest.mark.parametrize("name", DOMAIN_LISTS)
def test_no_entry_is_listed_twice(name: str) -> None:
    all_entries = [e.lower() for entries in sections(name).values() for e in entries]
    assert [e for e, n in Counter(all_entries).items() if n > 1] == []
