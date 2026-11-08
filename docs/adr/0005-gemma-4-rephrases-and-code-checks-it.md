# Gemma 4 E2B rephrases, and code checks every rewrite

Rephrase runs Gemma 4 E2B (instruction-tuned, Q4_K_M GGUF, about 3.1 GB) through llama-cpp-python, not the Qwen3 1.7B of the first spec. Small models improve fast, and in November 2026 Qwen3 (April 2025) was a generation old. Gemma 4 (April 2026) is the strongest open family on Norwegian in EuroEval, and the Opera Edition runs the same E2B model through Opera Web AI, so both editions rephrase alike. `GHOST_REPHRASE_MODEL=gemma-4-e4b` switches to the larger E4B (about 5 GB) on a machine with RAM to spare.

A 2B model is not trusted with privacy. Ghost tells it exactly what it found, then checks the answer in code. A rewrite is refused if it still contains a found value (in any case, or another form of the word: `sykemeldt`, `sykemelding`), adds an ID number, email or phone, invents a Placeholder, or answers in another language. The model then gets one more try with the problems named; if that also fails, the Engine answers `409` and the Card suggests Hide. Two things are safe but asked once more: a dropped Placeholder (its value was hidden already) and a new general word that is on a keyword list (`sykdom`). The safe rewrite that keeps the most Placeholders, then has the fewest such words, wins. Update (fix/rephrase): refusing a dropped Placeholder made 3 of 8 real runs on the demo note fail with `409`, because Gemma drops `[HEALTH_1]` next to the diagnosis word it generalizes and keeps the word when told to keep the Placeholder; with this rule 8 of 8 succeeded.

## Considered Options

- **Fine-tune with LoRA for Norwegian:** no Norwegian rewrite dataset and no time in a hackathon. Prompting a newer model and checking its answer in code goes further.
- **A Norwegian fine-tune (Borealis, NorMistral):** Borealis is built on Gemma 3, a generation older. NorMistral (11B) is too large for a laptop next to the browser. Nasjonalbiblioteket's Gemma 4 E2B checkpoint had no model card and no GGUF yet.
- **Qwen3.5 2B or 4B (March 2026):** stronger at reasoning, but it thinks by default (slower), and rewriting needs fluent Norwegian more than reasoning.
- **Mask first, then let the model smooth the text (the Opera Edition plan):** an age like "34 år" or a workplace is not a Finding, so masking alone leaves it. Generalising removes it.

## Consequences

`uv sync` builds llama-cpp-python from source the first time, which takes a few minutes. The model is downloaded once by the install scripts or `make start`, never by `/rephrase` (ADR-0001). Rephrase quality on rare phrasing is limited by a 2B model; the check makes a bad rewrite fail closed, never leak.
