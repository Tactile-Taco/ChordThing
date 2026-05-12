# Backend Context — ChordThing

## Domain Glossary

| Term | Definition |
|------|------------|
| **Chord** | A multi-key press on a CharaChorder device that outputs a word or phrase (e.g., `t+h+e` → "the") |
| **Chord input** | The physical switch combination (e.g., "t+h+e"), stored normalized |
| **Chord output** | The text result (e.g., "the") |
| **Chentry** | A measure of how slow/awkward a word is to type normally (without chord). Factors: keystrokes, finger travel, alternation |
| **LLM delegation chain** | Priority-ordered fallback across free-tier providers: Zhipu → Groq → DeepSeek → Cerebras → Gemini → Cloudflare → Qwen → OpenRouter free → WebLLM → Native Rust → OpenRouter paid. **Advanced configuration, not MVP.** See ADR 0005. |
| **LLM provider candidate** | Potential provider for text generation: Zhipu, Groq, DeepSeek, Cerebras, Gemini, Cloudflare, Qwen, OpenRouter (free/paid). Happy path TBD. See ADR 0005. |
| **Inverted Mad Libs** | LLM text generation technique: insert challenge words into natural text dynamically |
| **Datastar SSE** | Server-Sent Events used for data streaming (e.g., LLM-generated text) from backend to frontend. **Planned** — not yet implemented. Backend currently serves static HTML with CDN Datastar only. See ADR 0007. |
| **Chord library history** | Record of user's chord library over time. Needed for target text generation and chord inference. Typing sequence API requires device connection + chord library. See ADR 0005. |
| **BYOK** | Bring Your Own Key — user-provided API keys for LLM providers |
| **PKCE** | Proof Key for Code Exchange — OAuth flow for third-party API auth (OpenRouter). **Primary use:** OpenRouter OAuth for BYOK. Ory ecosystem may provide PKCE as part of its OAuth2 flow; needs research. Not the primary ChordThing login mechanism. See ADR 0003. |
| **Pooled API** | Our shared API key with per-user rate limits (demo tier). **Deferred** — see `deferred/CONTEXT.md`. |
| **Subscription tier** | Free / Pro ($4.99) / Coach ($9.99) — gates premium server-side AI analysis. **Aspirational** — subject to change. Some cost-recovery mechanism needed for LLM text generation. See ADR 0003. |
| **Premium AI analysis** | Server-side only features: pattern recognition, learning path, predictive difficulty, technique analysis, progress forecast. **Deferred** — see `deferred/CONTEXT.md`. |
| **Anonymous session** | Client-generated persistent ID (`anonymous_id` in `localStorage`). Sent as `X-Anonymous-ID` header. Data migrates to real account on signup/login. See ADR 0003. |
| **Feature affordance** | Matrix of available features based on auth state (anonymous vs logged-in) and device state (connected vs disconnected). See ADR 0003. |
| **Training Data API module** | Dedicated architectural boundary for all training-data operations: typing sequence ingestion, data cleaning, chord attempt logging, mastery state queries, FSRS scheduling queries, bulk sync. **API design in progress (ADR 0002); implementation deferred.** |
| **Hardware capability detection** | Detect WebGPU tier (Web) to recommend local vs cloud LLM. Tauri-specific detection (RAM, CPU, disk, native GPU) deferred until desktop port |
| **App mode** | Currently web-only (browser, WebLLM backend). Tauri desktop (native Rust backend) planned for future after web app is feature-complete |
| **WebGPUTier** | `None` / `Low` (integrated) / `Medium` (entry discrete) / `High` (RTX 3060+) |
| **Free-first strategy** | Exhaust free tiers systematically before paid; prefer smallest (8B) models |
| **Local escalation hierarchy** | Fallback chain when a provider is rate-limited |
| **Session** | A typing activity with start, end, device model, total/correct chars, WPM peak/average. **Note:** The API uses "typing sequences" (contiguous bursts) rather than "sessions." Sessions may be reconstructed from sequences. |
| **Session detail** | Character-level error log: expected vs typed, chord flag, timestamp. **Note:** Chord flag is inferred by backend data cleaning, not sent by frontend. |
| **Typing sequence** | A contiguous burst of typing activity bounded by inactivity (>5s gap, blur, pause, unload). Atomic unit sent to backend. See ADR 0002. |
| **Typing event** | A single input action within a sequence: `insert`, `delete`, `cursor_move`, `blur`, `focus`. Includes timestamp and position. |
| **Sequence boundary** | Criteria that end a typing sequence: >5s gap between events, blur event, pause dialog open, page unload. |
| **Data cleaning** | Backend pipeline that classifies raw typing events into `chord_output`, `chentry`, `device_cleanup`, or `unknown`. See ADR 0002. |
| **Chord inference** | Backend heuristic: multi-char inserts, rapid delete-insert pairs, near-zero inter-key intervals, chord library cross-reference. |
| **Device settings hash** | Hash of CharaChorder settings affecting output behavior (smart window, cleanup mode, etc.). Sent with sequence for context. |
| **Lapse** | A failed review; FSRS adjusts parameters dynamically (unlike SM-2 reset). **Deferred** — see `deferred/CONTEXT.md`. |

## Invariants

- Premium AI analysis is **server-side only** — API keys never ship to client, subscription validated on every call. **Currently unenforceable** — no auth/subscription system yet.
- Text generation (commodity) stays client-side/local/BYOK. AI analysis (value) is server-side and subscription-controlled.
- Free-tier delegation prefers smallest (8B) models.
- Request rate is the bottleneck for short-phrase generation, not token rate.
- Hardware detection determines which local AI options are offered.
- Backend framework is **Axum** (not Salvo). The PLAN.md/ARCHITECTURE.md mention of Salvo is outdated.

## Decisions

See `backend/docs/adr/` for context-specific architectural decisions.
See `docs/adr/` for system-wide decisions.
