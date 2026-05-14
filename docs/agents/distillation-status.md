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

### A. Tauri / Desktop — Deferred

| Source | Claim |
|--------|-------|
| PLAN.md | "Offline support (Tauri) — P0" |
| ARCHITECTURE.md | "Tauri app shell (desktop)" — listed under "What Stayed" |
| Actual repo | No `desktop/`, `src-tauri/`, or Tauri config exists |

**Resolution:** Deferred until web app is feature-complete. Three-backend contract stands as aspirational architecture — new features must not preclude a future Tauri port. Hardware detection scoped to WebGPU tier only; Tauri-specific detection deferred.

**Updated in:** `frontend/CONTEXT.md` (Three-backend contract), `backend/CONTEXT.md` (App mode, Hardware capability detection)

---

### B. Database — SQLite vs PostgreSQL

| Source | Claim |
|--------|-------|
| PLAN.md | "SQLite (start), PostgreSQL (scale)" |
| ARCHITECTURE.md | "PostgreSQL — all sessions, chord attempts, mastery" (under "Server Source of Truth") |
| Actual repo | No database code, no sqlx, no migrations |

**Resolution:** SQLite chosen as starter database. PostgreSQL references are aspirational/scale planning. All database-dependent backend features marked **deferred** in `backend/CONTEXT.md`. API layer (typing sequences) will be designed and iterated first; schema will be derived from stabilized API shapes. sqlx will be added when the first API endpoint needs persistence.

**Key decisions:**
- "Sessions" concept replaced with "typing sequences" (contiguous bursts). See ADR 0002.
- Raw typing events sent by frontend; chord detection deferred to backend data cleaning pipeline.
- Backend glossary terms for FSRS, Challenge Point, mastery, etc. marked "Backend implementation deferred."

**Updated in:** `backend/CONTEXT.md` (deferred markers, new typing sequence terms), `docs/adr/0002-typing-sequence-api.md` (created)

---

### C. Auth / Users — Deferred until CI/CD + test harnesses are in place

| Source | Claim |
|--------|-------|
| PLAN.md | PKCE auth for OpenRouter, user accounts, subscription tiers |
| ARCHITECTURE.md | Subscription tiers (Free / Pro $4.99 / Coach $9.99) |
| Actual repo | No auth code, no user model, no session middleware |

**Resolution:** Auth is NOT fully deferred — it is a near-term priority, but it depends on CI/CD and test harnesses being in place first. Priority stack:
1. CI/CD + test harnesses (foundational)
2. Device connection status (already mostly implemented; good test harness candidate)
3. Typing sequence API + Auth design (parallel tracks, both touch CI/CD)

**Key decisions:**
- Anonymous sessions: client-generated `anonymous_id` in `localStorage`, sent as `X-Anonymous-ID` header. Data migrates to real account on signup/login.
- Ory ecosystem for auth (Kratos for identity, Hydra for OAuth2/OIDC).
- PKCE is for OpenRouter OAuth (BYOK), not primary ChordThing login.
- Subscription tiers are aspirational and subject to change.
- Device connection and auth are independent feature filters.

**Updated in:** `frontend/CONTEXT.md` (auth terms clarified, deferred markers), `backend/CONTEXT.md` (auth terms clarified, deferred markers), `docs/adr/0003-auth-anonymous-design.md` (created), `docs/adr/0004-ci-cd-test-harness.md` (created)

---

### D. LLM Integration — Deferred until after CI/CD + auth; candidates identified

| Source | Claim |
|--------|-------|
| PLAN.md | Complex free-tier delegation chain, WebLLM, native Rust GGUF, BYOK |
| ARCHITECTURE.md | Three-backend contract: Native Rust / WebLLM / Server |
| Actual repo | `getTextFragment()` returns hardcoded string |

**Resolution:** Hardcoded string stays for now but must be expanded. Text generation is NOT the immediate priority — CI/CD and auth come first. However, LLM providers are identified as "candidates" (not deferred) for future happy-path determination.

