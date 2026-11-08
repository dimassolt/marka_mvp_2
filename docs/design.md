# Design: Ghost Agent

The locked look of the Extension: the underlines, the Card, the Ghost bar, Restore and the popup. Build against this; change it on purpose. The canvas with every screen is [Ghost Agent UI](https://claude.ai/artifact/3vAV2wc8rVbnAedLwHPdvu).

## System

- Theme: Dose, "Ink + cobalt stamp" finish. Warm paper, black ink, one cobalt stamp.
- Idea: the Card is a pharmacy label. Hiding a value stamps it with its Placeholder.
- Genre: modern-minimal. Shape: app screens (no marketing page).

## Tokens

[`extension/assets/tokens.css`](../extension/assets/tokens.css) is the source of truth. It sets the tokens on `:root, :host`, so the Card and Ghost bar can read them inside their Shadow DOM. Never write a colour or font outside it.

| Role | Token | Used for |
|---|---|---|
| Paper | `--color-paper`, `-2`, `-3` | ground, labels (Card, popup), sunk rows |
| Ink | `--color-ink`, `-ink-2`, `--color-muted` | text; muted is for hints and labels |
| Controls | `--color-accent` (black) | primary buttons, switch, tab when open |
| Stamp | `--color-stamp` (cobalt) | the "hide as" stamp, Placeholders, Ghost count, focus ring, Restore underline. Nothing else. |
| Categories | `--color-cat-id` red, `--color-cat-contact` amber, `--color-cat-domain` teal | underlines only, plus their soft tints |

Type: Schibsted Grotesk 700 for headings, Instrument Sans 400/500 for everything else, DM Mono for values the machine wrote (`01019000083`, `[FNR_1]`, the count). Never mono on a label or a button.

## Components

- **Underline:** wavy, 1.5px, offset 4px, in the Category colour (CSS Custom Highlight API). Hovered: the soft tint behind it. Domain words, your own words and unknown Category ids are teal.
- **Card:** `--color-paper-2`, radius 10, `--shadow-lift`, width 300. Top: Category name underlined in its colour, the value in DM Mono, and the cobalt stamp `hide as [FNR_1]` rotated −3°. A dashed tear-off rule (`--rule-tear`), then Hide (black), Rephrase (clear), Ignore (text). States: default, rephrasing, preview, engine down.
- **Ghost bar:** a label tab on top of the field's visible box, outside it at the right, so it covers neither text nor the site's buttons: `8 to check`, count in cobalt mono, dashed cobalt left edge. Open: black tab with a menu above it (Hide all and Ignore all, each with the count). Gone at 0. Not a round badge (that reads as Grammarly).
- **Placeholder:** plain text in the site's editor, `[PREFIX_n]`. We never style it in the field.
- **Restore:** the original value with a 2px cobalt dotted underline. Hover: dark ink hint, "Shown only on your screen. The AI saw [PERSON_1]".
- **Popup:** 330 wide. Header (ghost, name, status chip), site row (switch and settings button), Domain select with a plus for a new Domain, then your words as teal chips with Add. Views: your Domain, built-in Domain, New Domain, Settings (Sites list, `*` = all, Models), Engine down (with `cd engine && uv run ghost-engine`). While a model isn't downloaded, a `--color-paper-3` box under the site row: "Basic checks are on", then the models as numbered steps on `--color-paper-2` rows (1 GLiNER, 2 Gemma 4, name and size in DM Mono), a black **Download** button on the next step, a muted "After step 1" on the waiting one, a cobalt progress bar with the MB in DM Mono while downloading, and a cobalt tick once done. A "?" by each step's title, styled like the Domain's, shows a black tooltip over the full width of its step with what the model enables.

## Controls

- Primary: black fill, radius 10, 38 to 42px tall, `--shadow-mould`; sinks 3px on press.
- Secondary: paper fill, 1px rule, same radius and height, `--shadow-mould-clear`.
- Text button: muted ink, no fill.
- Focus: 2px cobalt outline, offset 2px, instant.
- Every control ships eight states: default, hover, focus-visible, active, disabled, loading, error, success.

## Motion

Still. Colour and opacity change over `--dur-micro` on `--ease-out`; no reveal, no bounce. Under `prefers-reduced-motion` everything ends at once.

## Don'ts

- No green accent, no round corner badge: both read as Grammarly.
- No second spot colour; cobalt is only for what was stamped.
- No coloured status dots, no tracked capitals, no emoji icons.
- No colour or font outside `tokens.css`.

## Exports

`extension/assets/tokens.css`. Tailwind or DTCG blocks on request.
