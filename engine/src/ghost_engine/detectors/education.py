"""Education Domain Detector: the Bokmål + English keyword list."""

from functools import cache

from ghost_engine.data import load_list
from ghost_engine.detectors.keywords import KeywordDetector

EDUCATION_CONFIDENCE = 0.8


@cache
def education_detector() -> KeywordDetector:
    keywords = load_list("education_keywords.txt")
    return KeywordDetector(keywords, category="education", confidence=EDUCATION_CONFIDENCE)
