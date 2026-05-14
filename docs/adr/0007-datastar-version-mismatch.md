# ADR 0007: Datastar Version Mismatch

## Status
Resolved

## Context

The backend has a Datastar version mismatch:
- CDN: `datastar.js` from `@v1.0.0-RC.8`
- Cargo crate: `datastar = { version = "0.3", features = ["axum"] }`

The `datastar` crate is in `Cargo.toml` but unused in `main.rs`. The backend currently serves static HTML with CDN Datastar, with no SSE endpoints.

## Decision

### 1. Versions are compatible (different numbering schemes)

The Cargo crate version (0.3) and CDN version (v1.0.0-RC.8) use different numbering schemes. The crate is the SDK version, not the Datastar core version. Both are kept — no downgrade.

**Action:** Check for latest `datastar` crate version and upgrade if available.

### 2. SSE will be used for raw data (LLM-generated text)

Datastar SSE is not just for DOM updates — it can stream raw data. The backend will use Datastar SSE to supply LLM-generated typing test text to the frontend. This is a planned feature, not yet implemented.

### 3. `data-ignore-morph` is a valid Datastar directive

The `data-ignore-morph` attribute on `#typer-display` is a Datastar directive that prevents morphing on that element. This enforces the sacred engine isolation: Datastar never touches the typer's DOM. The sacred engine handles its own rendering for maximum performance.

**Note:** This should be verified against Datastar v1.0 documentation when possible.

### 4. `datastar` crate stays as planned dependency

The `datastar` crate remains in `Cargo.toml` as a planned dependency. Backend SSE usage is deferred until LLM text generation is implemented, but the crate is not removed.

## Consequences

- Version mismatch is accepted as a numbering scheme difference, not a compatibility issue.
- `datastar` crate stays in `Cargo.toml` even though currently unused.
- SSE will be used for data streaming (LLM text), not just DOM updates.
- `data-ignore-morph` protects sacred engine DOM from Datastar morphing.

## Open Questions

1. What is the latest `datastar` crate version? Should we upgrade?
2. Confirm `data-ignore-morph` is valid in Datastar v1.0.0-RC.8 documentation.

## Related

- `backend/templates/index.html` — CDN Datastar + `data-ignore-morph`
- `backend/Cargo.toml` — `datastar` crate
- ADR 0005 — Text generation / LLM integration (consumer of SSE)
