"""Ports of the hexagonal Engine core (ADR-0002)."""

from typing import Protocol

from ghost_engine.findings import Finding


class Detector(Protocol):
    """Reads text and produces Findings, with Python string indices."""

    def detect(self, text: str) -> list[Finding]: ...
