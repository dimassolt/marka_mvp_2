# Ghost Agent Engine

Local Python engine for Ghost Agent. It listens on `127.0.0.1:8765` only. See [docs/spec.md](../docs/spec.md) §2 for the API.

```sh
uv sync
uv run python scripts/fetch_gliner.py   # once: the GLiNER model, about 600 MB
uv run ghost-engine      # start the engine
uv run pytest            # tests
uv run ruff check . && uv run ruff format --check . && uv run mypy .
```

## Domains

`POST /detect` takes an optional `domain`. `free` is the default and runs the Base Detectors only. `health` adds the Health keyword list. Add a Domain in `DOMAIN_DETECTORS` in `service.py`.

## Detectors

- `detectors/base_regex.py`: Base Categories with a fixed shape (fødselsnummer, d-nummer, bank account, payment card, IBAN, secret, password, email, phone). Checksums are in `detectors/checksums.py`. A plain 11-digit number can pass both the fødselsnummer and the account checksum; words like "konto" or "fnr" in the 40 characters before it decide which.
- `detectors/first_names.py`: `person_name`, a capitalised word on `data/first_names.txt` (SSB table 10501, refresh with `uv run python scripts/fetch_first_names.py`). Names that are everyday words go in `data/first_names_ambiguous.txt` (skipped at sentence start) or `data/first_names_never.txt` (always skipped).
- `detectors/health.py`: the Health Domain, from `data/health_keywords.txt` (Bokmål and English). The file header explains the `word*`, `*word` and phrase syntax. Add a word there and run `uv run pytest` to check it doesn't catch the demo note. Every Domain list (`health`, `education`, `courts`, `industrial`, `religious`) has at least 150 Bokmål and 150 English entries under `## Bokmål:` and `## English:` headers; vendor names and codes go under `## Shared:` and don't count.
- `detectors/gliner.py`: `person_name`, `organization` and `location` from the GLiNER model `onnx-community/gliner_multi-v2.1` (fp16 ONNX, run by fast_gliner). It keeps entities scoring 0.8 or more that contain a capital letter and aren't a pronoun. The model loads from `models/` on the first `/detect` call, once, and uses about 1.2–1.4 GB of RAM. `scripts/fetch_gliner.py` downloads it at a pinned revision; the Engine never downloads anything itself. Tests marked `gliner` use the real model.
- `sentences.py`: regex sentence splitter (knows "f.eks.", "dr.", "1. januar") and `chunk_spans` to cut long text into sentence-aligned chunks for GLiNER.
