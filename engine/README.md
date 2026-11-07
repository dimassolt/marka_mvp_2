# Ghost Agent Engine

Local Python engine for Ghost Agent. It listens on `127.0.0.1:8765` only. See [docs/spec.md](../docs/spec.md) §2 for the API.

```sh
uv sync
uv run ghost-engine      # start the engine
uv run pytest            # tests
uv run ruff check . && uv run ruff format --check . && uv run mypy .
```

## Detectors

- `detectors/base_regex.py`: Base Categories with a fixed shape (fødselsnummer, d-nummer, bank account, payment card, IBAN, secret, password, email, phone). Checksums are in `detectors/checksums.py`. A plain 11-digit number can pass both the fødselsnummer and the account checksum; words like "konto" or "fnr" in the 40 characters before it decide which.
- `detectors/first_names.py`: `person_name`, a capitalised word on `data/first_names.txt` (SSB table 10501, refresh with `uv run python scripts/fetch_first_names.py`). Names that are everyday words go in `data/first_names_ambiguous.txt` (skipped at sentence start) or `data/first_names_never.txt` (always skipped).
- `detectors/health.py`: the Health Domain, from `data/health_keywords.txt` (Bokmål and English). The file header explains the `word*`, `*word` and phrase syntax. Add a word there and run `uv run pytest` to check it doesn't catch the demo note.
- `sentences.py`: regex sentence splitter (knows "f.eks.", "dr.", "1. januar") and `chunk_spans` to cut long text into sentence-aligned chunks for GLiNER.
