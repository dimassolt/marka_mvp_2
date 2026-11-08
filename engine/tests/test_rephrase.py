"""Rephrase use case (docs/spec.md §2, POST /rephrase) with a scripted model and Detector."""

import logging
from collections.abc import Sequence

import pytest

from ghost_engine.findings import Finding
from ghost_engine.rephrase import (
    MAX_CHARS,
    Message,
    RephraseFailedError,
    RephraseInputError,
    RephraseModelFailedError,
    RephraseModelMissingError,
    Rephraser,
    RephraseStatus,
)
from ghost_engine.service import UnknownDomainError

SENTENCE = "Kari, 34 år, jobber som lærer i Bærum og har diabetes type 1."
CLEAN = "En kvinne i 30-årene som jobber i skolen, har en kronisk sykdom."


class ScriptedModel:
    """Answers with the given replies in turn and records every prompt."""

    def __init__(self, *replies: str) -> None:
        self.replies = list(replies)
        self.prompts: list[list[Message]] = []

    def chat(self, messages: list[Message], *, temperature: float, max_tokens: int) -> str:
        self.prompts.append(messages)
        return self.replies.pop(0)


def words_detector(*sensitive: str, categories: dict[str, str] | None = None):  # type: ignore[no-untyped-def]
    """A Detector stand-in: each listed word in the text is a Finding (Category "health"
    unless given), case-sensitive, in UTF-16 units."""

    def detect(text: str, domain: str, words: Sequence[str] = ()) -> list[Finding]:
        found = []
        for word in sensitive:
            start = text.find(word)
            if start >= 0:
                category = (categories or {}).get(word, "health")
                found.append(Finding(start, start + len(word), category, 0.8))
        return found

    return detect


def make(model: ScriptedModel, *sensitive: str, **categories: str) -> Rephraser:
    return Rephraser(lambda: model, detect=words_detector(*sensitive, categories=categories))


def last_user_message(model: ScriptedModel) -> str:
    return model.prompts[-1][-1]["content"]


def test_returns_the_rewritten_sentence() -> None:
    model = ScriptedModel(CLEAN)

    assert make(model, "diabetes", "Kari").rephrase(SENTENCE, "health") == CLEAN


def test_the_prompt_carries_the_sentence_and_the_domain_instruction() -> None:
    model = ScriptedModel(CLEAN)

    make(model).rephrase(SENTENCE, "health")

    system = model.prompts[0][0]
    assert system["role"] == "system"
    assert "diagnos" in system["content"].lower()
    assert SENTENCE in last_user_message(model)


def test_the_free_domain_has_no_domain_instruction() -> None:
    model = ScriptedModel(CLEAN)

    make(model).rephrase(SENTENCE, "free")

    assert "diagnos" not in model.prompts[0][0]["content"].lower()


@pytest.mark.parametrize(
    "reply",
    [
        f"<think></think>{CLEAN}",
        f"<think>\nTenker litt.\n</think>\n{CLEAN}",
        f'"{CLEAN}"',
        f"«{CLEAN}»",
        f"Omskrevet setning: {CLEAN}",
        f"Rewritten sentence: {CLEAN}",
        f"<sentence>{CLEAN}</sentence>",
        f"{CLEAN}\n\nJeg fjernet navnet og diagnosen.",
        f"  \n{CLEAN}  ",
    ],
)
def test_strips_everything_but_the_sentence(reply: str) -> None:
    assert make(ScriptedModel(reply)).rephrase(SENTENCE, "health") == CLEAN


def test_tries_again_when_the_rewrite_still_has_a_finding_and_names_it() -> None:
    model = ScriptedModel("En kvinne med diabetes jobber i skolen.", CLEAN)

    assert make(model, "diabetes").rephrase(SENTENCE, "health") == CLEAN
    assert len(model.prompts) == 2
    assert "diabetes" in last_user_message(model)


def test_the_first_prompt_names_what_ghost_found() -> None:
    model = ScriptedModel(CLEAN)

    make(model, "Kari", "diabetes").rephrase(SENTENCE, "health")

    assert '"Kari"' in last_user_message(model)
    assert '"diabetes"' in last_user_message(model)


