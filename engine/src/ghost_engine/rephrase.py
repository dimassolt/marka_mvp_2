"""The rephrase use case (docs/spec.md §2, POST /rephrase).

A local language model rewrites one sentence so it no longer reveals sensitive data. It is
told exactly what Ghost found. The model is not trusted: its answer is cleaned, then checked
in code. The rewrite must not contain any value found in the sentence (in any case or another
form of the word), no new ID number, email or phone, and it must keep every Placeholder and
invent none. If a check fails, the model gets one more try with the problems named; then the
Engine refuses. A new general word that is on a keyword list ("sykdom") is safe, but the
Extension would underline it after Accept (docs/spec.md §3), so the model is asked once for
plainer words; the rewrite with the fewest such words wins.
"""

import logging
import re
import threading
import time
from collections.abc import Callable, Sequence
from dataclasses import dataclass
from typing import Literal

from ghost_engine import service
from ghost_engine.findings import Finding, category_info
from ghost_engine.placeholders import PLACEHOLDER
from ghost_engine.ports import ChatModel

Message = dict[str, str]  # {"role": "system" | "user" | "assistant", "content": ...}
DetectFn = Callable[[str, str, Sequence[str]], list[Finding]]

MAX_CHARS = 1000
ATTEMPTS = 2
TEMPERATURES = (0.3, 0.7)  # the second try may stray further from the first
MAX_TOKENS = 256
# Two words with a common start this long are forms of one word (sykemeldt, sykemelding).
SAME_WORD_PREFIX = 5
NEVER_NEW = frozenset(["email", "phone"])  # with every Category in the "id" group

SYSTEM = """You make one sentence safe to send to an AI chatbot. Rewrite it so it no longer \
reveals who it is about or other sensitive details, but keeps its meaning and purpose.

Rules:
1. Replace names, exact ages, ID numbers, phone numbers, email addresses, street addresses, \
workplaces and small places with general words, for example "en kvinne i 30-årene", \
"en lærer", "en kommune på Østlandet".
{domain_rule}\
3. If the sentence has placeholders in square brackets, like [PERSON_1], keep each one \
exactly as written. Never write a new placeholder or anything else in square brackets.
4. Do not add facts.
5. Write in the same language as the sentence.
6. Answer with the rewritten sentence only: no explanation, no quotes."""

DOMAIN_RULES = {
    "free": "",
    "health": "Replace diagnoses, medicines, treatments, test results and sick leave with "
    'general words, for example "en helseutfordring", "et legemiddel", "behandling", '
    '"ute av jobb en periode".',
    "education": "Replace grades, absence, special needs, discipline, exams and school "
    'names about a student with general words, for example "en elev som trenger ekstra '
    'støtte", "borte fra undervisningen".',
    "courts": "Replace case numbers, parties, closed or sensitive case types and decisions "
    'that are not announced with general words, for example "en familiesak", '
    '"en avgjørelse", "tid med barna", "ikke åpen for publikum".',
    "industrial": "Replace machine makers, machine counts, production figures, line and "
    'plant names and control-system details with general words, for example "maskinene", '
    '"utstyret", "en leverandør".',
    "religious": "Replace membership, faith communities, pastoral care, ceremonies and "
    'donations linked to a person with general words, for example "en samtale", '
    '"et fellesskap".',
}

# Worked examples, Norwegian and English. None has a Placeholder: a small model copies
# `[PERSON_1]` from an example into sentences that have none.
EXAMPLES: tuple[tuple[str, str], ...] = (
    (
        "Pasienten heter Per Olsen, er 52 år og ringer fra 98 76 54 32 i Bodø.",
        "Pasienten er en mann i 50-årene som ringer fra Nord-Norge.",
    ),
    (
        "Email Sarah Jones, 41, at sarah@acme.com before the board meeting in Leeds.",
        "Email a colleague in her forties before the board meeting.",
    ),
)


# A sentence's language, told to the model outright: a 2B model often ignores "the same
# language as the sentence". Common short words decide; æ, ø or å means Norwegian.
LANGUAGES = {"nb": "Norwegian Bokmål", "en": "English"}
_NORWEGIAN_WORDS = frozenset(
    "og er har i på som til med en et ei av ikke det den de jeg du hun han vi meg seg skal "  # noqa: SIM905
    "kan vil fra om var heter ble får går kom".split()
)
_ENGLISH_WORDS = frozenset(
    "the and is are was were has have of to with a an not it this that she he we my his her "  # noqa: SIM905
    "be from on at by last".split()
)


