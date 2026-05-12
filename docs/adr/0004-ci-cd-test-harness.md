# ADR 0004: CI/CD Pipeline + Test Harness Architecture

## Status
Proposed — foundational; blocks auth and API implementation

## Context

The user wants a robust CI/CD pipeline and test harnesses before building auth and the typing sequence API. CI/CD is considered part of the application's architecture — it is not separate. The pipeline must support:

- Frontend (TypeScript/Vite) tests
- Backend (Rust/Axum) tests
- Integration tests (API contracts)
- End-to-end tests (typing engine behavior)

Device connection status is already mostly implemented and will be the first feature tested with the new harness.

## Decision

### 1. CI/CD is architectural, not separate

CI/CD is part of the system architecture. It is a prerequisite for confident development of auth, API, and data pipelines.

### 2. Priority stack

| Order | Track | Rationale |
|-------|-------|-----------|
| 1 | CI/CD + test harnesses | Foundation for everything else |
| 2 | Device connection status | Already mostly implemented; good candidate for testing the harness |
| 3a | Typing sequence API | Core feature; touches CI/CD for API tests |
| 3b | Auth design + anonymous sessions | Near-term priority; touches CI/CD for auth tests |

Tracks 3a and 3b are parallel but both depend on 1 and 2.

### 3. Test harness requirements

- **Unit tests:** Rust (`cargo test`), TypeScript (`vitest` or `bun test`)
- **Integration tests:** API contract tests (HTTP requests/responses), database tests (when sqlx is added)
- **E2E tests:** Browser automation (Playwright or similar) for sacred engine behavior
- **Mocking:** Device connection state, auth state, LLM responses
- **Coverage tracking:** Frontend and backend

### 4. CI/CD pipeline (proposed)

- **Lint:** `cargo clippy`, `cargo fmt`, `tsc --noEmit`, `eslint`
- **Test:** `cargo test`, `bun test`, integration tests
- **Build:** `cargo build --release`, `vp build`
- **Deploy:** (Deferred until hosting is chosen)

### 5. Device connection as first test subject

- Test: Device connected → chord features enabled
- Test: Device disconnected → chord features disabled, prominent connect prompt
- Mock: Serial port API for headless testing

## Consequences

- CI/CD setup blocks auth and API implementation.
- Test harness must support mocking WebSerial API (for device) and auth state.
- E2E tests for the sacred engine are high-value but complex (timing-sensitive DOM manipulation).

## Open Questions

1. Which test runner for TypeScript? (Vitest vs Bun's native test runner)
2. Which E2E framework? (Playwright vs Cypress vs something else)
3. How to mock WebSerial API in CI?
4. Hosting platform for CI/CD? (GitHub Actions, GitLab CI, etc.)
5. Should the backend integration tests use a real SQLite database or an in-memory mock?

## Related

- ADR 0002 — Typing sequence API (depends on test harness)
- ADR 0003 — Auth design (depends on test harness)
- `backend/src/main.rs` — current backend, needs testable structure
- `frontend/src/cc.ts` — device connection, first test subject
