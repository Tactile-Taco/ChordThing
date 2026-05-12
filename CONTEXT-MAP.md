# Context Map

This repo uses multi-context domain docs. Each context has its own `CONTEXT.md` and `docs/adr/`.

## Contexts

| Context | Path | Description |
|---------|------|-------------|
| `frontend` | `frontend/CONTEXT.md` | Typing test sacred engine, Datastar shell, WebSerial device comms, text generation integration |
| `backend` | `backend/CONTEXT.md` | Axum server, auth, database, LLM proxy, spaced repetition, challenge point, analytics |

## How to read

- For frontend work (typer, rendering, input handling, WebSerial): read `frontend/CONTEXT.md`
- For backend work (API, auth, database, LLM delegation, scheduling): read `backend/CONTEXT.md`
- For cross-cutting concerns: read both, plus `docs/adr/` for system-wide decisions
