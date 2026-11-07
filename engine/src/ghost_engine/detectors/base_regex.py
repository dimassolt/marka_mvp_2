"""Regex Detector for Base Categories (docs/spec.md §1)."""

import re
from collections.abc import Callable
from dataclasses import dataclass

from ghost_engine.detectors import checksums
from ghost_engine.findings import Finding, resolve_overlaps

Classifier = Callable[[str], str | None]
"""Takes the matched text, returns the Category id or None to reject it."""


@dataclass(frozen=True, slots=True)
class _Rule:
    pattern: re.Pattern[str]
    classify: Classifier
    confidence: float
    group: int = 0
    shrink: bool = False
    """If the whole match is rejected, retry shorter prefixes ending on a word."""
    context: re.Pattern[str] | None = None
    """Words that, shortly before the match, raise its confidence by CONTEXT_BOOST."""


CONTEXT_WINDOW = 40
"""How many characters before a match are searched for context words."""
CONTEXT_BOOST = 0.07


def _context_words(*words: str) -> re.Pattern[str]:
    alternatives = "|".join(re.escape(w) for w in sorted(words, key=len, reverse=True))
    return re.compile(rf"(?<!\w)(?:{alternatives})(?!\w)", re.IGNORECASE)


# A plain 11-digit number can pass both the fødselsnummer and the account
# checksum. Without context the fødselsnummer wins (0.92 > 0.90); account words
# nearby lift the account to 0.97; fødselsnummer words lift it to 0.99.
_NATIONAL_ID_CONTEXT = _context_words(
    "fnr", "fødselsnummer", "fødselsnummeret", "fødselsnr", "personnummer",
    "personnummeret", "personnr", "pnr", "d-nummer", "d-nr", "dnr", "id-nummer",
    "ssn", "national id", "national identity number",
)  # fmt: skip
_ACCOUNT_CONTEXT = _context_words(
    "konto", "kontoen", "kontonr", "kontonummer", "kontonummeret", "bankkonto",
    "bankkontoen", "account", "acct", "bank account",
)  # fmt: skip


def _digits(text: str) -> str:
    return re.sub(r"\D", "", text)


def _national_id(match: str) -> str | None:
    digits = _digits(match)
    if not checksums.fodselsnummer_valid(digits):
        return None
    if digits[0] in "0123":
        return "fodselsnummer"
    if digits[0] in "4567":
        return "d_nummer"
    return None


def _bank_account(match: str) -> str | None:
    return "bank_account" if checksums.bank_account_valid(_digits(match)) else None


def _payment_card(match: str) -> str | None:
    digits = _digits(match)
    if 13 <= len(digits) <= 19 and checksums.luhn_valid(digits):
        return "payment_card"
    return None


def _iban(match: str) -> str | None:
    return "iban" if checksums.iban_valid(match) else None


def _always(category: str) -> Classifier:
    return lambda _match: category


_SECRET = re.compile(
    r"(?<![\w-])(?:"
    r"sk-[A-Za-z0-9_-]{20,}"  # OpenAI and similar API keys
    r"|ghp_[A-Za-z0-9]{30,}"  # GitHub personal access token
    r"|AKIA[0-9A-Z]{16}"  # AWS access key id
    r"|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+"  # JWT
    r")(?![\w-])"
)

# Group 1 is the value only. It stops before trailing sentence punctuation.
_PASSWORD = re.compile(
    r"(?<!\w)(?:password|passord|pwd|pw)[ \t]*:[ \t]*(\S+?)(?=[.,;:!?)\]\"']*(?:\s|$))",
    re.IGNORECASE,
)

_EMAIL = re.compile(r"(?<![\w.%+-])[A-Za-z0-9._%+-]+@(?:[A-Za-z0-9-]+\.)+[A-Za-z]{2,}(?![\w-])")