**Key decisions:**
- `ServerGenerator` (backend LLM API) and `ChordPracticeGenerator` (chord insertion) are MVP.
- `RandomWordsGenerator` is test-harness-only; uncertain for production.
- `WebLLMGenerator` and local native LLM are deferred — not MVP.
- LLM providers (Zhipu, Groq, DeepSeek, Cerebras, Gemini, Cloudflare, Qwen, OpenRouter) are candidates. Happy path TBD via research.
- Multi-provider delegation chain is advanced configuration, not MVP.
- Chord library history is a new requirement for data model.
- Typing sequence API requires device connection + chord library.

**Updated in:** `frontend/CONTEXT.md` (generator terms split), `backend/CONTEXT.md` (provider candidates, delegation chain marked advanced), `docs/adr/0005-text-generation-llm-integration.md` (created)

---

### E. FSRS / Challenge Point / Spaced Repetition — Deferred; terms moved to archive

| Source | Claim |
|--------|-------|
| PLAN.md | FSRS in shared Rust logic, Challenge Point in backend |
| ARCHITECTURE.md | "Server source of truth" for FSRS scheduling |
| Actual repo | No FSRS code anywhere |

**Resolution:** Entire learning system (FSRS + Challenge Point + all dependent terms) is deferred. Dependency chain:
1. Typing sequence API (receives raw events)
2. Data cleaning (classifies chord vs chentry)
3. FSRS scheduling (needs cleaned chord attempts)
4. Challenge Point (needs real-time latency data)

**Key decisions:**
- All learning system terms removed from `frontend/CONTEXT.md` and `backend/CONTEXT.md`.
- Terms archived in `docs/agents/deferred-terms-archive.md` with dependencies tracked.
- "Lesson queue" concept questioned — may be replaced by granular FSRS rather than explicit lessons.
- "Mastery score" deferred — depends on FSRS + stats aggregation.
- Frontend does not need FSRS/Challenge Point in glossary until frontend participates in the system.
- "Wrapper" concept (from TEST_ARCHITECTURE.md) clarified: a layer around sacred engine that listens for events and aggregates stats. Currently does not exist.

**Updated in:** `frontend/CONTEXT.md` (7 terms removed), `backend/CONTEXT.md` (25+ terms removed), `docs/agents/deferred-terms-archive.md` (created)

---

### F. Event Interface — Sequence-level emission designed; implementation deferred

| Source | Claim |
|--------|-------|
| TEST_ARCHITECTURE.md | Typer should emit `charTyped`, `charDeleted`, `wordCompleted`, `bufferLow`, `sessionStart`, `sessionPause`, `sessionResume`, `sessionComplete` |
| Actual repo | `Typer` class has zero event emission |

**Resolution:** Granular per-character events (`charTyped`, `charDeleted`, `wordCompleted`) are NOT needed for the sequence API and would compromise timing accuracy. Instead, a `SequenceBuilder` module will record per-edit timing directly from `beforeinput` handling and emit sequence-level events only.

**Key decisions:**
- `Typer` will NOT emit granular per-character events.
- `Typer` WILL emit `sequenceComplete` (full sequence data + timing delta) and `bufferLow` events.
- A separate `SequenceBuilder` module handles sequence state, timing, and event emission.
- Timing accuracy preserved by avoiding event dispatch overhead for granular edits.
- Sequence total time vs aggregate edit time delta included for diagnostics.
- Implementation deferred until CI/CD + test harnesses.
- Frontend invariant updated: "It will emit sequence-level events via a separate sequence builder module."
- "Wrapper" terminology abandoned — was never a specific architectural component.

**Updated in:** `frontend/CONTEXT.md` (invariant corrected, new sequence builder terms), `docs/adr/0006-event-interface-design.md` (created)

---

### G. Datastar Version — Resolved (numbering scheme difference; crate kept as planned)

| Source | Claim |
|--------|-------|
| `backend/templates/index.html` | `datastar.js` from CDN `@v1.0.0-RC.8` |
| `backend/Cargo.toml` | `datastar = { version = "0.3", features = ["axum"] }` |

**Resolution:** Versions are compatible — different numbering schemes (CDN = Datastar core version, Cargo = SDK crate version). Both kept, no downgrade. Check for latest crate version and upgrade if available.

