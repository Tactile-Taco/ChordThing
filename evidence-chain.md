# Evidence Chain — Protocols ↔ Implementation ↔ Tests ↔ Mutation Scores

_Generated at 2026-05-15T19:18:08.087753+00:00Z_

This document links every protocol to its implementation, tests, and mutation-testing results.

## Frontend

### Typer

- **Protocol doc**: `docs/protocols/typer.md` ✅
- **Source**: `frontend/src/typer.ts` ✅
- **Test**: `frontend/src/typer.test.ts` ✅
- **Mutation score**: 14.0% (49 survived / 57 total)

### Text Renderer

- **Protocol doc**: `docs/protocols/text-renderer.md` ✅
- **Source**: `frontend/src/textRenderer.ts` ✅
- **Test**: `frontend/src/textRenderer.test.ts` ✅
- **Mutation score**: 50.0% (7 survived / 14 total)

### Chord Serialization

- **Protocol doc**: `docs/protocols/chord-serialization.md` ✅
- **Source**: `frontend/src/device/chordSerialization.ts` ✅
- **Test**: `frontend/src/device/chordSerialization.test.ts` ✅
- **Mutation score**: 0.0% (4 survived / 4 total)

### Chord Manager

- **Protocol doc**: `docs/protocols/chord-manager.md` ✅
- **Source**: `frontend/src/chordManager.ts` ✅
- **Test**: `frontend/src/chordManager.test.ts` ✅
- **Mutation score**: 7.7% (12 survived / 13 total)

## Backend

### app.rs

- **Source**: `backend/src/app.rs` ✅
- **Test**: `backend/tests/integration.rs` ✅
- **Mutation score**: _no data_

### lib.rs

- **Source**: `backend/src/lib.rs` ✅
- **Mutation score**: _no data_

### main.rs

- **Source**: `backend/src/main.rs` ✅
- **Mutation score**: _no data_

### routes.rs

- **Source**: `backend/src/routes.rs` ✅
- **Mutation score**: _no data_

### state.rs

- **Source**: `backend/src/state.rs` ✅
- **Mutation score**: _no data_

---

## Legend

- **Mutation score** = percentage of mutants killed by the test suite.
- **survived** = mutants that passed all tests (weak oracle).
- **nocov** = mutants in uncovered code (missing tests).

## CI Artifacts

- `stryker-results` — Full Stryker HTML/JSON report (`frontend/reports/mutation/`)
- `cargo-mutants-results` — Full cargo-mutants output (`backend/mutants.out/`)
- `evidence-chain` — This summary (`evidence-chain.md` + `evidence-chain.json`)