# uvicorn prints this logger, so the Engine's terminal shows when the model is ready.
# Never log user text here (ADR-0001).
log = logging.getLogger("uvicorn.error")

State = Literal["idle", "loading", "ready", "missing", "failed"]


@dataclass(frozen=True)
class RephraseStatus:
    """The model's state for GET /rephrase/model: idle until the first load starts."""

    state: State
    error: str | None = None


class RephraseInputError(ValueError):
    """The sentence is empty or longer than MAX_CHARS."""


class RephraseModelMissingError(RuntimeError):
    """The rephrase model has not been downloaded."""


class RephraseModelFailedError(RuntimeError):
    """The rephrase model is on disk but could not be loaded."""


class RephraseFailedError(RuntimeError):
    """Every attempt still revealed sensitive data or broke a Placeholder."""


class Rephraser:
    def __init__(
        self,
        load_model: Callable[[], ChatModel],
        *,
        detect: DetectFn = service.detect,
        attempts: int = ATTEMPTS,
    ) -> None:
        self._load_model = load_model
        self._detect = detect
        self._attempts = attempts
        self._model: ChatModel | None = None
        self._state: State = "idle"
        self._error: str | None = None
        self._load_lock = threading.Lock()
        # Requests run in a thread pool, and a llama.cpp context serves one call at a time.
        self._chat_lock = threading.Lock()

    def status(self) -> RephraseStatus:
        return RephraseStatus(self._state, self._error)

    def warm(self) -> None:
        """Load the model now, so the first Rephrase click doesn't wait for it."""
        started = time.monotonic()
        try:
            self._get_model()
        except RephraseModelMissingError as error:
            log.warning("Rephrase model missing: %s", error)
        except RephraseModelFailedError as error:
            log.error("Rephrase model failed to load: %s", error)
        else:
            log.info("Rephrase model ready (loaded in %.1f s)", time.monotonic() - started)

    def rephrase(self, sentence: str, domain: str, words: Sequence[str] = ()) -> str:
        if not sentence.strip():
            raise RephraseInputError("the sentence is empty")
        if len(sentence) > MAX_CHARS:
            raise RephraseInputError(f"the sentence is longer than {MAX_CHARS} characters")
        service.check_domain(domain)
        model = self._get_model()

        keep = set(PLACEHOLDER.findall(sentence))
        found = sorted({_utf16_slice(sentence, f) for f in self._detect(sentence, domain, words)})
        language = language_of(sentence)
        problems: list[str] = []
        best: tuple[int, str] | None = None  # safe, but with new keyword words: (count, text)
        for attempt in range(self._attempts):
            messages = _prompt(sentence, domain, found, language, problems)
            temperature = TEMPERATURES[min(attempt, len(TEMPERATURES) - 1)]
            with self._chat_lock:
                reply = model.chat(messages, temperature=temperature, max_tokens=MAX_TOKENS)
            text = clean(reply)
            problems, flagged = self._problems(text, domain, words, keep, found)
            answered_in = language_of(text)
            if language and answered_in and answered_in != language:
                problems.append(f"Your last answer was not in {LANGUAGES[language]}.")
            if problems:
                continue
            if not flagged:
                return text
            if best is None or len(flagged) < best[0]:
                best = (len(flagged), text)
            problems = [f"Avoid {_quoted(flagged)}: use plainer, more general words."]
        if best is not None:
            return best[1]
        raise RephraseFailedError("could not rephrase without sensitive data")

    def _get_model(self) -> ChatModel:
        if self._model is None:
            with self._load_lock:
                if self._model is None:
                    self._model = self._load()
        return self._model

    def _load(self) -> ChatModel:
        """One load attempt. A missing or broken model is tried again on the next call."""
        self._state, self._error = "loading", None
        try:
            model = self._load_model()
        except RephraseModelMissingError:
            self._state = "missing"
            raise
        except Exception as error:  # llama.cpp can't read the file, too little memory, ...
            self._state, self._error = "failed", str(error) or type(error).__name__
            raise RephraseModelFailedError(self._error) from error
        self._state = "ready"
        return model

    def _problems(
        self, text: str, domain: str, words: Sequence[str], keep: set[str], found: list[str]
    ) -> tuple[list[str], list[str]]:
        """What is wrong with a rewrite, as instructions for the next try (empty means safe),
        and the new general words in it that a Detector still flags."""
        if not text:
            return ["Your last answer was empty. Answer with the rewritten sentence."], []
        leftovers = {value for value in found if _contains(text, value)}
        flagged: set[str] = set()
        for finding in self._detect(text, domain, words):
            value = _utf16_slice(text, finding)
            never_new = (
                category_info(finding.category)["group"] == "id" or finding.category in NEVER_NEW
            )
            if never_new or any(_same_word(value, original) for original in found):
                leftovers.add(value)
            elif category_info(finding.category)["group"] == "domain":
                flagged.add(value)  # a keyword-list word; a name tag may be GLiNER guessing
        problems = []
        if leftovers:
            problems.append(
                f"Your last answer still contained {_quoted(sorted(leftovers))}. "
                "Replace it with general words."
            )
        in_text = set(PLACEHOLDER.findall(text))
        if missing := sorted(keep - in_text):
            problems.append(f"Your answer must keep {', '.join(missing)} exactly as written.")
        if invented := sorted(in_text - keep):
            problems.append(f"Do not write {', '.join(invented)}. Use plain words instead.")
        return problems, sorted(flagged - leftovers)


