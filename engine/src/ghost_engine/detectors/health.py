"""Health Domain Detector: the Bokmål + English keyword list."""

from functools import cache
from importlib.resources import files

from ghost_engine.detectors.keywords import KeywordDetector

HEALTH_CONFIDENCE = 0.8


def load_keywords(name: str) -> list[str]:
    """Entries from a list in ghost_engine/data, without comments and blank lines."""
    text = files("ghost_engine.data").joinpath(name).read_text(encoding="utf-8")
    lines = (line.strip() for line in text.splitlines())
    return [line for line in lines if line and not line.startswith("#")]


@cache
def health_detector() -> KeywordDetector:
    keywords = load_keywords("health_keywords.txt")
    return KeywordDetector(keywords, category="health", confidence=HEALTH_CONFIDENCE)
