"""Courts Domain Detector: the Bokmål + English keyword list."""

from functools import cache

from ghost_engine.data import load_list
from ghost_engine.detectors.keywords import KeywordDetector

COURTS_CONFIDENCE = 0.8


@cache
def courts_detector() -> KeywordDetector:
    keywords = load_list("courts_keywords.txt")
    return KeywordDetector(keywords, category="courts", confidence=COURTS_CONFIDENCE)
