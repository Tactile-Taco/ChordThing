# Distillation Status — Planning Documents → CONTEXT.md

## Documents Processed

- PLAN.md (1,383 lines)
- ARCHITECTURE(1).md (310 lines)
- TEST_ARCHITECTURE.md (256 lines)

## Files Created

| File | Status |
|------|--------|
| `CONTEXT-MAP.md` | ✅ Written |
| `frontend/CONTEXT.md` | ✅ Written, needs grilling |
| `backend/CONTEXT.md` | ✅ Written, needs grilling |
| `frontend/docs/adr/` | ✅ Directory created (empty) |
| `backend/docs/adr/` | ✅ Directory created (empty) |
| `docs/adr/` | ✅ Directory created (empty) |

---

## Resolved Automatically (No Ambiguity)

| # | Item | Resolution | Evidence |
|---|------|------------|----------|
| 1 | Backend framework | **Axum** (not Salvo) | `backend/Cargo.toml` has `axum = "0.8"`; `main.rs` uses Axum. PLAN.md/ARCHITECTURE.md mention Salvo but the actual code uses Axum. Added as invariant in both CONTEXT.md files. |
| 2 | Frontend framework | **Datastar + vanilla TS sacred engine** | `backend/templates/index.html` loads Datastar CDN; `frontend/src/typer.ts` is imperative DOM manipulation. TEST_ARCHITECTURE.md documents this hybrid explicitly. |
| 3 | Build tool | **Vite** | `frontend/vite.config.ts`, `frontend/package.json` scripts use `vp dev`/`vp build`. |
| 4 | Package manager | **Bun** (frontend), **npm** (root) | `frontend/package.json` has `"packageManager": "bun@1.3.13"`; root `package.json` has `"packageManager": "npm@11.14.1"`. |
| 5 | Template engine | **Askama** | `backend/Cargo.toml` has `askama = "0.13"`; `main.rs` uses `#[derive(Template)]`. |
| 6 | Dev command | `vp exec concurrently 'cd backend && cargo run' 'cd frontend && vp dev'` | Root `package.json` `"dev"` script. |
| 7 | Frontend proxy | `/api` → `http://127.0.0.1:8080` | `frontend/vite.config.ts` |
| 8 | Current branch | `datastar-axum-vite` | `git branch` output |
| 9 | Main branch | `main` | `git branch` output |
| 10 | Branch divergence | 4 commits ahead of main | `git log main..HEAD --oneline` |
| 11 | Test gen modes | `"random"`, `"local"`, `"remote"` | `frontend/index.html` radio buttons; `backend/templates/index.html` Datastar signals |
| 12 | Device comms | **WebSerial API** | `frontend/src/cc.ts` uses `navigator.serial.requestPort()`; `frontend/src/types/web-serial.d.ts` |
| 13 | Chord storage | `localStorage` under key `"chords"` | `frontend/src/chordManager.ts` |
| 14 | Session state | `sessionStorage` for `next_char_index`, `test_gen_mode` | `frontend/src/typer.ts`, `frontend/src/main.ts` |
| 15 | Buffer min length | **800 untyped characters** | `frontend/src/typer.ts` `TEST_BUFFER_MIN_LENGTH = 800` |
| 16 | Cursor pattern | **Cursor-as-ID on `<char>`** | `frontend/src/typer.ts` |
| 17 | DOM element types | `<char>`, `<word>`, `<ruby>`, `<rt>`, `<rp>` | `frontend/src/textRenderer.ts` |
| 18 | Pause mechanism | **Blur → show dialog; focus/click → unpause** | `frontend/src/typer.ts` |
| 19 | Input handling | `beforeinput` cancelled; handles `insertText`, `deleteContentBackward` | `frontend/src/typer.ts` |
| 20 | Current text source | Hardcoded: `"This test is totally randomly generated text"` | `frontend/src/typer.ts` `getTextFragment()` |
| 21 | Chord annotation | `<ruby>` with `<rt>` showing chord input | `frontend/src/textRenderer.ts` |
| 22 | CSS framework | **None (custom CSS)** | `frontend/src/style.css` |
| 23 | Font | **Atkinson Hyperlegible Mono** | `frontend/src/style.css` `@import` |
| 24 | Color scheme | Dark brown background (`#6a4444`), cream text | `frontend/src/style.css` `:root` |
| 25 | State type | `Arc<Mutex<AppState>>` | `backend/src/main.rs` |
| 26 | Static file serving | `ServeDir::new("../frontend/dist")` | `backend/src/main.rs` |
| 27 | Bind address | `127.0.0.1:8080` | `backend/src/main.rs` |
| 28 | Dev mode flag | `DEV` env var | `backend/src/main.rs` `std::env::var("DEV").is_ok()` |
| 29 | Backend deps | axum, tokio, tower-http, datastar, serde, tracing, askama, futures | `backend/Cargo.toml` |
| 30 | Frontend deps | typescript, vite | `frontend/package.json` devDependencies |

---

## Needs Grilling (Unresolved / Inconsistent / Ambiguous)

### A. Tauri / Desktop — Is this in scope for the current codebase?

