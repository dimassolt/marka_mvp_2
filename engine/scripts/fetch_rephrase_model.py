"""Download the pinned rephrase model into engine/models/ (Gemma 4 E2B, about 3.1 GB).

Run from engine/: uv run python scripts/fetch_rephrase_model.py
GHOST_REPHRASE_MODEL=gemma-4-e4b fetches the larger E4B instead (about 5 GB).
The install scripts run it. Rephrasing loads the model from disk only (ADR-0001).
A model already on disk is kept: a re-run doesn't reach the network.
"""

from ghost_engine.rephrase_model import download_model, model_path, model_spec


def main() -> None:
    spec = model_spec()
    path = model_path(spec)
    if path.is_file():
        print(f"{spec.file} already in {path.parent}")
        return
    print(f"{spec.repo}/{spec.file} -> {path.parent}")
    download_model(spec)


if __name__ == "__main__":
    main()
