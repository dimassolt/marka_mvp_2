import pytest

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
