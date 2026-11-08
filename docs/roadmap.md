# Roadmap: from the sprint demo to a one-click install

Where Ghost Agent goes after Oslo Sprint (8 November 2026). The vision: anyone who writes to an AI chat can install Ghost Agent in two clicks, without a terminal, and their text still never leaves their computer ([ADR-0001](adr/0001-local-only-processing.md)).

## Today

A user needs developer tools to run Ghost Agent:

1. Clone the repo, then run `./scripts/install.sh`. It installs uv, the Engine, the GLiNER model (about 600 MB) and Gemma 4 E2B (about 3.1 GB).
2. Run `make start` and keep the terminal open.
3. In Opera, turn on Developer mode and load `extension/.output/chrome-mv3-dev` unpacked.

The tour in the popup then explains the rest (docs/spec.md, Onboarding).

## Goal

| | Today | Goal |
|---|---|---|
| Extension | Developer mode, Load unpacked | "Add to Opera" from a store |
| Engine | clone, install script, `make start` | open `Ghost Agent.dmg`, drag to Applications, it starts at login |
| Models | downloaded by the install script | downloaded on first run from the popup |

## Steps

Smallest first. Steps 1 and 2 are work in this repo; step 3 needs packaging and an Apple account.

### 1. Download both models from the popup

GLiNER already downloads from the popup on request ([ADR-0004](adr/0004-model-download-on-request.md)). Give Gemma the same: a `POST /rephrase/model/download` on the Engine and a Download button in Settings and in the tour's Engine step.

- Why: the Engine package stays small, and the install script no longer has to fetch 3.7 GB.
- Done when: a fresh Engine with no models gets both from the popup, with progress, and Rephrase works after.

### 2. Put the Extension in a store

List it in the Chrome Web Store (Opera installs from it) or in Opera add-ons.

- Needs: a privacy policy (nothing leaves the machine, so it is short), store screenshots, a production build (`npm run build`, `npm run zip`).
- Change: the popup's Engine-down view links to the Engine download instead of showing `cd engine && uv run ghost-engine`.
- Done when: a user installs the Extension without Developer mode.

### 3. Ship the Engine as a Mac app

Bundle Python, the Engine and its native libraries (fast_gliner, llama-cpp-python) into one `Ghost Agent.app` with PyInstaller or Briefcase, in a `.dmg`.

- Starts at login through a launch agent (macOS's way of starting a program when the user logs in), so nobody runs it by hand.
- Signed and notarized with an Apple Developer account (99 USD a year), so macOS opens it without an "unknown developer" warning.
- Windows later: the same bundle as an installer, started from the Startup folder.
- Done when: a new Mac goes from nothing to underlines in ChatGPT with one `.dmg` and one store install.

### 4. The desktop App

The second application on the same Engine ([ADR-0002](adr/0002-thin-extension-local-python-engine.md)): the same checks in every program, not only the browser. Step 3's app is its starting point.

## Open decisions

- Which store first: Chrome Web Store (Opera, Chrome, Edge, Brave) or Opera add-ons only?
- PyInstaller or Briefcase for the Engine app?
- Who owns the Apple Developer account and the signing certificate?
- Does the Engine app update itself, or does the user download each new version?
- Is Windows part of the first release, or after the Mac app?