| Source | Claim |
|--------|-------|
| PLAN.md | "Offline support (Tauri) — P0" |
| ARCHITECTURE.md | "Tauri app shell (desktop)" — listed under "What Stayed" |
| Actual repo | No `desktop/`, `src-tauri/`, or Tauri config exists |

**Question:** Is Tauri a current concern, or deferred? The PLAN.md says P0 but the repo has zero Tauri code. Should I remove Tauri references from CONTEXT.md, or mark as planned?

---

### B. Database — SQLite vs PostgreSQL

| Source | Claim |
|--------|-------|
| PLAN.md | "SQLite (start), PostgreSQL (scale)" |
| ARCHITECTURE.md | "PostgreSQL — all sessions, chord attempts, mastery" (under "Server Source of Truth") |
| Actual repo | No database code, no sqlx, no migrations |

**Question:** Is the backend currently stateless (just serving static files + proxying), or should I add sqlx now? The `backend/Cargo.toml` has no database dependency.

---

### C. Auth / Users — Is there any auth at all right now?

| Source | Claim |
|--------|-------|
| PLAN.md | PKCE auth for OpenRouter, user accounts, subscription tiers |
| ARCHITECTURE.md | Subscription tiers (Free / Pro $4.99 / Coach $9.99) |
| Actual repo | No auth code, no user model, no session middleware |

**Question:** Is auth deferred, or should the backend start with anonymous sessions? The current `AppState` only has `test_gen_mode: String`.

---

### D. LLM Integration — What is the actual plan for text generation?

| Source | Claim |
|--------|-------|
| PLAN.md | Complex free-tier delegation chain, WebLLM, native Rust GGUF, BYOK |
| ARCHITECTURE.md | Three-backend contract: Native Rust / WebLLM / Server |
| Actual repo | `getTextFragment()` returns hardcoded string |

**Question:** Is the immediate next step to implement a real text generator (even if just random words from a list), or is the hardcoded string sufficient for now? The radio buttons in the UI suggest "local" and "remote" are intended to work.

---

### E. FSRS / Challenge Point / Spaced Repetition — Backend or frontend?

| Source | Claim |
|--------|-------|
| PLAN.md | FSRS in shared Rust logic, Challenge Point in backend |
| ARCHITECTURE.md | "Server source of truth" for FSRS scheduling |
| Actual repo | No FSRS code anywhere |

**Question:** Is the learning system (FSRS + Challenge Point) deferred until after basic typing works, or should it be designed now? The TEST_ARCHITECTURE.md mentions the engine should emit events for the wrapper to aggregate — but there's no wrapper yet.

---

### F. Event Interface — Should the Typer class emit events now?

| Source | Claim |
|--------|-------|
| TEST_ARCHITECTURE.md | Typer should emit `charTyped`, `charDeleted`, `wordCompleted`, `bufferLow`, `sessionStart`, `sessionPause`, `sessionResume`, `sessionComplete` |
| Actual repo | `Typer` class has zero event emission |

**Question:** Is adding an event interface to `Typer` the next priority, or should we keep it minimal until stats tracking is needed?

---

### G. Datastar Version

| Source | Claim |
|--------|-------|
| `backend/templates/index.html` | `datastar.js` from CDN `@v1.0.0-RC.8` |
| `backend/Cargo.toml` | `datastar = { version = "0.3", features = ["axum"] }` |

**Question:** Are these versions compatible? The Cargo crate is 0.3 but the CDN is RC.8. Is the backend actually using the `datastar` crate for anything (SSE, signals), or is it just serving static HTML with CDN Datastar?

---

### H. `data-ignore-morph` on `#typer-display`

| Source | Claim |
|--------|-------|
| `backend/templates/index.html` | `<div id="typer-display" data-ignore-morph>` |
| TEST_ARCHITECTURE.md | "Datastar never touches `#typer-display`" |

**Question:** Is `data-ignore-morph` a Datastar directive that prevents morphing, or is it a custom attribute? If Datastar morphs the DOM on SSE updates, this prevents it from wiping the sacred engine's DOM.

---

### I. Multi-context layout — Where do context boundaries actually fall?

| Decision | Rationale |
|----------|-----------|
| I put `frontend/CONTEXT.md` and `backend/CONTEXT.md` | Because the frontend is fairly settled (sacred engine + Datastar shell) while backend is nearly empty and will grow significantly |

**Question:** Is this the right split? Or should there also be a `shared/` context for FSRS/models that both frontend (via WASM) and backend use? The PLAN.md mentions a `shared/` Rust crate.

---

### J. Agents.md vs CLAUDE.md

| Observation |
|-------------|
| The repo has `Agents.md` (not `AGENTS.md` or `CLAUDE.md`). The skill instructions say "If `CLAUDE.md` exists, edit it. Else if `AGENTS.md` exists, edit it." I edited `Agents.md` because it was the only file present. |

**Question:** Should we rename `Agents.md` to `CLAUDE.md` for consistency with the skill conventions, or keep it as-is?

---

## How to Use This File

- When a topic is grilled and resolved, move it from "Needs Grilling" to "Resolved via Grilling" with the answer.
- When new planning documents arrive, add new items here.
- When CONTEXT.md files are updated, note which items were addressed.
