from ghost_engine.findings import Finding, category_info, resolve_overlaps


def test_longer_finding_wins_when_findings_overlap() -> None:
    short = Finding(start=0, end=4, category="person_name", confidence=0.9)
    long = Finding(start=0, end=10, category="health", confidence=0.5)

    assert resolve_overlaps([short, long]) == [long]


def test_higher_confidence_wins_for_equal_length() -> None:
    account = Finding(start=5, end=16, category="bank_account", confidence=0.9)
    fnr = Finding(start=5, end=16, category="fodselsnummer", confidence=0.99)

    assert resolve_overlaps([account, fnr]) == [fnr]


def test_result_is_sorted_by_start_and_keeps_disjoint_findings() -> None:
    late = Finding(start=20, end=25, category="email", confidence=0.9)
    early = Finding(start=0, end=4, category="health", confidence=0.8)

    assert resolve_overlaps([late, early]) == [early, late]


def test_touching_findings_do_not_overlap() -> None:
    a = Finding(start=0, end=4, category="health", confidence=0.8)
    b = Finding(start=4, end=8, category="health", confidence=0.8)

    assert resolve_overlaps([b, a]) == [a, b]


def test_a_category_missing_from_the_table_hides_as_data() -> None:
    # docs/spec.md §1: an unknown Category is teal and hides as DATA.
    assert category_info("something_new") == {
        "prefix": "DATA",
        "name": "Sensitive data",
        "group": "domain",
    }
