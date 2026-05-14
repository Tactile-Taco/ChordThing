# Frontend Context — ChordThing

## Domain Glossary

| Term | Definition |
|------|------------|
| **Chord** | A multi-key press on a CharaChorder device that outputs a word or phrase (e.g., `t+h+e` → "the") |
| **Chord input** | The physical switch combination (e.g., "t+h+e"), stored normalized |
| **Chord output** | The text result (e.g., "the") |
| **Chentry** | A measure of how slow/awkward a word is to type normally (without chord). Factors: keystrokes, finger travel, alternation |
| **Sacred engine** | The imperative typing test core: `beforeinput` handler, cursor-as-ID, `<char>`/`<word>`/`<ruby>` DOM, buffer management. Must not be touched by reactive frameworks |
| **Datastar shell** | The reactive UI layer (menus, stats, settings, chord library) that wraps around the sacred engine. Communicates via events → signals adapter. Will use SSE for data streaming (LLM text). See ADR 0007. |
| **data-ignore-morph** | Datastar directive on `#typer-display` that tells the PatchElements watcher to skip processing the element and its children when morphing. Enforces sacred engine isolation — Datastar never touches the typer's DOM. Verified in Datastar v1.0.1 docs. See ADR 0007. |
| **Cursor-as-ID** | The cursor is not a separate DOM node; it is the `<char>` element with `id="cursor"`. Selection is moved via `selectAllChildren` |
| **Buffer** | The lookahead of untyped characters kept ahead of the cursor. Minimum 800 untyped chars maintained |
| **Fragment** | A chunk of text appended to the buffer. `data-index` is monotonic across fragments via `sessionStorage` counter |
| **WebSerial** | Browser API for USB serial communication with CharaChorder devices |
| **Device Manager CSV** | Import/export format for chord libraries from the official CharaChorder software |
| **Inverted Mad Libs** | LLM text generation technique: insert challenge words into natural text dynamically |
| **BYOK** | Bring Your Own Key — user-provided API keys for LLM providers |
| **Pattern similarity** | Predicting new chord difficulty from historical difficulty of similar chords |
| **Three-backend contract** | Native Rust (Tauri) / WebLLM (browser GPU) / Server (cloud) — text generation must work across all three. Tauri backend is deferred until web app is feature-complete; new features must not preclude a future Tauri port |
| **Sequence builder** | Module that records per-edit timing data from `beforeinput` handling, maintains running sequence state, and emits `sequenceComplete` / `bufferLow` events. Separate from `Typer` to preserve timing accuracy. See ADR 0006. |
| **sequenceComplete event** | Emitted when a typing sequence ends (boundary triggered). Payload: characters entered, backspaces, per-edit timings, total sequence time, aggregate vs measured time delta. See ADR 0006. |
| **bufferLow event** | Emitted when untyped buffer drops below threshold. Payload: current buffer length, requested fill amount. See ADR 0006. |
| **Timing delta** | `sequenceTotalTime - sum(allEditDurations)`. High variance indicates timing system performance issues. Included in `sequenceComplete` payload for diagnostics. See ADR 0006. |
| **Word completion** | Event fired when all characters of a word have been typed |
| **Chord annotation** | `<ruby>`/`<rt>` display showing chord input above chorded words |
| **Test generation mode** | How text is sourced: `"random"`, `"webllm"`, `"server"`, `"chord-practice"` |
| **Hardware capability detection** | Detect WebGPU tier, RAM, CPU to recommend local vs cloud LLM |
| **PKCE** | Proof Key for Code Exchange — OAuth flow for third-party API auth (OpenRouter). Primary use: OpenRouter OAuth for BYOK. Ory may provide PKCE as part of its OAuth2 flow; needs research. Not the primary ChordThing login mechanism. See ADR 0003. |
| **Pooled API** | Our shared API key with per-user rate limits (demo tier). **Deferred** — see `deferred/CONTEXT.md`. |
| **Subscription tier** | Free / Pro ($4.99) / Coach ($9.99) — gates premium server-side AI analysis. **Aspirational** — subject to change. Some cost-recovery mechanism needed for LLM text generation. See ADR 0003. |
| **Premium AI analysis** | Server-side only features: pattern recognition, learning path, predictive difficulty, technique analysis, progress forecast. **Deferred** — see `deferred/CONTEXT.md`. |
| **Anonymous session** | Client-generated persistent ID (`anonymous_id` in `localStorage`). Sent as `X-Anonymous-ID` header. Data migrates to real account on signup/login. See ADR 0003. |
| **Feature affordance** | Matrix of available features based on auth state (anonymous vs logged-in) and device state (connected vs disconnected). See ADR 0003. |
| **Contenteditable** | The `contenteditable="plaintext-only"` container used as a focus target and caret provider; native editing is disabled |
| **Monotonic counter** | `next_char_index` in `sessionStorage` — ensures `data-index` is globally unique and sequential |
| **WrapText / wrapToken** | DOM generation functions that build `<char>`, `<word>`, `<ruby>` hierarchies from text strings |
| **SplitChords** | Generator that uses `phrase_regex_escaped` to identify chorded vs non-chorded text chunks |
| **Phrase regex escaped** | Regex built from chord outputs to detect chordable words in text |
| **Text generator** | Pluggable strategy for sourcing text. **MVP:** `ServerGenerator` (backend LLM API), `ChordPracticeGenerator` (chord insertion). **Test harness:** `RandomWordsGenerator`. **Deferred:** `WebLLMGenerator` (needs WebGPU), local native LLM (needs Tauri). See ADR 0005. |
| **RandomWordsGenerator** | Generates random words for typing tests. **Test harness only** — uncertain for production MVP. |
| **ServerGenerator** | Backend calls LLM APIs to generate text. **MVP.** |
| **ChordPracticeGenerator** | Inserts specific challenge chords into generated text. **MVP.** |
| **WebLLMGenerator** | Runs LLM in browser via WebGPU. **Deferred** — see `deferred/CONTEXT.md`. |
| **LLM provider candidate** | Potential provider for text generation: Zhipu, Groq, DeepSeek, Cerebras, Gemini, Cloudflare, Qwen, OpenRouter (free/paid). Happy path TBD. See ADR 0005. |
| **LLM delegation chain** | Priority-ordered fallback across providers. **Advanced configuration, not MVP.** See ADR 0005. |

## Invariants

- The sacred engine (`typer.ts`, `textRenderer.ts`, `cc.ts`) never reads or writes reactive signals. It will emit sequence-level events (`sequenceComplete`, `bufferLow`) via a separate sequence builder module.
- Datastar never touches `#typer-display` or any `<char>` element.
- `data-index` is monotonic and globally unique within a session.
- `beforeinput` is always cancelled; all input is handled imperatively.
- Paste, drag-and-drop, and composition events are ignored.
- The pause dialog is shown on blur, hidden on focus/click.
- Text generation mode preference: `sessionStorage` → `localStorage` → `"random"`.
- Chord library is stored in `localStorage` (full copy) and synced from server.
- Premium AI analysis is **server-side only** — never trust client for subscription status. **Currently unenforceable** — no auth yet.
- API keys for premium features never ship in client code. **Currently unenforceable** — no premium features yet.
- Text generation (commodity) stays client-side/local/BYOK. AI analysis (value) is server-side and subscription-controlled.
- Backend framework is **Axum** (not Salvo). The PLAN.md/ARCHITECTURE.md mention of Salvo is outdated.

## Decisions

See `docs/adr/` for system-wide decisions.
