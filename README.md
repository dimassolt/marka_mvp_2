# Ghost Agent

Grammarly for privacy. Ghost Agent underlines sensitive data while you type or paste into an AI chat, and lets you hide or rephrase it before it leaves your screen. Everything runs on your own machine.

Built at Oslo Sprint, 6–8 November 2026. Deadline Sunday 14:00, 2-minute pitch from 14:15.

- **[docs/spec.md](docs/spec.md)**: exact behaviour, Categories, Engine API, acceptance criteria. Build against this.
- **[GLOSSARY.md](GLOSSARY.md)**: the terms we use.
- **[docs/adr/](docs/adr/)**: decisions and why we made them.

## Setup

First time on a new machine, from the repo folder:

- macOS or Linux: `./scripts/install.sh`
- Windows (PowerShell): `powershell -ExecutionPolicy Bypass -File scripts\install.ps1`

The script installs uv if it is missing, the Engine's Python packages, the GLiNER model (about 600 MB, downloaded once) and the Extension's npm packages, then runs the Engine tests. It needs Node 22 or newer. On Windows it also needs Rust from [rustup.rs](https://rustup.rs), because the GLiNER runtime is built from source there. If the model is missing later, the popup offers a **Download model** button that does the same download through the Engine.

Then start both with `make start` (macOS or Linux) or `powershell -ExecutionPolicy Bypass -File scripts\start.ps1` (Windows, which has no make). Ctrl+C stops both. Or run `uv run ghost-engine` in `engine/` and `npm run dev` in `extension/`.

**Windows: fast_gliner fails to link.** Two native libraries it bundles use different C++ runtimes. `install.ps1` sets `CXXFLAGS_x86_64_pc_windows_msvc=/MD` and `CFLAGS_x86_64_pc_windows_msvc=/MD` for you. If you run `uv sync` by hand and it rebuilds fast_gliner, set them first:

```powershell
$env:CFLAGS_x86_64_pc_windows_msvc = "/MD"
$env:CXXFLAGS_x86_64_pc_windows_msvc = "/MD"
cd engine; uv sync
```

Everyday runs don't need them, only rebuilds.

## Problem

A nurse pastes a patient note into ChatGPT to get help writing a letter. The note has the patient's name, fødselsnummer and diagnosis. That's a GDPR breach, and nothing on screen warned her.

## How it works

1. The user types or pastes into an input field, and the Extension asks the local Engine for Findings.
2. Findings are underlined: red for secrets and ID numbers, orange for contact data, purple for Domain Findings.
3. Hovering a Finding opens its **Card**: **Hide** (replace with a Placeholder like `[PERSON_1]`), **Rephrase** (rewrite the sentence with a local LLM), **Ignore**.
4. The **Ghost bar** on the field's edge shows the Finding count, with **Hide all** and **Ignore all**.
5. When the AI answers with `[PERSON_1]`, **Restore** shows "Kari" on the user's screen only.

## Architecture

One Engine core, two applications ([ADR-0002](docs/adr/0002-thin-extension-local-python-engine.md)). No text leaves the machine ([ADR-0001](docs/adr/0001-local-only-processing.md)).

```
Extension (Chromium MV3, WXT + TypeScript)        App (desktop, if time allows)
   underlines · Card · Ghost bar · Vault · Restore
                 │  HTTP 127.0.0.1:8765                     │
                 └──────────────┬───────────────────────────┘
                     Engine (Python, uv + FastAPI)
              ports: Detector, Rephraser   (hexagonal)
   adapters: Regex · First-name list · Health keywords · GLiNER · Qwen
```

## Scope

**Must** (no demo without these):
- the Base and Health Detectors, plus the overlap rule
- underlines, the Card, the Ghost bar, also in a `<textarea>` through an overlay (ChatGPT's input is one)
- Hide, Hide all, Ignore, Ignore all, the Vault
- Rephrase with Qwen
- Restore on ChatGPT while the answer streams in
- GLiNER Detector
- Restore on Claude
- the engine-down badge
- the demo running in Opera

**Could:**
- a School Domain

**Later:**
- the desktop App
- unloading Qwen when idle
- a warning before Send
- more Domains

## Demo (2 minutes, Opera + ChatGPT)

1. **0:00–0:20, the problem:** a nurse is about to paste a patient note into an AI chat.
2. **0:20–1:30, live** with the [demo note](docs/spec.md#5-demo-note):
   - Paste the note; underlines appear.
   - Hide the fødselsnummer.
   - Rephrase "Kari, 34 år, …" and accept the preview.
   - Hide all, then send.
   - ChatGPT answers with `[PERSON_1]`, and the screen shows "Kari".
3. **1:30–2:00, why it matters:** everything is local. School is the next Domain, then the desktop App for every program.

Have a pre-recorded video of the same demo ready as a backup.

## Open

- Main challenge and side challenges from kickoff, including whether Opera has a side challenge.
- Who on the team does what (2 people on Mac, 2 on Windows).