def test_a_new_general_domain_word_is_allowed_when_no_try_avoids_it() -> None:
    # docs/spec.md §3: after Accept, new Findings are underlined as usual.
    model = ScriptedModel("En kvinne har en kronisk sykdom.", "En kvinne har en sykdom.")

    rewrite = make(model, "diabetes", "sykdom").rephrase("Kari har diabetes.", "health")

    assert rewrite == "En kvinne har en kronisk sykdom."


def test_a_rewrite_without_new_domain_words_is_preferred() -> None:
    model = ScriptedModel("En kvinne har en sykdom.", "En kvinne har en helseutfordring.")

    rewrite = make(model, "diabetes", "sykdom").rephrase("Kari har diabetes.", "health")

    assert rewrite == "En kvinne har en helseutfordring."
    assert '"sykdom"' in last_user_message(model)


def test_the_rewrite_with_fewest_new_domain_words_wins() -> None:
    model = ScriptedModel("Hun har en sykdom og medisiner.", "Hun har en sykdom.")

    rewrite = make(model, "diabetes", "sykdom", "medisiner").rephrase(
        "Kari har diabetes.", "health"
    )

    assert rewrite == "Hun har en sykdom."


def test_a_found_value_is_caught_in_any_case() -> None:
    model = ScriptedModel("En lærer fra bærum.", "En lærer fra Østlandet.")

    rewrite = make(model, "Bærum").rephrase("Kari er lærer i Bærum.", "health")

    assert rewrite == "En lærer fra Østlandet."


def test_another_form_of_a_found_word_is_caught() -> None:
    model = ScriptedModel("Hun har en sykemelding.", "Hun er borte fra jobb.")

    rewrite = make(model, "sykemeldt", "sykemelding").rephrase("Hun er sykemeldt.", "health")

    assert rewrite == "Hun er borte fra jobb."


def test_a_new_id_number_is_not_allowed() -> None:
    model = ScriptedModel("Kontakt 01019000083.", "Kontakt pasienten.")

    rewrite = make(model, "01019000083", **{"01019000083": "fodselsnummer"}).rephrase(
        "Kontakt Kari.", "health"
    )

    assert rewrite == "Kontakt pasienten."


def test_tries_again_when_a_placeholder_is_lost() -> None:
    sentence = "[PERSON_1], 34 år, har diabetes."
    model = ScriptedModel("En kvinne har en kronisk sykdom.", "[PERSON_1] har en kronisk sykdom.")

    assert make(model).rephrase(sentence, "health") == "[PERSON_1] har en kronisk sykdom."
    assert "[PERSON_1]" in last_user_message(model)


def test_an_invented_placeholder_is_not_accepted() -> None:
    model = ScriptedModel("[PERSON_1] har en sykdom.", "En kvinne har en sykdom.")

    assert make(model).rephrase("Kari har diabetes.", "health") == "En kvinne har en sykdom."


def test_refuses_when_every_attempt_still_leaks() -> None:
    model = ScriptedModel("Kari har diabetes.", "Kari er syk.")

    with pytest.raises(RephraseFailedError):
        make(model, "Kari").rephrase("Kari har diabetes.", "health")


def test_an_empty_answer_is_a_failed_attempt() -> None:
    model = ScriptedModel("", CLEAN)

    assert make(model).rephrase(SENTENCE, "health") == CLEAN


@pytest.mark.parametrize("sentence", ["", "   ", "x" * (MAX_CHARS + 1)])
def test_rejects_an_empty_or_too_long_sentence_before_loading_the_model(sentence: str) -> None:
    def load() -> ScriptedModel:
        raise AssertionError("must not load the model")

    with pytest.raises(RephraseInputError):
        Rephraser(load, detect=words_detector()).rephrase(sentence, "health")


def test_rejects_an_unknown_domain() -> None:
    with pytest.raises(UnknownDomainError):
        make(ScriptedModel(CLEAN)).rephrase(SENTENCE, "legal")


