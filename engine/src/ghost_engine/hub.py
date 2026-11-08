"""Model downloads from Hugging Face, shared by GLiNER and the rephrase model."""


def plain_http() -> None:
    """Download over plain HTTP, not Xet. Xet writes a model in blocks of about 67 MB, so the
    file on disk, and the popup's progress bar, stood still for over a minute and then jumped.
    Plain HTTP writes it steadily, and was faster on a 600 MB GLiNER download (99 s vs 152 s).
    huggingface_hub reads the flag at each download, so setting it here is enough."""
    from huggingface_hub import constants

    constants.HF_HUB_DISABLE_XET = True
