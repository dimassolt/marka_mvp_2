# Ghost Agent: V1 spec

What V1 must do, precisely enough for the Extension pair and the Engine pair to build in parallel. The pitch and scope are in [README.md](../README.md). Terms are defined in [GLOSSARY.md](../GLOSSARY.md), and decisions are recorded in [adr/](adr/).

V1 means: the Extension in Opera on chatgpt.com, the Engine on the same Mac, and the **Health** Domain.

## 1. Categories

This table is the contract between Engine and Extension. The Engine returns the `id`, and the Extension picks the colour and Placeholder prefix from it.

| `id` | Kind | Placeholder | Colour | How it's found |
|---|---|---|---|---|
| `fodselsnummer` | Base | `FNR` | red | 11 digits, optionally `6+5` with a space, mod-11 checksum valid, first digit 0–3 |
| `d_nummer` | Base | `DNR` | red | same as above, first digit 4–7 |
| `bank_account` | Base | `ACCOUNT` | red | 11 digits, optionally `4.2.5` with dots or spaces, mod-11 checksum valid |
| `payment_card` | Base | `CARD` | red | 13–19 digits, optionally grouped by spaces or dashes, Luhn checksum valid |
| `iban` | Base | `IBAN` | red | country code + 2 check digits + account, IBAN mod-97 valid |
| `secret` | Base | `SECRET` | red | tokens starting `sk-`, `ghp_`, `AKIA`, or a JWT (`eyJ…`.`…`.`…`) |
| `password` | Base | `PASSWORD` | red | the value after `password:`, `passord:`, `pwd:` or `pw:` (the label itself is not part of the Finding) |
| `email` | Base | `EMAIL` | orange | an email address |
| `phone` | Base | `PHONE` | orange | Norwegian 8-digit number with optional `+47`/`0047`, or an international `+` number |
| `person_name` | Base | `PERSON` | orange | a capitalised word on the SSB first-name list, or a person the GLiNER Detector finds (e.g. a full name); once a full name is found, each of its words and the whole name are names wherever else they stand (`Nordmann` alone, after `Ola Nordmann`) |
| `organization` | Base | `ORG` | orange | an organisation the GLiNER Detector finds |
| `location` | Base | `PLACE` | orange | a place the GLiNER Detector finds |
| `health` | Domain (Health) | `HEALTH` | purple | a word or phrase on the Health keyword list (Bokmål and English): diagnoses, medicines, terms like "innlagt" and "sykemeldt" |
| `education` | Domain (Education) | `EDUCATION` | purple | a word or phrase on the Education keyword list (Bokmål and English): special needs, absence, discipline, grades, terms like "IOP" and "fravær" |
| `courts` | Domain (Courts) | `COURTS` | purple | a word or phrase on the Courts keyword list (Bokmål and English): closed hearings, draft decisions, sensitive case types, terms like "lukkede dører" and "barnevern" |
| `industrial` | Domain (Industrial) | `INDUSTRIAL` | purple | a word or phrase on the Industrial keyword list (Bokmål and English): machine makers, machine park, lines, capacity, control systems, terms like "Fanuc" and "produksjonslinje" |
| `religious` | Domain (Religious) | `RELIGIOUS` | purple | a word or phrase on the Religious keyword list (Bokmål and English): membership, pastoral care, ceremonies, terms like "menighet" and "sjelesorg" |

A Category `id` the Extension doesn't know is drawn purple, and Hide gives it the Placeholder prefix `DATA`.

Nothing inside a Placeholder (`[PERSON_1]`, `[EMAIL_2]`) is ever a Finding: the value it stands for is already hidden.

The GLiNER Detector runs `onnx-community/gliner_multi-v2.1` (fp16 ONNX, through fast_gliner) on chunks of whole sentences, at most 1000 characters each. It keeps an entity only if it scores at least 0.8, contains a capital letter and isn't a pronoun (`Hun`, `henne`). Its `confidence` is 0.5, so for Findings of equal length the list and regex Detectors win. The model is loaded from `engine/models/` on the first `/detect` call. Until it is downloaded the GLiNER Detector finds nothing and the other Detectors still run; detection itself never downloads ([ADR-0004](adr/0004-model-download-on-request.md)).

## 2. Engine API

The Engine listens on `http://127.0.0.1:8765` only. It never logs request or response bodies ([ADR-0001](adr/0001-local-only-processing.md)).

### `GET /health`

`200 {"status": "ok"}` only once every model is loaded. Until then the request fails or returns `503`.

### `POST /detect`