def test_a_missing_model_is_reported_and_tried_again_next_time() -> None:
    calls: list[int] = []

    def load() -> ScriptedModel:
        calls.append(1)
        if len(calls) == 1:
            raise RephraseModelMissingError("not downloaded")
        return ScriptedModel(CLEAN)

    rephraser = Rephraser(load, detect=words_detector())

    with pytest.raises(RephraseModelMissingError):
        rephraser.rephrase(SENTENCE, "health")
    assert rephraser.rephrase(SENTENCE, "health") == CLEAN


def test_the_model_is_loaded_once() -> None:
    loads: list[int] = []
    model = ScriptedModel(CLEAN, CLEAN)

    def load() -> ScriptedModel:
        loads.append(1)
        return model

    rephraser = Rephraser(load, detect=words_detector())
    rephraser.rephrase(SENTENCE, "health")
    rephraser.rephrase(SENTENCE, "health")

    assert loads == [1]


def test_a_norwegian_sentence_is_answered_in_norwegian() -> None:
    model = ScriptedModel(CLEAN)

    make(model).rephrase(SENTENCE, "health")

    assert "Answer in Norwegian" in last_user_message(model)


def test_an_english_sentence_is_answered_in_english() -> None:
    model = ScriptedModel("A patient was diagnosed with a health condition last week.")

    make(model).rephrase("My patient John Smith was diagnosed with diabetes last week.", "health")

    assert "Answer in English" in last_user_message(model)


def test_tries_again_when_the_answer_is_in_another_language() -> None:
    model = ScriptedModel("The patient is a woman in her thirties.", "Pasienten er en kvinne.")

    rewrite = make(model).rephrase("Pasienten heter Kari Nordmann og er 34 år.", "health")

    assert rewrite == "Pasienten er en kvinne."
    assert "Norwegian" in last_user_message(model)


def test_a_new_name_finding_does_not_ask_for_plainer_words() -> None:
    # GLiNER may tag "En kvinne" at the start of a sentence; another try can't fix that.
    model = ScriptedModel("En kvinne har en helseutfordring.")

    rewrite = make(model, "diabetes", "En kvinne", **{"En kvinne": "person_name"}).rephrase(
        "Kari har diabetes.", "health"
    )

    assert rewrite == "En kvinne har en helseutfordring."
    assert len(model.prompts) == 1


# The model's state, for GET /rephrase/model and the popup -------------------------------


def test_the_state_is_idle_before_the_model_is_loaded() -> None:
    assert make(ScriptedModel()).status().state == "idle"


def test_the_state_is_ready_once_the_model_is_loaded() -> None:
    rephraser = make(ScriptedModel())

    rephraser.warm()

    assert rephraser.status().state == "ready"


def test_the_state_is_missing_when_the_model_is_not_downloaded() -> None:
    def load() -> ScriptedModel:
        raise RephraseModelMissingError("not downloaded")

    rephraser = Rephraser(load, detect=words_detector())
    rephraser.warm()

    assert rephraser.status().state == "missing"


def test_the_state_is_failed_with_the_reason_when_loading_breaks() -> None:
    def load() -> ScriptedModel:
        raise RuntimeError("not a GGUF file")

    rephraser = Rephraser(load, detect=words_detector())
    rephraser.warm()

    assert rephraser.status() == RephraseStatus("failed", "not a GGUF file")
    with pytest.raises(RephraseModelFailedError):
        rephraser.rephrase(SENTENCE, "health")


def test_the_state_is_loading_while_the_model_loads() -> None:
    states: list[str] = []
    rephraser: Rephraser

    def load() -> ScriptedModel:
        states.append(rephraser.status().state)
        return ScriptedModel()

    rephraser = Rephraser(load, detect=words_detector())
    rephraser.warm()

    assert states == ["loading"]


def test_warm_says_in_the_log_when_the_model_is_ready(caplog: pytest.LogCaptureFixture) -> None:
    caplog.set_level(logging.INFO, logger="uvicorn.error")

    make(ScriptedModel()).warm()

    assert "Rephrase model ready" in caplog.text