**Key decisions:**
- SSE will be used for raw data streaming (LLM-generated text), not just DOM updates.
- `data-ignore-morph` is a valid Datastar directive protecting sacred engine DOM. Should be verified against v1.0 docs when possible.
- `datastar` crate stays in `Cargo.toml` as planned dependency. Backend SSE usage deferred until LLM text generation is implemented.
- Backend currently serves static HTML with CDN Datastar only — no SSE endpoints yet.

**Updated in:** `frontend/CONTEXT.md` (Datastar shell + data-ignore-morph terms), `backend/CONTEXT.md` (Datastar SSE term), `docs/adr/0007-datastar-version-mismatch.md` (created)

---

### H. `data-ignore-morph` on `#typer-display` — Verified in Datastar docs

| Source | Claim |
|--------|-------|
| `backend/templates/index.html` | `<div id="typer-display" data-ignore-morph>` |
| TEST_ARCHITECTURE.md | "Datastar never touches `#typer-display`" |

**Resolution:** `data-ignore-morph` is a valid Datastar directive. Per the Datastar v1.0.1 docs: "Tells the PatchElements watcher to skip processing an element and its children when morphing elements." This enforces sacred engine isolation — Datastar never touches the typer's DOM.

**Key decisions:**
- Directive verified at https://data-star.dev/reference/attributes#data-ignore-morph
- Frontend CONTEXT.md updated with precise definition from docs.

**Updated in:** `frontend/CONTEXT.md` (data-ignore-morph term refined)

---

### I. Multi-context layout — Resolved; shared/ and deferred/ contexts created

| Decision | Rationale |
|----------|-----------|
| I put `frontend/CONTEXT.md` and `backend/CONTEXT.md` | Because the frontend is fairly settled (sacred engine + Datastar shell) while backend is nearly empty and will grow significantly |

**Resolution:** Four-context layout established:
- `frontend/CONTEXT.md` — browser-only concerns (sacred engine, Datastar shell, WebSerial)
- `backend/CONTEXT.md` — server-only concerns (Axum, auth, typing sequence API, data cleaning, LLM proxy)
- `shared/CONTEXT.md` — cross-cutting domain terms (Chord, Typing sequence, data contracts)
- `deferred/CONTEXT.md` — all deferred features (FSRS, Challenge Point, mastery, sync, premium AI, etc.)

**Key decisions:**
- Duplicated terms (Chord, Chord input, Chord output, Chentry, Typing sequence, etc.) moved to `shared/CONTEXT.md`
- `deferred-terms-archive.md` replaced by `deferred/CONTEXT.md` as curated glossary
- Deferred terms in frontend/backend now reference `deferred/CONTEXT.md` instead of inline "Deferred" markers
- `CONTEXT-MAP.md` updated with all four contexts and reading guide

**Updated in:** `shared/CONTEXT.md` (created), `deferred/CONTEXT.md` (created), `frontend/CONTEXT.md` (deduplicated), `backend/CONTEXT.md` (deduplicated), `CONTEXT-MAP.md` (updated), `docs/agents/deferred-terms-archive.md` (superseded)

---

### J. Agents.md vs CLAUDE.md — Renamed to AGENTS.md

| Observation |
|-------------|
| The repo had `Agents.md` (not `AGENTS.md` or `CLAUDE.md`). The skill instructions say "If `CLAUDE.md` exists, edit it. Else if `AGENTS.md` exists, edit it." I edited `Agents.md` because it was the only file present. |

**Resolution:** Renamed `Agents.md` → `AGENTS.md` to match Hermes Agent conventions. The file already contains the agent skill block (added in a previous session).

**Key decisions:**
- `AGENTS.md` is the correct name for Hermes Agent compatibility.
- Not `CLAUDE.md` — that convention is for Claude Code / Claude-specific agents.
- File content unchanged; only the filename was updated.

**Updated in:** `AGENTS.md` (renamed from `Agents.md`)

---

## How to Use This File

- When a topic is grilled and resolved, move it from "Needs Grilling" to "Resolved via Grilling" with the answer.
- When new planning documents arrive, add new items here.
- When CONTEXT.md files are updated, note which items were addressed.
