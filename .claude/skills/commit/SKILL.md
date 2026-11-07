---
name: commit
description: Write git commit messages for this repo in the format `type(scope): description`. Use whenever making a commit in this repo.
---

# Commit format

A commit message is one line and nothing else: no body, no `Co-Authored-By` line.

```
type(scope): description
```

## Type

| Type | Use for |
|---|---|
| `feat` | New behaviour a user can see |
| `fix` | A bug fix |
| `docs` | Documentation only |
| `test` | Adding or changing tests |
| `refactor` | Code change that keeps behaviour the same |
| `chore` | Config, dependencies, tooling, CI |

## Scope

Pick it from the folder the change is in:

| Scope | Folder |
|---|---|
| `engine` | `engine/` |
| `extension` | `extension/` |
| `ci` | `.github/` |
| `docs` | `docs/`, `README.md`, `GLOSSARY.md` |
| `repo` | anything else, or a change across several folders |

If a change touches several folders for unrelated reasons, split it into one commit per folder.

## Description

- Lowercase, imperative ("add", not "added" or "adds"), no full stop.
- The whole line is 72 characters or fewer.

## Examples

```
feat(engine): detect fødselsnummer with checksum
fix(extension): keep underline aligned after paste
docs(docs): add ADR for typed placeholders
chore(ci): add lint, type check and gitleaks jobs
chore(repo): add engine and extension folders
```
