# Typed, numbered placeholders instead of [HIDE]

Hide replaces a value with a Placeholder like `[PERSON_1]` rather than a bare `[HIDE]`. With `[HIDE] og [HIDE]` the AI can't tell two people apart, and Restore can't know which original value goes back where in the AI's response. With `[PERSON_1] og [PERSON_2]`, the AI keeps the structure and Restore has a key to look up.
