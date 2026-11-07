from ghost_engine.sentences import split_sentences


def sentences(text: str) -> list[str]:
    return [text[start:end] for start, end in split_sentences(text)]


def test_splits_after_full_stop_question_and_exclamation_mark() -> None:
    text = "Hei! Kan du hjelpe? Kari har diabetes."

    assert sentences(text) == ["Hei!", "Kan du hjelpe?", "Kari har diabetes."]


def test_line_break_ends_a_sentence() -> None:
    assert sentences("Pasient: Kari\nDiagnose: diabetes") == ["Pasient: Kari", "Diagnose: diabetes"]


def test_spans_point_into_the_original_text_without_surrounding_whitespace() -> None:
    assert split_sentences("  Hei.   Ja ") == [(2, 6), (9, 11)]


def test_empty_text_has_no_sentences() -> None:
    assert split_sentences(" \n ") == []


def test_abbreviations_do_not_end_a_sentence() -> None:
    text = "Hun bruker f.eks. insulin, dvs. hver dag. Ring dr. Hansen kl. 14. Takk."

    assert sentences(text) == [
        "Hun bruker f.eks. insulin, dvs. hver dag.",
        "Ring dr. Hansen kl. 14.",
        "Takk.",
    ]


def test_english_abbreviations_do_not_end_a_sentence() -> None:
    assert sentences("Ask Dr. Smith, e.g. tomorrow. Done.") == [
        "Ask Dr. Smith, e.g. tomorrow.",
        "Done.",
    ]


def test_ordinal_dates_do_not_end_a_sentence() -> None:
    assert sentences("Innlagt 1. januar og utskrevet 3. mars. Nå hjemme.") == [
        "Innlagt 1. januar og utskrevet 3. mars.",
        "Nå hjemme.",
    ]


def test_decimal_numbers_stay_in_one_sentence() -> None:
    assert sentences("Blodsukker 7.5 i dag. Bra.") == ["Blodsukker 7.5 i dag.", "Bra."]
