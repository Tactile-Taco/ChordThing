# Backend Context — ChordThing

## Domain Glossary

| Term | Definition |
|------|------------|
| **Chord** | A multi-key press on a CharaChorder device that outputs a word or phrase (e.g., `t+h+e` → "the") |
| **Chord input** | The physical switch combination (e.g., "t+h+e"), stored normalized |
| **Chord output** | The text result (e.g., "the") |
| **Chentry** | A measure of how slow/awkward a word is to type normally (without chord). Factors: keystrokes, finger travel, alternation |
| **FSRS** | Free Spaced Repetition Scheduler — long-term retention scheduling (hours/days). Optimized for motor skill acquisition with sub-minute intervals |
| **Challenge Point (CPF)** | Real-time difficulty adaptation based on Coefficient of Variation (CV) in inter-chord latency. Scope: seconds/minutes |
| **CV (Coefficient of Variation)** | `std_dev / mean` of inter-chord latency. `< 0.15` = mastered, `0.15-0.30` = challenge point, `> 0.30` = too hard |
| **IKI (Inter-Key Interval)** | Time between keystrokes; used for baseline calculation |
| **Self-referential baseline** | Each user establishes their own "normal" by typing pangrams for 5-10 minutes |
| **Digraph/Trigraph analysis** | Measuring latency *between* chords, not just per-chord |
| **Spaced repetition queue** | Ordered list of chords due for review, computed by FSRS |
| **Chord mastery** | Per-user per-chord state: hit/miss counts, last practiced, next practice, interval, ease factor, consecutive correct, mastery score |
| **Chord recommendation** | Multi-factor scoring for "which new chord to learn next": word frequency + chentry + pattern similarity + predicted difficulty |
| **Pattern similarity** | Predicting new chord difficulty from historical difficulty of similar chords (shared switches, fingers, output prefix, timing pattern) |
| **Optimal input pattern generation** | For a target word, suggest chord input patterns that minimize finger travel on the user's specific device layout |
| **Device layout** | Per-device switch mapping (CC1, CC Lite, Master Forge). Affects chentry and optimal pattern generation |
| **LLM delegation chain** | Priority-ordered fallback across free-tier providers: Zhipu → Groq → DeepSeek → Cerebras → Gemini → Cloudflare → Qwen → OpenRouter free → WebLLM → Native Rust → OpenRouter paid |
| **Inverted Mad Libs** | LLM text generation technique: insert challenge words into natural text dynamically |
| **BYOK** | Bring Your Own Key — user-provided API keys for LLM providers |
| **PKCE** | Proof Key for Code Exchange — OAuth flow for third-party API auth (OpenRouter) |
| **API proxy pattern** | Frontend calls backend; backend calls LLM provider with stored token. Token never exposed to frontend |
| **Pooled API** | Our shared API key with per-user rate limits (demo tier) |
| **Subscription tier** | Free / Pro ($4.99) / Coach ($9.99) — gates premium server-side AI analysis |
| **Premium AI analysis** | Server-side only features: pattern recognition, learning path, predictive difficulty, technique analysis, progress forecast |
| **Training Data API module** | Dedicated architectural boundary for all training-data operations: session CRUD, chord attempt logging, mastery state queries, FSRS scheduling queries, bulk sync |
| **Server-wins reconciliation** | On sync conflicts, server recalculates from all attempts; client accepts server version |
| **Offline profile** | Settings touched offline use offline value; untouched settings fall back to cached server value. On reconnect, offline profile merges to server (server wins conflicts, offline changes logged as user intent) |
| **Cache policy** | Chord library: full copy (static). Session data: buffer locally, upload append-only batch on reconnect. FSRS due queue: cached, stale acceptable during offline |
| **First-run online required** | Server initializes profile, downloads default chord library, computes initial FSRS scheduling, populates due queue cache |
| **Hardware capability detection** | Detect system RAM, CPU cores, disk space, GPU acceleration (Tauri) or WebGPU tier (Web) to recommend local vs cloud LLM |
| **App mode** | `Tauri` (desktop, native Rust backend) or `Web` (browser, WebLLM backend) |
| **WebGPUTier** | `None` / `Low` (integrated) / `Medium` (entry discrete) / `High` (RTX 3060+) |
| **Free-first strategy** | Exhaust free tiers systematically before paid; prefer smallest (8B) models |
| **8B model preference** | Use Llama 3.1 8B, Mistral 7B — sufficient for natural language, 10-50x faster than typing |
| **Request budgeting** | Track per-hour usage to stay within free-tier limits |
| **Adaptive buffer depth** | Increase generation batch size when API quotas are low |
| **Batch challenge words** | Generate text containing multiple challenge chords in one request instead of one per request |
| **Local escalation hierarchy** | Fallback chain when a provider is rate-limited |
| **Token-to-WPM math** | 200 wpm × 5 chars/word = 1000 chars/min = 250 tokens/min generation rate |
| **125:1 data compression** | Raw keystrokes → structured summaries for premium AI analysis cost control |
| **Pattern bucketing** | Cache strategy for premium AI analysis achieving 85%+ hit rate |
| **Smart model routing** | V3 for speed, R1 for reasoning in premium AI analysis |
| **Usage caps** | 15 calls/day (Pro), 50 calls/day (Coach) for premium AI analysis |
| **Session** | A typing activity with start, end, device model, total/correct chars, WPM peak/average |
| **Session detail** | Character-level error log: expected vs typed, chord flag, timestamp |
| **Lesson queue** | Pre-generated lessons with target chord sets, scheduled by SR algorithm |
| **Mastery score** | Calculated metric combining hit rate, recency, and variance stability |
| **Ease factor** | FSRS parameter (default 2.5) controlling interval growth |
| **Interval** | Time until next review (seconds/minutes for motor skills, not days) |
| **Lapse** | A failed review; FSRS adjusts parameters dynamically (unlike SM-2 reset) |

## Invariants

- Premium AI analysis is **server-side only** — API keys never ship to client, subscription validated on every call.
- Text generation (commodity) stays client-side/local/BYOK. AI analysis (value) is server-side and subscription-controlled.
- Sessions are append-only — no real conflicts on sync.
- Chord mastery: server recalculates from all attempts, client accepts server version.
- Settings: offline profile merges to server on reconnect; server wins conflicts.
- First-run requires internet — server initializes profile and populates cache.
- All training-data operations are isolated in the Training Data API module.
- BYOK keys are encrypted at rest.
- OAuth tokens are encrypted at rest.
- Pooled API quota is tracked per-user.
- Free-tier delegation prefers smallest (8B) models.
- Request rate is the bottleneck for short-phrase generation, not token rate.
- Hardware detection determines which local AI options are offered.
- Backend framework is **Axum** (not Salvo). The PLAN.md/ARCHITECTURE.md mention of Salvo is outdated.

## Decisions

See `backend/docs/adr/` for context-specific architectural decisions.
See `docs/adr/` for system-wide decisions.