def _prompt(
    sentence: str, domain: str, found: list[str], language: str | None, problems: list[str]
) -> list[Message]:
    rule = DOMAIN_RULES[domain]
    system = SYSTEM.format(domain_rule=f"2. {rule}\n" if rule else "")
    messages: list[Message] = [{"role": "system", "content": system}]
    for example, rewrite in EXAMPLES:
        messages.append({"role": "user", "content": _ask(example)})
        messages.append({"role": "assistant", "content": rewrite})
    ask = _ask(sentence)
    if found:
        ask += f"\n\nSensitive parts: {_quoted(found)}. Remove or generalize every one."
    if problems:
        ask += "\n\n" + "\n".join(problems)
    if language:
        ask += f"\n\nAnswer in {LANGUAGES[language]}."
    messages.append({"role": "user", "content": ask})
    return messages


def _ask(sentence: str) -> str:
    # The tags keep the model from answering a question inside the sentence.
    return f"Rewrite this sentence:\n<sentence>{sentence}</sentence>"


_THINK = re.compile(r"<think>.*?</think>", re.DOTALL)
_TAGS = re.compile(r"</?sentence>")
_LABEL = re.compile(
    r"^(?:omskrevet(?: setning)?|ny setning|rewritten(?: sentence)?|sentence|setning)\s*:\s*",
    re.IGNORECASE,
)
_QUOTES = {'"': '"', "«": "»", "“": "”", "'": "'", "`": "`"}


def clean(reply: str) -> str:
    """The rewritten sentence alone: no thinking, tags, label, quotes or explanation."""
    text = _TAGS.sub("", _THINK.sub("", reply)).strip()
    text = text.split("\n", 1)[0].strip()  # a sentence has no line break (docs/spec.md §3)
    text = _LABEL.sub("", text).strip()
    if len(text) >= 2 and _QUOTES.get(text[0]) == text[-1]:
        text = text[1:-1].strip()
    return text


def language_of(text: str) -> str | None:
    """ "nb", "en", or None when the words don't tell."""
    words = re.findall(r"\w+", text.casefold())
    if any(ch in "æøå" for ch in text.casefold()):
        return "nb"
    norwegian = sum(w in _NORWEGIAN_WORDS for w in words)
    english = sum(w in _ENGLISH_WORDS for w in words)
    if norwegian == english:
        return None
    return "nb" if norwegian > english else "en"


def _quoted(values: list[str]) -> str:
    return ", ".join(f'"{value}"' for value in values)


def _contains(text: str, value: str) -> bool:
    """The value as a whole word or phrase, in any case."""
    return re.search(rf"(?<!\w){re.escape(value)}(?!\w)", text, re.IGNORECASE) is not None


def _same_word(a: str, b: str) -> bool:
    a, b = a.casefold(), b.casefold()
    common = 0
    for x, y in zip(a, b, strict=False):
        if x != y:
            break
        common += 1
    return a == b or common >= SAME_WORD_PREFIX


def _utf16_slice(text: str, finding: Finding) -> str:
    """The text of a Finding from service.detect, whose positions are UTF-16 units."""
    data = text.encode("utf-16-le")
    return data[2 * finding.start : 2 * finding.end].decode("utf-16-le")