# A phone number must not be a slice of a longer run of digit groups.
_NOT_AFTER_DIGITS = r"(?<![\w+])(?<!\d[ -])"
_NOT_BEFORE_DIGITS = r"(?![ -]?\d)(?!\w)"
_PHONE_NO = re.compile(
    _NOT_AFTER_DIGITS + r"(?:(?:\+|00)47 ?)?[2-9]\d(?: ?\d){6}" + _NOT_BEFORE_DIGITS
)
_PHONE_INTL = re.compile(
    _NOT_AFTER_DIGITS + r"\+(?!47)[1-9]\d{0,2}(?:[ -]?\d){6,12}" + _NOT_BEFORE_DIGITS
)


_RULES: tuple[_Rule, ...] = (
    _Rule(
        pattern=re.compile(r"(?<!\w)\d{6} ?\d{5}(?!\w)"),
        classify=_national_id,
        confidence=0.92,
        context=_NATIONAL_ID_CONTEXT,
    ),
    _Rule(
        # 4.2.5 digits; the separator, if any, must be the same both times.
        pattern=re.compile(r"(?<!\w)\d{4}([. ]?)\d{2}\1\d{5}(?!\w)"),
        classify=_bank_account,
        confidence=0.9,
        context=_ACCOUNT_CONTEXT,
    ),
    _Rule(
        # 13–19 digits, optionally grouped by single spaces or dashes.
        pattern=re.compile(r"(?<!\w)\d(?:[ -]?\d){12,18}(?!\w)"),
        classify=_payment_card,
        confidence=0.95,
    ),
    _Rule(
        # Country code, 2 check digits, then 11–30 letters or digits in any grouping.
        pattern=re.compile(r"(?<!\w)[A-Z]{2}\d{2}(?: ?[A-Z0-9]){11,30}(?!\w)"),
        classify=_iban,
        confidence=0.95,
        shrink=True,
    ),
    _Rule(pattern=_SECRET, classify=_always("secret"), confidence=0.95),
    _Rule(pattern=_PASSWORD, classify=_always("password"), confidence=0.9, group=1),
    _Rule(pattern=_EMAIL, classify=_always("email"), confidence=0.95),
    _Rule(pattern=_PHONE_NO, classify=_always("phone"), confidence=0.85),
    _Rule(pattern=_PHONE_INTL, classify=_always("phone"), confidence=0.85),
)


class BaseRegexDetector:
    """Finds Base Categories that have a fixed shape and, where possible, a checksum."""

    def detect(self, text: str) -> list[Finding]:
        findings: list[Finding] = []
        for rule in _RULES:
            for match in rule.pattern.finditer(text):
                start, end = match.span(rule.group)
                accepted = self._accept(rule, text[start:end])
                if accepted is not None:
                    category, length = accepted
                    confidence = round(rule.confidence + self._boost(rule, text, start), 2)
                    findings.append(Finding(start, start + length, category, confidence))
        # A valid fødselsnummer is also a valid account number; the overlap rule
        # keeps the higher-confidence one.
        return resolve_overlaps(findings)

    @staticmethod
    def _boost(rule: _Rule, text: str, start: int) -> float:
        if rule.context is None:
            return 0.0
        window_start = max(0, start - CONTEXT_WINDOW)
        if rule.context.search(text, window_start, start):
            return CONTEXT_BOOST
        return 0.0

    @staticmethod
    def _accept(rule: _Rule, candidate: str) -> tuple[str, int] | None:
        """(Category, accepted length) for the candidate or its longest valid prefix."""
        category = rule.classify(candidate)
        if category is not None:
            return category, len(candidate)
        if rule.shrink:
            # Cut back to each earlier space: "NO93 8601 1117 947 OK" → "NO93 8601 1117 947".
            for cut in range(len(candidate) - 1, 0, -1):
                if candidate[cut] == " ":
                    category = rule.classify(candidate[:cut])
                    if category is not None:
                        return category, cut
        return None
