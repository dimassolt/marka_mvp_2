from pathlib import Path
from typing import Any

import pytest

from ghost_engine.detectors.gliner import (
    GlinerDetector,
    ModelMissingError,
    gliner_detector,
    load_model,
)


class FakeGliner:
    """Answers like fast_gliner: every listed entity found in the input, with
    UTF-8 byte offsets (the real model counts bytes, not characters)."""

    def __init__(self, *entities: tuple[str, str, float]) -> None:
        self.entities = entities
        self.inputs: list[str] = []

    def predict_entities(self, input_text: str, labels: list[str]) -> list[dict[str, Any]]:
        self.inputs.append(input_text)
        data = input_text.encode()
        found: list[dict[str, Any]] = []
        for text, label, score in self.entities:
            needle = text.encode()
            at = data.find(needle)
            while label in labels and at != -1:
                found.append(
                    {
                        "text": text,
                        "label": label,
                        "score": score,
                        "start": at,
                        "end": at + len(needle),
                    }
                )
                at = data.find(needle, at + 1)
        return found


def found(detector: GlinerDetector, text: str) -> list[tuple[str, str]]:
    return [(text[f.start : f.end], f.category) for f in detector.detect(text)]


def test_place_after_norwegian_letters_gets_character_positions() -> None:
    # The model counts UTF-8 bytes; "å" and "æ" before Bærum shift bytes but not characters.
    model = FakeGliner(("Bærum", "location", 0.99))
    detector = GlinerDetector(lambda: model)

    assert found(detector, "Kari, 34 år, jobber som lærer i Bærum.") == [("Bærum", "location")]


def test_person_organisation_and_place_map_to_categories() -> None:
    # A person is a person_name, so Hide gives it the PERSON Placeholder.
    model = FakeGliner(
        ("Ole Hansen", "person", 0.99),
        ("Statnett", "organization", 0.97),
        ("Trondheim", "location", 0.98),
    )
    detector = GlinerDetector(lambda: model)

    assert found(detector, "Ole Hansen jobber i Statnett i Trondheim.") == [
        ("Ole Hansen", "person_name"),
        ("Statnett", "organization"),
        ("Trondheim", "location"),
    ]


def test_model_loads_on_first_detect_and_only_once() -> None:
    loads: list[FakeGliner] = []

    def load() -> FakeGliner:
        loads.append(FakeGliner())
        return loads[-1]

    detector = GlinerDetector(load)
    assert loads == []

    detector.detect("Første tekst.")
    detector.detect("Andre tekst.")

    assert len(loads) == 1
    assert loads[0].inputs == ["Første tekst.", "Andre tekst."]


def test_entities_below_the_score_threshold_are_dropped() -> None:
    # The model tags "Kari har diabetes" as an organisation at 0.76; kept, it would beat
    # both the name and the health word under the overlap rule.
    model = FakeGliner(("Kari har diabetes", "organization", 0.79), ("Bærum", "location", 0.8))
    detector = GlinerDetector(lambda: model)

    assert found(detector, "Kari har diabetes og bor i Bærum.") == [("Bærum", "location")]


def test_pronouns_and_lowercase_words_are_not_entities() -> None:
    # Real model output on the demo note: "Hun" as a person at 0.86.
    model = FakeGliner(("Hun", "person", 0.86), ("henne", "person", 0.9), ("Kari", "person", 0.97))
    detector = GlinerDetector(lambda: model)

    assert found(detector, "Hun ringte henne. Kari svarte.") == [("Kari", "person_name")]


def test_long_text_is_sent_in_sentence_chunks_with_positions_in_the_whole_text() -> None:
    # GLiNER reads at most 384 words, so long text goes in chunks of whole sentences.
    model = FakeGliner(("Kari", "person", 0.97), ("Bærum", "location", 0.99))
    detector = GlinerDetector(lambda: model, max_chars=30)
    text = "Kari bor i Oslo nå. Hun flytter snart til Bærum."

    assert found(detector, text) == [("Kari", "person_name"), ("Bærum", "location")]
    assert model.inputs == ["Kari bor i Oslo nå.", "Hun flytter snart til Bærum."]


def test_without_the_model_the_detector_finds_nothing_instead_of_failing() -> None:
    # The other Detectors still run; the popup offers to download the model.
    def missing() -> FakeGliner:
        raise ModelMissingError("not downloaded")

    assert found(GlinerDetector(missing), "Kari bor i Bærum.") == []


def test_the_model_loads_once_it_has_been_downloaded() -> None:
    model = FakeGliner(("Kari", "person", 0.97))
    downloaded = False

    def load() -> FakeGliner:
        if not downloaded:
            raise ModelMissingError("not downloaded")
        return model

    detector = GlinerDetector(load)
    assert found(detector, "Kari svarte.") == []
    downloaded = True
    assert found(detector, "Kari svarte.") == [("Kari", "person_name")]


def test_missing_model_says_how_to_fetch_it(tmp_path: Path) -> None:
    # The Engine never downloads at runtime (ADR-0001); the install script does.
    with pytest.raises(ModelMissingError, match=r"fetch_gliner\.py"):
        load_model(tmp_path)


# real model ---------------------------------------------------------------------


@pytest.mark.gliner
def test_real_model_finds_surname_and_place_in_demo_note(demo_note: str) -> None:
    # docs/spec.md §5: Nordmann (surname) and Bærum (place) need the GLiNER Detector.
    findings = found(gliner_detector(), demo_note)

    assert ("Kari Nordmann", "person_name") in findings
    assert ("Bærum", "location") in findings
    assert ("Hun", "person_name") not in findings