```json
{ "text": "Kari har diabetes, fnr 01019000083", "domain": "health" }
```
```json
{ "findings": [
  { "start": 0,  "end": 4,  "category": "person_name",   "confidence": 0.6,
    "prefix": "PERSON", "name": "Name", "group": "contact" },
  { "start": 9,  "end": 17, "category": "health",        "confidence": 0.8,
    "prefix": "HEALTH", "name": "Health", "group": "domain" },
  { "start": 23, "end": 34, "category": "fodselsnummer", "confidence": 0.99,
    "prefix": "FNR", "name": "Fødselsnummer", "group": "id" }
] }
```

- `start` is inclusive and `end` is exclusive, both counted **in UTF-16 units, the way JavaScript counts**. Example: in `"👋 01019000083"` the fødselsnummer is at 3–14, even though Python sees it at 2–13.
- Findings are sorted by `start` and never overlap. When two Detectors' Findings overlap, the longer one wins; for equal length, the higher `confidence` wins.
- Each Detector sets its own `confidence`. It is only used to break overlap ties.
- `prefix`, `name` and `group` come from the table in §1.
- `domain` is `"free"`, `"health"`, `"education"`, `"courts"`, `"industrial"` or `"religious"`. It is optional; without it the Engine uses `"free"`. An unknown domain returns `422`.
- The **Free** Domain finds Base Findings only. Example: `{ "text": "Kari har diabetes, fnr 01019000083" }` gives `person_name` at 0–4 and `fodselsnummer` at 23–34, but no `health`.
- `words` is an optional list of the user's own words, in the Health keyword syntax (`word`, `word*`, `*word`, phrases), matched in any case. Each match is a Finding with Category `custom`. When the user selects one of their own Domains, the Extension sends `"domain": "free"` and that Domain's words. Example: `{ "text": "Møte på Ullevål", "words": ["ullevål"] }` gives `custom` at 8–15.

### `GET /model`

The GLiNER model on this machine: `200 {"state": "missing", "downloaded_mb": 0, "error": null}`.

- `state` is `missing`, `downloading`, `ready` or `failed`.
- `downloaded_mb` is how much is on disk so far, while `downloading`. The model is about 600 MB.
- `error` says why the last download failed, when `state` is `failed`.

### `POST /model/download`

Starts the download in the background, the same files `scripts/fetch_gliner.py` fetches, and answers `202` with the new `GET /model` body. Calling it again while it downloads, or once it is ready, changes nothing. A request with an `Origin` that isn't the Extension's (`chrome-extension://`, `moz-extension://`) gets `403`, so a web page can't start it; a local tool without `Origin`, like curl, can.

### `POST /rephrase`

```json
{ "sentence": "Kari, 34 år, jobber som lærer i Bærum og har diabetes type 1.", "domain": "health" }
```
```json
{ "text": "En kvinne i 30-årene jobber som lærer og har en helseutfordring." }
```

- The model is Gemma 4 E2B (instruction-tuned, Q4_K_M GGUF) through llama-cpp-python ([ADR-0005](adr/0005-gemma-4-rephrases-and-code-checks-it.md)). `GHOST_REPHRASE_MODEL=gemma-4-e4b` uses E4B instead. The Engine starts loading it in the background at startup and never unloads it. `scripts/fetch_rephrase_model.py` downloads it (about 3.1 GB); `/rephrase` never downloads.
- `domain` and `words` work as in `/detect`. Without `domain`, the Engine uses `"free"`.
- The model is told the Findings `/detect` gives for `sentence`. Its answer must not contain any of their values, in any case or another form of the word (same first 5 letters, e.g. `sykemeldt` and `sykemelding`), and no new `id`-group Finding, `email` or `phone`.
- Placeholders already in `sentence` (e.g. `[PERSON_1]`) appear unchanged in `text`, and `text` has no other Placeholder.
- The answer is in the same language as `sentence` (Norwegian or English, told by its common words).
- A rewrite that breaks one of these rules gets one more try, with the problems named. A safe rewrite with new keyword-list words (`sykdom`) gets one more try for plainer words; the one with fewer wins, and the Extension underlines them after Accept.
- `text` is the rewritten sentence only: no explanation, quotes, label or `<think>` tags, and no line break.
- `422`: `sentence` is empty, longer than 1000 characters, or `domain` is unknown. `503`: the model is not downloaded or failed to load. `409`: no try was safe; the Card suggests Hide.
- When the model has loaded, the Engine's log says `Rephrase model ready (loaded in 1.5 s)`; if it is missing or fails, the log says so.

### `GET /rephrase/model`

The rephrase model on this machine: `200 {"state": "ready", "error": null}`.

- `state` is `idle` (no load started yet), `loading`, `ready`, `missing` (not downloaded) or `failed`.
- `error` says why loading failed, when `state` is `failed`.

