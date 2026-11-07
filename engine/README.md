# Ghost Agent Engine

Local Python engine for Ghost Agent. It listens on `127.0.0.1:8765` only. See [docs/spec.md](../docs/spec.md) §2 for the API.

```sh
uv sync
uv run ghost-engine      # start the engine
uv run pytest            # tests
uv run ruff check . && uv run ruff format --check . && uv run mypy .
```
