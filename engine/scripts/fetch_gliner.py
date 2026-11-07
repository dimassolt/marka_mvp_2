"""Download the pinned GLiNER model into engine/models/ (about 600 MB).

Run from engine/: uv run python scripts/fetch_gliner.py
Like fetch_first_names.py, it only runs by hand. The Engine loads the model from
disk and never uses the network itself (ADR-0001).
"""

from huggingface_hub import snapshot_download

from ghost_engine.detectors.gliner import MODEL_FILES, MODEL_ID, MODEL_REVISION, model_dir


def main() -> None:
    path = model_dir()
    snapshot_download(MODEL_ID, revision=MODEL_REVISION, allow_patterns=MODEL_FILES, local_dir=path)
    print(f"{MODEL_ID} -> {path}")


if __name__ == "__main__":
    main()
