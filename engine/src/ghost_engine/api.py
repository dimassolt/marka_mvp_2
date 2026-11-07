"""HTTP adapter (docs/spec.md §2). Request and response bodies are never logged (ADR-0001)."""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from ghost_engine import service

app = FastAPI(title="Ghost Agent Engine")


class DetectRequest(BaseModel):
    text: str
    domain: str


class FindingOut(BaseModel):
    start: int
    end: int
    category: str
    confidence: float


class DetectResponse(BaseModel):
    findings: list[FindingOut]


@app.get("/health")
def health() -> dict[str, str]:
    # No models yet. Once GLiNER and Qwen exist, return 503 until they are loaded.
    return {"status": "ok"}


@app.post("/detect")
def detect(request: DetectRequest) -> DetectResponse:
    try:
        findings = service.detect(request.text, request.domain)
    except service.UnknownDomainError as error:
        raise HTTPException(status_code=422, detail=f"unknown domain: {error}") from None
    return DetectResponse(
        findings=[
            FindingOut(start=f.start, end=f.end, category=f.category, confidence=f.confidence)
            for f in findings
        ]
    )
