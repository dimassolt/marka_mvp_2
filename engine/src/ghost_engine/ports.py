"""Ports of the hexagonal Engine core (ADR-0002)."""

from typing import Protocol

from ghost_engine.findings import Finding


class Detector(Protocol):
    """Reads text and produces Findings, with Python string indices."""

    def detect(self, text: str) -> list[Finding]: ...


class ChatModel(Protocol):
    """A local instruction-tuned language model (the Rephraser's port, ADR-0002)."""

    def chat(
        self, messages: list[dict[str, str]], *, temperature: float, max_tokens: int
    ) -> str: ...
