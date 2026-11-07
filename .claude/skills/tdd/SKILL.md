---
name: tdd
description: Test first, red then green. Use whenever adding behaviour or fixing a bug in engine/ or extension/.
---

# Test first: red, then green

No production code without a failing test that asks for it.

## The loop

1. **Red.** Write one test for the next small behaviour, with expected values taken from `docs/spec.md`. Run it and show the output. It must fail because the behaviour is missing, not because of a typo or a broken test.
2. **Green.** Write the smallest code that makes that test pass. Run it, then run all tests. Show the output.
3. **Tidy (optional).** Clean up names or duplication. Run all tests again; they must stay green.

Then pick the next behaviour and start again at 1.

## Rules

- Never change a test's expected value to make it pass. If the test is wrong, say so and ask.
- A bug fix starts with a test that reproduces the bug and fails.
- One behaviour per loop. Don't write several tests and then all the code at once.

## Example

`docs/spec.md` §2: in `"👋 01019000083"` the fødselsnummer is at 3–14, counted in UTF-16 units.

- **Red:** a test sends that text to detect and expects start 3, end 14. It fails with 2–13, because Python counts the emoji as one character. That is the right reason to fail.
- **Green:** convert positions to UTF-16 in detect. The test passes.
