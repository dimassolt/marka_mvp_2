import pytest

from ghost_engine.detectors.base_regex import BaseRegexDetector
from ghost_engine.findings import Finding


def found(text: str) -> list[tuple[str, str]]:
    """(category, matched text) pairs, in order."""
    findings = BaseRegexDetector().detect(text)
    return [(f.category, text[f.start : f.end]) for f in findings]


# fodselsnummer and d_nummer --------------------------------------------------


def test_valid_fodselsnummer_is_found_with_position() -> None:
    findings = BaseRegexDetector().detect("fnr 01019000083")

    assert findings == [Finding(start=4, end=15, category="fodselsnummer", confidence=0.99)]


def test_fodselsnummer_with_space_after_birth_date_is_found() -> None:
    assert found("fnr 010190 00083.") == [("fodselsnummer", "010190 00083")]


def test_fodselsnummer_with_failed_checksum_is_not_found() -> None:
    # docs/spec.md §4 check 10
    assert found("ordrenummer 01019000084") == []


def test_d_nummer_starts_with_4_to_7() -> None:
    assert found("d-nr 41019000077") == [("d_nummer", "41019000077")]


@pytest.mark.parametrize("text", ["101019000083", "x01019000083", "0101900008"])
def test_fodselsnummer_must_stand_alone(text: str) -> None:
    assert ("fodselsnummer", "01019000083") not in found(text)


# bank_account ------------------------------------------------------------------


@pytest.mark.parametrize("account", ["86011117947", "8601.11.17947", "8601 11 17947"])
def test_bank_account_with_valid_checksum_is_found(account: str) -> None:
    assert found(f"konto {account}") == [("bank_account", account)]


def test_bank_account_with_failed_checksum_is_not_found() -> None:
    assert found("konto 8601.11.17948") == []


def test_bank_account_with_mixed_separators_is_not_found() -> None:
    assert found("konto 8601.11 17947") == []


# payment_card ------------------------------------------------------------------


@pytest.mark.parametrize(
    "card", ["4111111111111111", "4111 1111 1111 1111", "4111-1111-1111-1111", "378282246310005"]
)
def test_payment_card_with_valid_luhn_is_found(card: str) -> None:
    assert found(f"kort {card}, takk") == [("payment_card", card)]


def test_payment_card_with_failed_luhn_is_not_found() -> None:
    assert found("kort 4111 1111 1111 1112") == []


def test_twelve_digits_are_too_short_for_a_card() -> None:
    assert found("ref 4111 1111 1119") == []


# iban --------------------------------------------------------------------------


@pytest.mark.parametrize(
    "iban",
    [
        "NO9386011117947",
        "NO93 8601 1117 947",
        "GB82WEST12345698765432",
        "GB82 WEST 1234 5698 7654 32",
    ],
)
def test_iban_with_valid_mod97_is_found(iban: str) -> None:
    assert found(f"IBAN: {iban}.") == [("iban", iban)]


def test_iban_with_failed_mod97_is_not_found() -> None:
    assert found("IBAN NO9386011117948") == []


def test_iban_does_not_swallow_a_following_capitalised_word() -> None:
    assert found("NO93 8601 1117 947 OK") == [("iban", "NO93 8601 1117 947")]


# secret ------------------------------------------------------------------------
# Fake tokens are built at runtime so gitleaks in CI doesn't flag this file.

_OPENAI_KEY = "sk-" + "proj-" + "a1B2c3D4" * 4
_GITHUB_TOKEN = "ghp_" + "Z9y8X7w6" * 4 + "abcd"
_AWS_KEY_ID = "AKIA" + "IOSFODNN7" + "TESTKEY"[:7]
_JWT = ".".join(["eyJhbGciOiJIUzI1NiJ9", "eyJzdWIiOiIxMjM0NSJ9", "c2lnbmF0dXJlLXRlc3Q"])


