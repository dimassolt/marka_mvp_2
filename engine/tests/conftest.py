import pytest

from ghost_engine.detectors.gliner import MODEL_FILE, model_dir

# docs/spec.md §5
DEMO_NOTE = (
    "Hei! Kan du hjelpe meg å skrive et henvisningsbrev? Pasienten heter Kari Nordmann, "
    "fnr 01019000083. Kari, 34 år, jobber som lærer i Bærum og har diabetes type 1. "
    "Hun er sykemeldt og bruker insulin. Ring henne på +47 912 34 567 eller send e-post "
    "til kari.nordmann@example.com."
)


@pytest.fixture
def demo_note() -> str:
    return DEMO_NOTE


def pytest_collection_modifyitems(items: list[pytest.Item]) -> None:
    """Tests marked gliner need the real model. Without it they are skipped, not failed:
    the Engine runs without models (docs/spec.md §3, Models)."""
    if (model_dir() / MODEL_FILE).is_file():
        return
    skip = pytest.mark.skip(reason="GLiNER model not downloaded (scripts/fetch_gliner.py)")
    for item in items:
        if "gliner" in item.keywords:
            item.add_marker(skip)
