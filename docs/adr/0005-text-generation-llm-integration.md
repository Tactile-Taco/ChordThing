# ADR 0005: Text Generation + LLM Integration

## Status
Proposed

## Context

The app needs text generation for typing tests. Currently `getTextFragment()` returns a short hardcoded string. The UI has radio buttons for "Random words", "Local LLM", and "Remote LLM" — but only "Random words" works (and it's hardcoded).

## Decision

### 1. Hardcoded string stays for now, but must be larger

The hardcoded string in `getTextFragment()` is preliminary mock data. It should be made significantly larger (at least a few paragraphs) to enable meaningful typing sequence testing. This is a temporary measure until real text generation is implemented.

### 2. Text generator priority (MVP vs deferred)

| Generator | Status | Rationale |
|-----------|--------|-----------|
| `ServerGenerator` | **MVP** | Backend calls LLM APIs. Primary text source for production. |
| `ChordPracticeGenerator` | **MVP** | Inserts specific chords into text for deliberate practice. |
| `RandomWordsGenerator` | **Test harness only** | Useful for mocking in tests. Uncertain for production MVP. |
| `WebLLMGenerator` | **Deferred** | Requires WebGPU + hardware detection. Not MVP. |
| Local LLM (native) | **Deferred** | Requires Tauri desktop port. Not MVP. |

### 3. LLM providers are "candidates," not deferred

The following providers are candidates for the happy path. Free-tier viability needs research:

- Zhipu
- Groq
- DeepSeek
- Cerebras
- Gemini
- Cloudflare
- Qwen
- OpenRouter (free tier)
- OpenRouter (paid/BYOK)

**Configuration for multiple providers is advanced, not MVP.** The MVP should have a single happy-path provider with BYOK support. Advanced users can configure fallbacks later.

### 4. Remote LLM radio button — early design, subject to refactor

The "Remote LLM" radio button in the UI is unfinished. It may be refactored into:
- A PKCE auth trigger (connect OpenRouter via OAuth)
- A remote LLM toggle (enable/disable server-side generation)
- Or removed entirely in favor of a settings panel

**No action until auth design is finalized.**

### 5. Chord library record for analysis

A record of the user's chord library over time must be kept. The chord library affects:
- Target text generation (which words are chorded)
- Chord inference in data cleaning (was this input chorded?)
- Typing sequence API activation (no device connected = no chord library = no analysis)

**Typing sequence API should not activate if the user has not connected their device.** This is a feature filter (see ADR 0003 feature affordance matrix).

### 6. Chord input detection via chord library history

Chord usage can be inferred by comparing user input against their historical chord library. If a word was in their chord library at the time of typing, and the input matches the chord output pattern, it was likely chorded.

## Consequences

- Hardcoded string must be expanded soon (temporary).
- ServerGenerator is the first real implementation target.
- LLM provider research is needed to determine the happy path.
- Chord library versioning/history is a new requirement for the data model.
- Typing sequence API has a precondition: device must be connected.

## Open Questions

1. Which provider is the happy path? (Needs research: rate limits, latency, cost, quality)
2. How large should the hardcoded string be? (Enough for 1-2 minutes of typing at 100 WPM?)
3. Should RandomWordsGenerator be part of production or only tests?
4. How is chord library history stored and versioned?
5. What happens if a user connects their device mid-sequence?

## Related

- ADR 0002 — Typing sequence API (depends on text generation)
- ADR 0003 — Auth design (affects remote LLM / BYOK flow)
- ADR 0004 — CI/CD test harness (RandomWordsGenerator for mocking)
- `frontend/src/typer.ts` — `getTextFragment()` needs expansion
- `frontend/index.html` — radio buttons subject to refactor
