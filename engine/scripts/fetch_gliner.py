"""Download the pinned GLiNER model into engine/models/ (about 600 MB).

Run from engine/: uv run python scripts/fetch_gliner.py
The install scripts run it. The popup's Download model button does the same through
POST /model/download (ADR-0004). Detection loads the model from disk only (ADR-0001).
A model already on disk is kept: a re-run doesn't reach the network.
"""

from ghost_engine.detectors.gliner import MODEL_FILE, MODEL_ID, download_model, model_dir


def main() -> None:
    path = model_dir()
    if (path / MODEL_FILE).is_file():
        print(f"{MODEL_ID} already in {path}")
        return
    download_model(path)
    print(f"{MODEL_ID} -> {path}")


if __name__ == "__main__":
    main()
