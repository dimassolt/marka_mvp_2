"""Religious Domain Detector: the Bokmål + English keyword list."""

from functools import cache

from ghost_engine.data import load_list
from ghost_engine.detectors.keywords import KeywordDetector

RELIGIOUS_CONFIDENCE = 0.8


@cache
def religious_detector() -> KeywordDetector:
    keywords = load_list("religious_keywords.txt")
    return KeywordDetector(keywords, category="religious", confidence=RELIGIOUS_CONFIDENCE)
