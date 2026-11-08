"""HTTP adapter (docs/spec.md §2). Request and response bodies are never logged (ADR-0001)."""

from typing import Annotated, Literal

from fastapi import Depends, FastAPI, Header, HTTPException
from pydantic import BaseModel

from ghost_engine import service
from ghost_engine.findings import category_info
from ghost_engine.model_download import ModelDownload, State, gliner_download
from ghost_engine.rephrase import (
    RephraseFailedError,
    RephraseInputError,
    RephraseModelFailedError,
    RephraseModelMissingError,
    Rephraser,
)
from ghost_engine.rephrase import (
    State as RephraseState,
)
from ghost_engine.rephrase_model import rephrase_download as default_rephrase_download
from ghost_engine.rephrase_model import rephraser as default_rephraser

app = FastAPI(title="Ghost Agent Engine")


class DetectRequest(BaseModel):
    text: str
    domain: str = service.DEFAULT_DOMAIN
    words: list[str] = []


class FindingOut(BaseModel):
    start: int
    end: int
    category: str
    confidence: float
    prefix: str
    name: str
    group: str


class DetectResponse(BaseModel):
    findings: list[FindingOut]


@app.get("/health")
def health() -> dict[str, str]:
    # No models yet. Once GLiNER and Qwen exist, return 503 until they are loaded.
    return {"status": "ok"}


@app.post("/detect")
def detect(request: DetectRequest) -> DetectResponse:
    try:
        findings = service.detect(request.text, request.domain, request.words)
    except service.UnknownDomainError as error:
        raise HTTPException(status_code=422, detail=f"unknown domain: {error}") from None
    return DetectResponse(
        findings=[
            FindingOut(
                start=f.start,
                end=f.end,
                category=f.category,
                confidence=f.confidence,
                **category_info(f.category),
            )
            for f in findings
        ]
    )


# GLiNER model download (ADR-0004) -------------------------------------------------------

# Origins that may start the download: the Extension's own pages. A request with no Origin
# comes from a local tool such as curl. Web pages can't, so a site can't start 600 MB.
EXTENSION_ORIGINS = ("chrome-extension://", "moz-extension://")


class ModelOut(BaseModel):
    state: State
    downloaded_mb: int
    error: str | None


def model_download() -> ModelDownload:
    return gliner_download()


ModelDep = Annotated[ModelDownload, Depends(model_download)]


@app.get("/model")
def model_status(model: ModelDep) -> ModelOut:
    status = model.status()
    return ModelOut(state=status.state, downloaded_mb=status.downloaded_mb, error=status.error)


@app.post("/model/download", status_code=202)
def start_model_download(
    model: ModelDep, origin: Annotated[str | None, Header()] = None
) -> ModelOut:
    if origin is not None and not origin.startswith(EXTENSION_ORIGINS):
        raise HTTPException(status_code=403, detail="only the Extension can start the download")
    status = model.start()
    return ModelOut(state=status.state, downloaded_mb=status.downloaded_mb, error=status.error)


# Rephrase (docs/spec.md §2) -------------------------------------------------------------


class RephraseRequest(BaseModel):
    sentence: str
    domain: str = service.DEFAULT_DOMAIN
    words: list[str] = []


class RephraseResponse(BaseModel):
    text: str


def rephraser() -> Rephraser:
    return default_rephraser()


RephraserDep = Annotated[Rephraser, Depends(rephraser)]


@app.post("/rephrase")
def rephrase(request: RephraseRequest, rephraser: RephraserDep) -> RephraseResponse:
    try:
        text = rephraser.rephrase(request.sentence, request.domain, request.words)
    except (RephraseInputError, service.UnknownDomainError) as error:
        raise HTTPException(status_code=422, detail=str(error)) from None
    except RephraseModelMissingError:
        raise HTTPException(status_code=503, detail="rephrase model missing") from None
    except RephraseModelFailedError:
        raise HTTPException(status_code=503, detail="rephrase model failed to load") from None
    except RephraseFailedError:
        # Every attempt still revealed something. The Card suggests Hide instead.
        raise HTTPException(status_code=409, detail="could not rephrase safely") from None
    return RephraseResponse(text=text)


RephraseModelState = RephraseState | Literal["downloading"]


class RephraseModelOut(BaseModel):
    state: RephraseModelState
    downloaded_mb: int
    error: str | None


def rephrase_download() -> ModelDownload:
    return default_rephrase_download()


RephraseDownloadDep = Annotated[ModelDownload, Depends(rephrase_download)]


def _rephrase_model_out(rephraser: Rephraser, download: ModelDownload) -> RephraseModelOut:
    """The download's state while it runs or after it failed, else the model's."""
    fetched = download.status()
    if fetched.state == "downloading":
        return RephraseModelOut(
            state="downloading", downloaded_mb=fetched.downloaded_mb, error=None
        )
    loaded = rephraser.status()
    if loaded.state == "missing":
        if fetched.state == "ready":  # downloaded since the last load attempt; loads next
            return RephraseModelOut(state="idle", downloaded_mb=0, error=None)
        return RephraseModelOut(state="missing", downloaded_mb=0, error=fetched.error)
    return RephraseModelOut(state=loaded.state, downloaded_mb=0, error=loaded.error)


@app.get("/rephrase/model")
def rephrase_model_status(
    rephraser: RephraserDep, download: RephraseDownloadDep
) -> RephraseModelOut:
    return _rephrase_model_out(rephraser, download)


@app.post("/rephrase/model/download", status_code=202)
def start_rephrase_model_download(
    rephraser: RephraserDep,
    download: RephraseDownloadDep,
    origin: Annotated[str | None, Header()] = None,
) -> RephraseModelOut:
    if origin is not None and not origin.startswith(EXTENSION_ORIGINS):
        raise HTTPException(status_code=403, detail="only the Extension can start the download")
    download.start()
    return _rephrase_model_out(rephraser, download)
