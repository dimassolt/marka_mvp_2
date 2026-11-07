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
| `person_name` | Base | `PERSON` | orange | a capitalised word on the SSB first-name list |
| `health` | Domain (Health) | `HEALTH` | purple | a word or phrase on the Health keyword list (Bokmål and English): diagnoses, medicines, terms like "innlagt" and "sykemeldt" |

A Category `id` the Extension doesn't know is drawn purple, and Hide gives it the Placeholder prefix `DATA`.

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
  { "start": 0,  "end": 4,  "category": "person_name",   "confidence": 0.6 },
  { "start": 9,  "end": 17, "category": "health",        "confidence": 0.8 },
  { "start": 23, "end": 34, "category": "fodselsnummer", "confidence": 0.99 }
] }
```

- `start` is inclusive and `end` is exclusive, both counted **in UTF-16 units, the way JavaScript counts**. Example: in `"👋 01019000083"` the fødselsnummer is at 3–14, even though Python sees it at 2–13.
- Findings are sorted by `start` and never overlap. When two Detectors' Findings overlap, the longer one wins; for equal length, the higher `confidence` wins.
- Each Detector sets its own `confidence`. It is only used to break overlap ties.
- `domain` is `"free"` or `"health"` in V1. It is optional; without it the Engine uses `"free"`. An unknown domain returns `422`.
- The **Free** Domain finds Base Findings only. Example: `{ "text": "Kari har diabetes, fnr 01019000083" }` gives `person_name` at 0–4 and `fodselsnummer` at 23–34, but no `health`.

### `POST /rephrase`

```json
{ "sentence": "Kari, 34 år, jobber som lærer i Bærum og har diabetes type 1.", "domain": "health" }
```
```json
{ "text": "En kvinne i 30-årene som jobber i skolen, har en kronisk sykdom." }
```

- The model is Qwen3 1.7B Q4_K_M through llama-cpp-python. It is loaded when the Engine starts and is never unloaded during the hackathon. Backups if its Norwegian is weak: Borealis-Open-1B, then EuroLLM-1.7B.
- The answer is in the same language as `sentence`.
- Placeholders already in `sentence` (e.g. `[PERSON_1]`) appear unchanged in `text`.
- `text` is the rewritten sentence only, with no explanation or quotes. Empty `<think></think>` tags are stripped.

## 3. Extension behaviour

### Scanning

- The Extension scans every editable field (`contenteditable`) on any site. V1 is tested only on chatgpt.com.
- A scan sends the whole field text to `/detect`: 300 ms after the last keystroke, or immediately on paste.
- Only the background worker calls the Engine. Content scripts ask it via a message, because a page like chatgpt.com can't reach localhost.

### Underlines

- Underlines are drawn with the CSS Custom Highlight API, as wavy lines in the Category's colour. The site's editor HTML is never changed.
- Ignored values are not underlined.

### Card

- Hovering an underlined Finding opens its Card above it. Clicking keeps it open; `Esc` or a click elsewhere closes it.
- The Card shows the Category in English (e.g. "Fødselsnummer", "Health") and three buttons: **Hide**, **Rephrase**, **Ignore**.
- The Card is drawn inside a Shadow DOM, so its styles and the site's styles can't affect each other.

### Hide and the Vault

- Hide replaces this one occurrence with its Placeholder, using the editor's own insert command, so the site sees normal typing.
- A Placeholder is `[<PREFIX>_<n>]`. `n` counts per prefix and starts at 1 in each tab.
- The same value in the same tab always gets the same Placeholder, in this message and later ones. This keeps Restore consistent across a conversation.
- The Vault holds `Placeholder → original value` per tab in `chrome.storage.session`: memory only, never on disk, cleared when the browser closes.

### Ghost bar

- The Ghost bar is a round badge in the bottom-right corner of a field that has at least one Finding. It shows the Finding count.
- Clicking it shows **Hide all** and **Undo**.
- **Hide all** hides every underlined Finding in the field. It is one step for Undo.

### Ignore

- Ignore stores the pair (value, Category) for this field. Every occurrence of that pair stops being underlined.
- The list is cleared when the message is sent. The Extension treats "the field becomes empty" as sent.

### Undo

- Each field keeps a list of steps: Hide, Hide all, an accepted Rephrase.
- Undo reverts the newest step and puts the original text back. Vault entries stay, since Restore may still need them.
- The list is cleared when the message is sent.

### Rephrase

1. The sentence is the text around the Finding, up to the nearest `.`, `!`, `?` or line break on each side.
2. The Card shows "Rephrasing…" while it waits, for at most 15 seconds.
3. The Card shows the new sentence with **Accept** and **Reject**.
4. Accept replaces the sentence and triggers one normal scan. New Findings are underlined as usual; nothing is rephrased automatically.

### Restore

- On chatgpt.com, Restore replaces each Placeholder in the AI's answers and in the user's own sent messages with its Vault value, on screen only.
- Restored values get a dotted underline.
- Restore keeps working while the answer streams in, word by word.
- A Placeholder that isn't in the Vault (e.g. an AI-invented `[PERSON_3]`) is left as it is.

### Engine down

- If a call to the Engine fails, the Extension icon shows a red `!` badge, and the popup says "Start Ghost Agent engine".
- Rephrase shows "Engine not running" in the Card and changes nothing.
- There is no backup detection in the Extension.

## 4. Acceptance criteria

Every check below uses the demo note in section 5, typed or pasted into ChatGPT's input in Opera, with the Engine running.

| # | Given | When | Then |
|---|---|---|---|
| 1 | an empty ChatGPT input | the demo note is pasted | within 1 s, `01019000083` is red; `Kari`, the phone and the email are orange; `diabetes`, `sykemeldt` and `insulin` are purple; the Ghost bar shows 8 |
| 2 | the note is underlined | the user hovers `01019000083` | its Card opens above it with Fødselsnummer, Hide, Rephrase, Ignore |
| 3 | the Card is open on `01019000083` | the user clicks Hide | the field reads `fnr [FNR_1]`, the Vault holds `[FNR_1] → 01019000083`, the Ghost bar shows 7 |
| 4 | after check 3 | the user clicks Undo | the field reads `fnr 01019000083` again, red, and the Ghost bar shows 8 |
| 5 | the note is underlined | the user clicks Ignore on the first `Kari` | both `Kari` are no longer underlined, and the Ghost bar shows 6 |
| 6 | the note is underlined | the user clicks Rephrase on `diabetes` | within 15 s the Card shows a Norwegian sentence without the name, age or diagnosis; Accept replaces the sentence |
| 7 | the note is underlined | the user clicks Hide all | every underlined value is replaced, the same value with the same Placeholder (both `Kari` → `[PERSON_1]`), and the Ghost bar disappears |
| 8 | after check 7 | the user sends, and ChatGPT answers with `[PERSON_1]` | the answer shows "Kari" with a dotted underline, and so does the user's own sent message |
| 9 | the Engine is stopped | the user types in the field | nothing is underlined, the icon shows a red `!`, and the popup says "Start Ghost Agent engine" |
| 10 | the text `ordrenummer 01019000084` (checksum fails) | it is scanned | nothing is underlined |

## 5. Demo note

The test text for every check and for the live demo. The fødselsnummer is synthetic, with a valid checksum.

> Hei! Kan du hjelpe meg å skrive et henvisningsbrev? Pasienten heter Kari Nordmann, fnr 01019000083. Kari, 34 år, jobber som lærer i Bærum og har diabetes type 1. Hun er sykemeldt og bruker insulin. Ring henne på +47 912 34 567 eller send e-post til kari.nordmann@example.com.

`Nordmann` (a surname) and `Bærum` (a place) are **not** found in V1. They need the GLiNER Detector, which is a Could item.

## 6. Known limits

- Restore changes only what is shown on screen. ChatGPT's copy button copies its saved answer, which still contains Placeholders.
- `<textarea>` fields are not scanned in V1; they need an overlay layer (a Could item).
- Surnames, addresses and organisations are not found until the GLiNER Detector exists.