## 3. Extension behaviour

### Scanning

- The Extension scans every editable field (`contenteditable` or `<textarea>`) on any site. V1 is tested only on chatgpt.com, whose input is a `<textarea>`.
- A scan sends the whole field text to `/detect`: 1 s after the last keystroke, or immediately on paste.
- The background worker remembers the answers to the last 50 requests (text, Domain and words), in memory only. The same request again gets the remembered answer without asking the Engine. A failed call is not remembered.
- Only the background worker calls the Engine. Content scripts ask it via a message, because a page like chatgpt.com can't reach localhost.

### Underlines

- Underlines are drawn with the CSS Custom Highlight API, as wavy lines in the Category's colour. The site's editor HTML is never changed.
- A `<textarea>` has no text in the page to highlight, so its underlines are drawn on an overlay: an invisible copy of its text with the same font, size, padding and scroll, laid over it at the end of `<body>`. Clicks pass through the overlay to the textarea.
- Ignored values are not underlined.

### Card

- Hovering an underlined Finding opens its Card above it. Clicking keeps it open; `Esc` or a click elsewhere closes it.
- The Card shows the Category in English (e.g. "Fødselsnummer", "Health") and three buttons: **Hide**, **Rephrase**, **Ignore**.
- The Card is drawn inside a Shadow DOM, so its styles and the site's styles can't affect each other.

### Hide and the Vault

- Hide replaces this one occurrence with its Placeholder, using the editor's own insert command, so the site sees normal typing.
- A Placeholder is `[<PREFIX>_<n>]`. `n` counts per prefix and starts at 1 in each tab.
- The same value in the same tab always gets the same Placeholder, in this message and later ones. This keeps Restore consistent across a conversation.
- A person keeps one Placeholder however the name is written: `Ola`, `Nordmann` and `Ola Nordmann` all get `[PERSON_1]`, and the Vault keeps the longest form (`Ola Nordmann`). A short name that fits two people in the Vault (`Ola`, with `Ola Nordmann` and `Ola Hansen`) gets a new Placeholder.
- The Vault holds `Placeholder → original value` per tab in `chrome.storage.session`: memory only, never on disk, cleared when the browser closes.

### Ghost bar

- The Ghost bar is a label tab on top of the box around the field the user last focused, while it has at least one Finding. It shows the Finding count.
- Clicking it shows **Hide all** and **Ignore all**.
- **Hide all** hides every underlined Finding in the field.
- **Ignore all** ignores every underlined Finding in the field.

### Ignore

- Ignore stores the pair (value, Category) for this field. Every occurrence of that pair stops being underlined.
- The list is cleared when the message is sent. The Extension treats "the field becomes empty" as sent.

### Undo

- The Extension has no Undo of its own. Hide types through the editor's insert command, so the editor's own Ctrl+Z puts the original text back. Vault entries stay, since Restore may still need them.

### Rephrase

1. The sentence is the text around the Finding, up to the nearest `.`, `!`, `?` or line break on each side.
2. The Card shows "Rephrasing…" while it waits, for at most 15 seconds. The Card stays open meanwhile, as if clicked.
3. The Card shows the new sentence with **Accept** and **Reject**.
4. Accept replaces the sentence through the editor's insert command, like Hide, and triggers one normal scan. New Findings are underlined as usual; nothing is rephrased automatically. If the user changed the sentence meanwhile, Accept changes nothing and the Card says "The text changed. Try again."
5. Reject closes the Card and changes nothing.
6. Without a rewrite, the Card says why above Hide, Rephrase and Ignore: "Engine not running", "Rephrase model isn't ready. See Settings in the popup." (`503`), "Couldn't rephrase without sensitive data. Use Hide." (`409`), "Rephrasing took too long. Try again." (15 s), "Couldn't rephrase. Try again.", or, when the background worker doesn't answer (the extension was rebuilt but not reloaded), "Ghost Agent was updated. Reload it on the extensions page, then this tab."

### Restore

- On chatgpt.com, Restore replaces each Placeholder in the AI's answers and in the user's own sent messages with its Vault value, on screen only.
- Restored values get a dotted underline.
- Restore keeps working while the answer streams in, word by word.
- A Placeholder that isn't in the Vault (e.g. an AI-invented `[PERSON_3]`) is left as it is.

### Name model

- While `GET /model` isn't `ready`, the popup shows "Names and places are off" under the site row, with a **Download model** button (`POST /model/download`). While it downloads, a progress bar and `312 of about 600 MB`, refreshed every 2 s. If it fails, the error and **Try again**.
- Settings has a **Name model** section with its state: Off, Downloading, Downloaded or Failed.
- The new model is used from the next `/detect`; the Engine doesn't need a restart.

