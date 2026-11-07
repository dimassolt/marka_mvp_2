# Ghost Agent

Ghost Agent highlights sensitive data (personal data protected by GDPR, health data, secrets) in text a user is about to send to an AI chat or anywhere else. It lets the user hide, rephrase or ignore each piece before it leaves their screen.

## Language

**Finding**:
A stretch of text that a detector believes is sensitive. It has a category and a confidence.
_Avoid_: match, hit, issue, entity, highlight

**Category**:
The kind of sensitive data a Finding is, such as fødselsnummer, email, payment card or health.
_Avoid_: type, label, entity type

**Detector**:
A strategy that reads text and produces Findings. Ghost Agent can swap one strategy (regex, NER model) for another.
_Avoid_: scanner, recognizer, engine

### Domains

**Domain**:
A customer sector with its own idea of what is sensitive, such as Health or School. A Domain has its own Categories, keyword lists and rephrase instructions. One Domain is active at a time.
_Avoid_: profile, vertical, preset, mode

**Free Domain**:
The default Domain, used when no other Domain is chosen. It has no Categories or keyword lists of its own, so it gives Base Findings only.
_Avoid_: default profile, generic mode, none

**Base Finding**:
A Finding whose Category is sensitive in every Domain, such as fødselsnummer, email, payment card or a person's name.
_Avoid_: generic finding, PII finding

**Domain Finding**:
A Finding whose Category is sensitive because of the active Domain, such as a diagnosis in Health or "spesialundervisning" in School.
_Avoid_: profile finding, custom finding

### Actions

**Hide**:
Replaces one occurrence of a Finding with its Placeholder.
_Avoid_: mask, redact, anonymize

**Hide all**:
Replaces every Finding in the field with its Placeholder.

**Placeholder**:
A typed, numbered token that stands in for a hidden value, such as `[PERSON_1]` or `[FNR_1]`. Within one text, the same value always gets the same Placeholder.
_Avoid_: `[HIDE]`, mask, token

**Rephrase**:
Rewrites the sentence containing a Finding into a more general one that keeps its meaning. For example, "Kari, 34 år, jobber som sykepleier på Ullevål" becomes "En kvinne i 30-årene jobber som sykepleier på et sykehus".
_Avoid_: rewrite, generalize, paraphrase

**Ignore**:
Tells Ghost Agent that a value of a given Category is not sensitive in this input field. Every occurrence of that value is ignored until the message is sent; after that, the value is flagged again.
_Avoid_: dismiss, allow, whitelist

**Restore**:
Shows the original values in place of Placeholders in the AI's response, on the user's screen only.
_Avoid_: unmask, de-anonymize, reveal

**Undo**:
Reverts the most recent Hide, Hide all or Rephrase in the input field, putting the original text back.
_Avoid_: revert, rollback

### On screen

**Card**:
The small box that opens above a Finding, offering Hide, Rephrase and Ignore.
_Avoid_: popover, tooltip, popup

**Ghost bar**:
The round badge in the corner of an input field. It shows how many Findings the field has and offers Hide all and Undo.
_Avoid_: toolbar, badge, widget

### Memory

**Vault**:
The table of Placeholder → original value for one browser tab. It exists only in memory and disappears when the browser closes.
_Avoid_: map, mapping, cache, store
