import pytest

from ghost_engine.detectors.industrial import industrial_detector


def found(text: str) -> list[str]:
    findings = industrial_detector().detect(text)
    assert all(f.category == "industrial" for f in findings)
    return [text[f.start : f.end] for f in findings]


def test_plant_note_finds_makers_line_and_capacity() -> None:
    text = "Produksjonslinje 2 har Fanuc-roboter og en Trumpf-laser. Kapasiteten er høy."
    assert found(text) == ["Produksjonslinje", "Fanuc", "Trumpf", "Kapasiteten"]


@pytest.mark.parametrize(
    "term",
    [
        "Siemens",
        "ABB",
        "KUKA",
        "Yaskawa",
        "DMG Mori",
        "Mazak",
        "Beckhoff",
        "Rockwell",
        "maskinpark",
        "maskinparken",
        "produksjonslinjen",
        "CNC-maskiner",
        "sveiserobot",
        "kantpresse",
        "syklustid",
        "skiftkapasitet",
        "OEE",
        "PLS",
        "SCADA",
        "resept",
        "serienummer",
        "fastvare",
    ],
)
def test_norwegian_industrial_terms_are_found(term: str) -> None:
    assert found(f"Anlegget har {term} nå.") == [term]


@pytest.mark.parametrize(
    "term",
    [
        "production line",
        "machine park",
        "cycle time",
        "throughput",
        "PLC",
        "firmware version",
        "serial number",
        "process recipe",
        "units per shift",
    ],
)
def test_english_industrial_terms_are_found(term: str) -> None:
    assert found(f"The plant has {term} today.") == [term]


@pytest.mark.parametrize(
    "text",
    [
        "Vi spiste lunsj i kantina.",
        "Maskinen min hjemme er en kaffetrakter.",
        "Han har en abbor i fryseren.",
        "Linjen var lang i butikken.",
        "Det er en presserende sak.",
    ],
)
def test_everyday_words_are_not_industrial_findings(text: str) -> None:
    assert found(text) == []
