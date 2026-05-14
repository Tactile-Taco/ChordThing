# ADR 0003: Auth Design — Anonymous Sessions + Ory Integration

## Status
Proposed — pending CI/CD and test harness setup

## Context

The app needs to support both anonymous and authenticated users from early in development. Auth is not fully deferred — it is a near-term priority, but it depends on CI/CD and test harnesses being in place first.

Key constraints:
- Anonymous users must have a persistent identity (client-generated ID) so preliminary data can be retained and migrated to a real account later.
- Device connection and auth are independent feature filters — both affect what features are available.
- Subscription tiers are aspirational and subject to change, but some cost-recovery mechanism is needed for LLM-generated text.
- PKCE is primarily for OpenRouter OAuth (third-party LLM provider auth), not necessarily for ChordThing's own login flow. Ory ecosystem may provide PKCE as part of its integration.

## Decision

### 1. Auth is NOT deferred — it is next-after-CI/CD

Auth design and anonymous session implementation follow immediately after:
1. CI/CD pipeline + test harnesses
2. Device connection status (already mostly implemented; good test harness candidate)

Then parallel tracks:
3. Typing sequence API design + implementation
4. Auth API design + anonymous session implementation

### 2. Anonymous sessions

- Client generates a persistent `anonymous_id` (UUID) stored in `localStorage`.
- Sent with every API request as header `X-Anonymous-ID`.
- Backend accepts anonymous sequences, stores them keyed by `anonymous_id`.
- On account creation/login, backend migrates anonymous data to the new user account.
- Anonymous users see: LLM-generated text (with rate limits), basic typing test, device connection prompt.
- Anonymous users do NOT see: chord library sync, FSRS scheduling, premium AI analysis, subscription features.

### 3. Logged-in sessions (Ory ecosystem)

- Ory Kratos for identity management (login/signup/password reset).
- Ory Hydra for OAuth2/OIDC if needed (PKCE support).
- Session tokens (JWT or opaque) managed by Ory, validated by backend middleware.
- Backend stores `user_id` in sequences once authenticated.
- Subscription tier checked on every premium API call.

### 4. Feature affordance matrix

| Feature | Anonymous | Logged-in (Free) | Logged-in (Pro/Coach) |
|---------|-----------|------------------|----------------------|
| LLM text generation | Limited | Limited | Higher limits |
| Device connection | Yes | Yes | Yes |
| Chord library | `localStorage` only | Synced | Synced |
| Typing sequences | Stored, migratable | Stored | Stored |
| FSRS scheduling | No | Yes | Yes |
| Premium AI analysis | No | No | Yes |

### 5. PKCE usage

- PKCE is for OpenRouter OAuth (users connecting their own API keys).
- Ory may provide PKCE as part of its OAuth2 flow; this needs research.
- PKCE is NOT the primary auth mechanism for ChordThing accounts.

### 6. Subscription tiers (aspirational)

- Free / Pro ($4.99) / Coach ($9.99) — gates premium server-side AI analysis.
- Tiers are subject to change; do not hardcode pricing in client.
- Subscription validation happens server-side on every premium call.
- Some cost-recovery mechanism is needed for LLM text generation even at Free tier.

## Consequences

- Anonymous session support adds complexity: migration path, data retention policies, rate limiting.
- Ory integration is a significant dependency; need to evaluate self-hosted vs cloud.
- Device connection status and auth are independent filters — UI must handle all combinations (anon+connected, anon+disconnected, auth+connected, auth+disconnected).
- Test harnesses must support mocking both auth states and device states.

## Open Questions

1. Self-hosted Ory or Ory Cloud?
2. What is the anonymous data retention policy? (e.g., purge after 30 days?)
3. How does anonymous-to-authenticated migration work exactly? (Merge vs replace?)
4. What are the LLM rate limits per tier?
5. Does Ory Hydra provide PKCE out of the box for OpenRouter integration?

## Related

- ADR 0002 — Typing sequence API (depends on auth for user association)
- `backend/CONTEXT.md` — auth glossary terms
- `frontend/CONTEXT.md` — subscription tier, PKCE terms
