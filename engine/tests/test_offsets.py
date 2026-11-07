from ghost_engine.offsets import Utf16Offsets


def test_emoji_shifts_positions_by_one_utf16_unit() -> None:
    # docs/spec.md §2: in "👋 01019000083" the fødselsnummer is at 3–14.
    text = "👋 01019000083"
    offsets = Utf16Offsets(text)

    assert (offsets.convert(2), offsets.convert(13)) == (3, 14)


def test_plain_text_positions_are_unchanged() -> None:
    offsets = Utf16Offsets("Kari har diabetes")

    assert [offsets.convert(i) for i in (0, 9, 17)] == [0, 9, 17]


def test_norwegian_letters_are_one_utf16_unit() -> None:
    offsets = Utf16Offsets("Bærum ø å")

    assert offsets.convert(9) == 9
