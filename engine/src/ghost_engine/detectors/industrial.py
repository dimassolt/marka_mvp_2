"""Industrial Domain Detector: the Bokmål + English keyword list."""

from functools import cache

from ghost_engine.data import load_list
from ghost_engine.detectors.keywords import KeywordDetector

INDUSTRIAL_CONFIDENCE = 0.8


@cache
def industrial_detector() -> KeywordDetector:
    keywords = load_list("industrial_keywords.txt")
    return KeywordDetector(keywords, category="industrial", confidence=INDUSTRIAL_CONFIDENCE)