@pytest.mark.parametrize("token", [_OPENAI_KEY, _GITHUB_TOKEN, _AWS_KEY_ID, _JWT])
def test_secret_token_is_found(token: str) -> None:
    assert found(f"bruk denne: {token} ok") == [("secret", token)]


@pytest.mark.parametrize("text", ["sk-ole er gøy", "risk-free", "AKIA alone", "eyJ.only"])
def test_secret_lookalikes_are_not_found(text: str) -> None:
    assert found(text) == []


# password ----------------------------------------------------------------------


@pytest.mark.parametrize(
    ("text", "value"),
    [
        ("password: Hunter2!x", "Hunter2!x"),
        ("Passord:sommer2026", "sommer2026"),
        ("login pwd: q9#Lm", "q9#Lm"),
        ("PW: abc123", "abc123"),
    ],
)
def test_password_value_after_label_is_found_without_the_label(text: str, value: str) -> None:
    assert found(text) == [("password", value)]


def test_password_drops_sentence_punctuation_at_the_end() -> None:
    assert found("Mitt passord: sommer2026. Takk") == [("password", "sommer2026")]


@pytest.mark.parametrize("text", ["glemt passordet mitt", "passord: ", "snowpw: x"])
def test_password_without_a_labelled_value_is_not_found(text: str) -> None:
    assert found(text) == []


# email -------------------------------------------------------------------------


@pytest.mark.parametrize(
    "email", ["kari.nordmann@example.com", "ola+ai@sykehus.helse.no", "a_b-c@ex-ample.co.uk"]
)
def test_email_is_found_without_trailing_full_stop(email: str) -> None:
    assert found(f"send til {email}.") == [("email", email)]


@pytest.mark.parametrize("text", ["@kari på X", "kari@localhost", "skriv kari @ example.com"])
def test_email_lookalikes_are_not_found(text: str) -> None:
    assert found(text) == []


# phone -------------------------------------------------------------------------


@pytest.mark.parametrize(
    "phone",
    [
        "+47 912 34 567",
        "+4791234567",
        "0047 91234567",
        "91234567",
        "912 34 567",
        "22 22 22 22",
        "+44 20 7946 0958",
        "+1-202-555-0143",
    ],
)
def test_phone_number_is_found(phone: str) -> None:
    assert found(f"Ring {phone} i dag") == [("phone", phone)]


@pytest.mark.parametrize(
    "text",
    [
        "kode 12345678",  # Norwegian numbers don't start with 0 or 1
        "kari er 34 år",
        "kort 4111 1111 1111 1112",  # failed card, not a phone inside it
        "id 912345678",  # 9 digits
        "+47 9123",
    ],
)
def test_phone_lookalikes_are_not_found(text: str) -> None:
    assert found(text) == []


# context words -----------------------------------------------------------------
# 01019000083 passes both the fødselsnummer and the account checksum.


@pytest.mark.parametrize(
    "text",
    ["kontonummer 01019000083", "Bankkonto: 01019000083", "my account number is 01019000083"],
)
def test_account_context_makes_an_ambiguous_number_a_bank_account(text: str) -> None:
    assert found(text) == [("bank_account", "01019000083")]


def test_ambiguous_number_without_context_is_a_fodselsnummer_with_lower_confidence() -> None:
    [finding] = BaseRegexDetector().detect("01019000083")

    assert (finding.category, finding.confidence) == ("fodselsnummer", 0.92)


def test_fodselsnummer_context_wins_when_both_contexts_are_near() -> None:
    assert found("konto og fødselsnummer: 01019000083") == [("fodselsnummer", "01019000083")]


def test_context_word_far_before_the_number_is_ignored() -> None:
    text = "Kontonummer kommer senere. Her er bare et tall fra skjemaet: 01019000083"

    assert found(text) == [("fodselsnummer", "01019000083")]


def test_context_word_must_be_a_whole_word() -> None:
    assert found("ved kontoret 01019000083") == [("fodselsnummer", "01019000083")]