### Rephrase model

- Settings has a **Rephrase model** section under Name model, from `GET /rephrase/model`: Not loaded, Loading, Ready, Not downloaded or Failed, with a line on what it means. While it is Not loaded or Loading, the popup asks again every 2 s. A failed load shows its error.

### Engine down

- If a call to the Engine fails, the Extension icon shows a red `!` badge, and the popup says "Start Ghost Agent engine".
- Rephrase shows "Engine not running" in the Card and changes nothing.
- There is no backup detection in the Extension.

### Onboarding

- A four-step tour inside the popup, for new users only. A fresh install marks it pending (`tourPending`); an update never does, so people who already use Ghost Agent don't get it. The popup shows it on its next open, until the user clicks Done or Skip. Nothing opens on install. Settings has "Take the welcome tour again", which shows it in the popup again.
- The tour comes before the Engine-down view, because its second step starts the Engine. The header shows "n of 4"; the footer has Back (Skip on the first step) and the next step.
  1. **Welcome:** one sentence, then the local promise: checked on this computer, hidden values in memory only, nothing changes until the user clicks.
  2. **Engine:** a live status, re-checked every 2 s while the Engine is down, with the start command. The user can go on without it. Once it runs and the GLiNER model isn't downloaded, the popup's model box (Download model, then the progress bar) is shown.
  3. **Domain:** the popup's Domain select and what the chosen Domain checks. It sets `selectedDomain`.
  4. **Where:** "Everywhere" (`*`, the default) or "Only sites I choose" (starts from chatgpt.com, claude.ai and gemini.google.com; the same `sites` setting as Settings), then how to pin the Extension and try it in ChatGPT. Done clears `tourPending` and shows the normal popup.

## 4. Acceptance criteria

Every check below uses the demo note in section 5, typed or pasted into ChatGPT's input in Opera, with the Engine running.

| # | Given | When | Then |
|---|---|---|---|
| 1 | an empty ChatGPT input | the demo note is pasted | within 1 s, `01019000083` is red; `Kari Nordmann`, `Kari`, `Bærum`, the phone and the email are orange; `diabetes`, `sykemeldt` and `insulin` are purple; the Ghost bar shows 9 |
| 2 | the note is underlined | the user hovers `01019000083` | its Card opens above it with Fødselsnummer, Hide, Rephrase, Ignore |
| 3 | the Card is open on `01019000083` | the user clicks Hide | the field reads `fnr [FNR_1]`, the Vault holds `[FNR_1] → 01019000083`, the Ghost bar shows 8 |
| 4 | after check 3 | the user clicks Undo | the field reads `fnr 01019000083` again, red, and the Ghost bar shows 9 |
| 5 | the note is underlined | the user clicks Ignore on `Kari` (the one after `fnr`) | that `Kari` is no longer underlined, `Kari Nordmann` still is, and the Ghost bar shows 8 |
| 6 | the note is underlined | the user clicks Rephrase on `diabetes` | within 15 s the Card shows a Norwegian sentence without the name, age or diagnosis; Accept replaces the sentence |
| 7 | the note is underlined | the user clicks Hide all | every underlined value is replaced, the same person with the same Placeholder (`Kari Nordmann` and `Kari` → `[PERSON_1]`), and the Ghost bar disappears |
| 8 | after check 7 | the user sends, and ChatGPT answers with `[PERSON_1]` | the answer shows "Kari Nordmann" with a dotted underline, and so does the user's own sent message |
| 9 | the Engine is stopped | the user types in the field | nothing is underlined, the icon shows a red `!`, and the popup says "Start Ghost Agent engine" |
| 10 | the text `ordrenummer 01019000084` (checksum fails) | it is scanned | nothing is underlined |

## 5. Demo note

The test text for every check and for the live demo. The fødselsnummer is synthetic, with a valid checksum.

> Hei! Kan du hjelpe meg å skrive et henvisningsbrev? Pasienten heter Kari Nordmann, fnr 01019000083. Kari, 34 år, jobber som lærer i Bærum og har diabetes type 1. Hun er sykemeldt og bruker insulin. Ring henne på +47 912 34 567 eller send e-post til kari.nordmann@example.com.

`Kari Nordmann` (a full name) and `Bærum` (a place) are found by the GLiNER Detector.

## 6. Known limits

- Restore changes only what is shown on screen. ChatGPT's copy button copies its saved answer, which still contains Placeholders.
- The GLiNER Detector finds most names, organisations and places, not all. A title before a name (`Dommer Ingrid Solheim`) becomes part of the Finding. Its repeats then include the title too: `Dommer` alone is underlined elsewhere in the text. Street addresses are not a Category.
