"""Checksums used to confirm regex candidates."""

_FNR_K1_WEIGHTS = (3, 7, 6, 1, 8, 9, 4, 5, 2)
_MOD11_WEIGHTS = (5, 4, 3, 2, 7, 6, 5, 4, 3, 2)


def _mod11_check_digit(digits: str, weights: tuple[int, ...]) -> int | None:
    total = sum(int(d) * w for d, w in zip(digits, weights, strict=True))
    check = 11 - total % 11
    if check == 11:
        return 0
    if check == 10:
        return None
    return check


def fodselsnummer_valid(digits: str) -> bool:
    """Both mod-11 control digits of an 11-digit fødselsnummer or d-nummer."""
    if len(digits) != 11 or not digits.isdigit():
        return False
    k1 = _mod11_check_digit(digits[:9], _FNR_K1_WEIGHTS)
    k2 = _mod11_check_digit(digits[:10], _MOD11_WEIGHTS)
    return k1 == int(digits[9]) and k2 == int(digits[10])


def bank_account_valid(digits: str) -> bool:
    """Mod-11 control digit of an 11-digit Norwegian account number."""
    if len(digits) != 11 or not digits.isdigit():
        return False
    return _mod11_check_digit(digits[:10], _MOD11_WEIGHTS) == int(digits[10])


def luhn_valid(digits: str) -> bool:
    """Luhn checksum, used by payment cards."""
    if not digits.isdigit():
        return False
    total = 0
    for i, ch in enumerate(reversed(digits)):
        d = int(ch)
        if i % 2 == 1:
            d = d * 2 - 9 if d > 4 else d * 2
        total += d
    return total % 10 == 0


def iban_valid(iban: str) -> bool:
    """IBAN mod-97: move the first four characters to the end, letters become 10–35."""
    compact = iban.replace(" ", "").upper()
    if len(compact) < 15 or len(compact) > 34 or not compact.isalnum():
        return False
    rearranged = compact[4:] + compact[:4]
    number = "".join(str(int(ch, 36)) for ch in rearranged)
    return int(number) % 97 == 1
