# Context Map

This repo uses multi-context domain docs. Each context has its own `CONTEXT.md` and `docs/adr/`.

## Contexts

| Context | Path | Description |
|---------|------|-------------|
| `frontend` | `frontend/CONTEXT.md` | Browser-only: sacred engine, Datastar shell, WebSerial, text generation integration |
| `backend` | `backend/CONTEXT.md` | Server-only: Axum, auth, typing sequence API, data cleaning, LLM proxy |
| `shared` | `shared/CONTEXT.md` | Cross-cutting domain terms and data contracts used by both frontend and backend |
| `deferred` | `deferred/CONTEXT.md` | Features not yet being worked on (FSRS, Challenge Point, mastery, sync, premium AI, etc.) |

## How to read

- For frontend work (typer, rendering, input handling, WebSerial): read `frontend/CONTEXT.md`
- For backend work (API, auth, database, LLM delegation): read `backend/CONTEXT.md`
- For domain concepts that cross boundaries (Chord, Typing sequence, data contracts): read `shared/CONTEXT.md`
- For long-term features not yet in development: read `deferred/CONTEXT.md`
- For system-wide decisions: read `docs/adr/`
