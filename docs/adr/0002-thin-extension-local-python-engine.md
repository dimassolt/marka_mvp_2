# Thin browser extension over a local Python engine

The detection and rephrasing models we picked (GLiNER through fast_gliner, Qwen3 through llama-cpp-python) are Python, and a browser extension cannot run Python. So the extension only draws highlights and action cards. It calls a Python engine running on the user's machine over localhost HTTP. The engine core is hexagonal: Detectors and the rephraser are swappable adapters behind ports. There is one engine core and two applications on top of it: the **Extension** (Chromium MV3, built now) and the **App** (desktop for macOS and Windows, built only if time allows). Both talk to the same engine, so no detection logic is duplicated.

## Considered Options

- **Everything in the extension (TypeScript, transformers.js):** no install step, but the Python model stack does not carry over and later clients would need the core rewritten.
- **Chrome native messaging (Chrome starts the engine):** needs a per-OS install (Windows registry, macOS manifest). Too costly for a hackathon team split between both OSes.

## Consequences

The user has to start the engine before the extension does anything. The extension must handle "engine not running" visibly.
