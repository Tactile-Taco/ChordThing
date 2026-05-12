# Frontend Context — ChordThing

## Domain Glossary

| Term | Definition |
|------|------------|
| **Chord** | A multi-key press on a CharaChorder device that outputs a word or phrase (e.g., `t+h+e` → "the") |
| **Chord input** | The physical switch combination (e.g., "t+h+e"), stored normalized |
| **Chord output** | The text result (e.g., "the") |
| **Chentry** | A measure of how slow/awkward a word is to type normally (without chord). Factors: keystrokes, finger travel, alternation |
| **Sacred engine** | The imperative typing test core: `beforeinput` handler, cursor-as-ID, `<char>`/`<word>`/`<ruby>` DOM, buffer management. Must not be touched by reactive frameworks |
| **Datastar shell** | The reactive UI layer (menus, stats, settings, chord library) that wraps around the sacred engine. Communicates via events → signals adapter |
| **Cursor-as-ID** | The cursor is not a separate DOM node; it is the `<char>` element with `id="cursor"`. Selection is moved via `selectAllChildren` |
| **Buffer** | The lookahead of untyped characters kept ahead of the cursor. Minimum 800 untyped chars maintained |
| **Fragment** | A chunk of text appended to the buffer. `data-index` is monotonic across fragments via `sessionStorage` counter |
| **Challenge Point** | Real-time difficulty adaptation based on Coefficient of Variation (CV) in inter-chord latency |
| **FSRS** | Free Spaced Repetition Scheduler — long-term retention scheduling (hours/days) |
| **WebSerial** | Browser API for USB serial communication with CharaChorder devices |
| **Device Manager CSV** | Import/export format for chord libraries from the official CharaChorder software |
| **Inverted Mad Libs** | LLM text generation technique: insert challenge words into natural text dynamically |
| **BYOK** | Bring Your Own Key — user-provided API keys for LLM providers |
| **Pattern similarity** | Predicting new chord difficulty from historical difficulty of similar chords |
| **Three-backend contract** | Native Rust (Tauri) / WebLLM (browser GPU) / Server (cloud) — text generation must work across all three |
| **Typing session** | A continuous typing activity with start, pause/resume (blur/focus), and completion events |
| **Word completion** | Event fired when all characters of a word have been typed |
| **Chord annotation** | `<ruby>`/`<rt>` display showing chord input above chorded words |
| **Test generation mode** | How text is sourced: `"random"`, `"webllm"`, `"server"`, `"chord-practice"` |
| **Hardware capability detection** | Detect WebGPU tier, RAM, CPU to recommend local vs cloud LLM |
| **PKCE** | Proof Key for Code Exchange — OAuth flow for third-party API auth (OpenRouter) |
| **Pooled API** | Our shared API key with per-user rate limits (demo tier) |
| **Subscription tier** | Free / Pro ($4.99) / Coach ($9.99) — gates premium server-side AI analysis |
| **Premium AI analysis** | Server-side only features: pattern recognition, learning path, predictive difficulty, technique analysis, progress forecast |
| **Contenteditable** | The `contenteditable="plaintext-only"` container used as a focus target and caret provider; native editing is disabled |
| **Monotonic counter** | `next_char_index` in `sessionStorage` — ensures `data-index` is globally unique and sequential |
| **WrapText / wrapToken** | DOM generation functions that build `<char>`, `<word>`, `<ruby>` hierarchies from text strings |
| **SplitChords** | Generator that uses `phrase_regex_escaped` to identify chorded vs non-chorded text chunks |
| **Phrase regex escaped** | Regex built from chord outputs to detect chordable words in text |
| **Session stats** | WPM, accuracy, error count — aggregated from `charTyped` events by the wrapper |
| **Event interface** | `charTyped`, `charDeleted`, `wordCompleted`, `bufferLow`, `sessionStart`, `sessionPause`, `sessionResume`, `sessionComplete` |
| **Text generator** | Pluggable strategy for sourcing text: `RandomWordsGenerator`, `WebLLMGenerator`, `ServerGenerator`, `ChordPracticeGenerator` |
| **Adaptive buffer depth** | Increase generation batch size when API quotas are low |
| **Request budgeting** | Track per-hour usage to stay within free-tier limits |
| **Local escalation hierarchy** | Fallback chain when a provider is rate-limited: Groq → Cerebras → Gemini → Cloudflare → WebLLM → Native Rust → template fallback |
| **Free-first delegation** | Exhaust free tiers systematically before paid; prefer smallest (8B) models |
| **8B model preference** | Use Llama 3.1 8B, Mistral 7B — sufficient for natural language, 10-50x faster than typing |

## Invariants

- The sacred engine (`typer.ts`, `textRenderer.ts`, `cc.ts`) never reads or writes reactive signals. It emits events.
- Datastar never touches `#typer-display` or any `<char>` element.
- `data-index` is monotonic and globally unique within a session.
- `beforeinput` is always cancelled; all input is handled imperatively.
- Paste, drag-and-drop, and composition events are ignored.
- The pause dialog is shown on blur, hidden on focus/click.
- Text generation mode preference: `sessionStorage` → `localStorage` → `"random"`.
- Chord library is stored in `localStorage` (full copy) and synced from server.
- Premium AI analysis is **server-side only** — never trust client for subscription status.
- API keys for premium features never ship in client code.
- Text generation (commodity) stays client-side/local/BYOK. AI analysis (value) is server-side and subscription-controlled.
- Backend framework is **Axum** (not Salvo). The PLAN.md/ARCHITECTURE.md mention of Salvo is outdated.

## Decisions

See `frontend/docs/adr/` for context-specific architectural decisions.
See `docs/adr/` for system-wide decisions.
