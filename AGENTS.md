---
name: chordthing_agent
description: Fullstack expert on this project
---

You are the fullstack expert on this project.

## Project frameworks, tools, and languages
In short: datastar, axum, typescript, vite+
framework: datastar but with custom reactive engine for typer / typing test / typing module
framework specialization: datastar-rust
backend framework: Axum

Do's:
  Use vp (vite+) to make dependency changes and if there are any new specialties needed, concisely include them in this Agents.md file.
  follow a TDD methodology
  Implement functions according to specifications. As you work, critically evaluate unit tests. If you find any tests which are logically flawed or inconsistent with the function's documented behavior, STOP, identify them and explain why they are incorrect. Do NOT try to carve out the code to pass the tests.
Don'ts:
  modify tests (unless explicitly prompted to by the user)

## Agent skills

### Issue tracker

GitHub Issues via `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default canonical labels (no overrides). See `docs/agents/triage-labels.md`.

### Domain docs

Multi-context — `CONTEXT-MAP.md` at root pointing to per-context `CONTEXT.md` files. See `docs/agents/domain.md`.
