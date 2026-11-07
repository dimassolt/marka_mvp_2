"""Health Domain Detector: the Bokmål + English keyword list."""

from functools import cache

from ghost_engine.data import load_list
from ghost_engine.detectors.keywords import KeywordDetector

HEALTH_CONFIDENCE = 0.8


@cache
def health_detector() -> KeywordDetector:
    keywords = load_list("health_keywords.txt")
    return KeywordDetector(keywords, category="health", confidence=HEALTH_CONFIDENCE)
