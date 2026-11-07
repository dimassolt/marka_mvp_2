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
