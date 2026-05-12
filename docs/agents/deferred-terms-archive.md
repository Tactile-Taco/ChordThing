# Deferred Terms Archive

This file tracks terms removed from CONTEXT.md files because their dependencies are not yet met. When dependencies are fulfilled, terms can be moved back into the relevant CONTEXT.md.

## How to Use

When a term's dependencies are met:
1. Move the term from this file back into the relevant CONTEXT.md
2. Update the "Dependencies" column to reflect the new status
3. Remove the term from this archive once it's active

---

## Frontend Context — Deferred Terms

| Term | Definition | Dependencies | Expected Return |
|------|------------|--------------|-----------------|
| **Challenge Point** | Real-time difficulty adaptation based on Coefficient of Variation (CV) in inter-chord latency | Typing sequence API + data cleaning + event emission | When challenge point system is designed |
| **FSRS** | Free Spaced Repetition Scheduler — long-term retention scheduling (hours/days) | Typing sequence API + data cleaning + backend FSRS implementation | When FSRS is implemented |
| **Session stats** | WPM, accuracy, error count — aggregated from `charTyped` events by the wrapper | Event interface (wrapper) + typing sequence API + data cleaning | When wrapper/stats aggregation exists |
| **Event interface** | `charTyped`, `charDeleted`, `wordCompleted`, `bufferLow`, `sessionStart`, `sessionPause`, `sessionResume`, `sessionComplete` | Wrapper around sacred engine | When Typer emits events and wrapper aggregates |
| **Local escalation hierarchy** | Fallback chain when a provider is rate-limited: Groq → Cerebras → Gemini → Cloudflare → WebLLM → Native Rust → template fallback | Multi-provider LLM integration | When delegation chain is implemented |
| **Free-first delegation** | Exhaust free tiers systematically before paid; prefer smallest (8B) models | Multi-provider LLM integration | When delegation chain is implemented |
| **8B model preference** | Use Llama 3.1 8B, Mistral 7B — sufficient for natural language, 10-50x faster than typing | LLM integration | When LLM providers are integrated |
| **Adaptive buffer depth** | Increase generation batch size when API quotas are low | LLM integration + rate limiting | When LLM integration exists |
| **Request budgeting** | Track per-hour usage to stay within free-tier limits | LLM integration + user accounts | When LLM integration + auth exists |

---

## Backend Context — Deferred Terms

| Term | Definition | Dependencies | Expected Return |
|------|------------|--------------|-----------------|
| **FSRS** | Free Spaced Repetition Scheduler — long-term retention scheduling (hours/days). Optimized for motor skill acquisition with sub-minute intervals | Typing sequence API + data cleaning + database | When FSRS scheduling is implemented |
| **Challenge Point (CPF)** | Real-time difficulty adaptation based on Coefficient of Variation (CV) in inter-chord latency. Scope: seconds/minutes | Cleaned typing sequences + real-time processing | When CPF system is implemented |
| **CV (Coefficient of Variation)** | `std_dev / mean` of inter-chord latency. `< 0.15` = mastered, `0.15-0.30` = challenge point, `> 0.30` = too hard | Cleaned typing sequences | When CPF system is implemented |
| **IKI (Inter-Key Interval)** | Time between keystrokes; used for baseline calculation | Cleaned typing sequences | When baseline calculation exists |
| **Self-referential baseline** | Each user establishes their own "normal" by typing pangrams for 5-10 minutes | Cleaned typing sequences + user accounts | When baseline system is implemented |
| **Digraph/Trigraph analysis** | Measuring latency *between* chords, not just per-chord | Cleaned typing sequences + chord inference | When analysis pipeline exists |
| **Spaced repetition queue** | Ordered list of chords due for review, computed by FSRS | FSRS implementation + database | When FSRS is implemented |
| **Chord mastery** | Per-user per-chord state: hit/miss counts, last practiced, next practice, interval, ease factor, consecutive correct, mastery score | FSRS + database + user accounts | When mastery tracking exists |
| **Chord recommendation** | Multi-factor scoring for "which new chord to learn next": word frequency + chentry + pattern similarity + predicted difficulty | Chord mastery + pattern similarity | When recommendation engine exists |
| **Pattern similarity** | Predicting new chord difficulty from historical difficulty of similar chords (shared switches, fingers, output prefix, timing pattern) | Chord mastery + historical data | When recommendation engine exists |
| **Optimal input pattern generation** | For a target word, suggest chord input patterns that minimize finger travel on the user's specific device layout | Device layout data + algorithm | When pattern generation exists |
| **Device layout** | Per-device switch mapping (CC1, CC Lite, Master Forge). Affects chentry and optimal pattern generation | Device configuration API | When device config is implemented |
| **Lesson queue** | Pre-generated lessons with target chord sets, scheduled by SR algorithm | FSRS + lesson generation | When lesson system is designed (may be replaced by granular FSRS) |
| **Mastery score** | Calculated metric combining hit rate, recency, and variance stability | Chord mastery + stats aggregation | When mastery tracking exists |
| **Ease factor** | FSRS parameter (default 2.5) controlling interval growth | FSRS implementation | When FSRS is implemented |
| **Interval** | Time until next review (seconds/minutes for motor skills, not days) | FSRS implementation | When FSRS is implemented |
| **Lapse** | A failed review; FSRS adjusts parameters dynamically (unlike SM-2 reset) | FSRS implementation | When FSRS is implemented |
| **Server-wins reconciliation** | On sync conflicts, server recalculates from all attempts; client accepts server version | Sync mechanism + database | When sync is implemented |
| **Offline profile** | Settings touched offline use offline value; untouched settings fall back to cached server value. On reconnect, offline profile merges to server (server wins conflicts, offline changes logged as user intent) | Offline sync + database | When offline sync is implemented |
| **Cache policy** | Chord library: full copy (static). Session data: buffer locally, upload append-only batch on reconnect. FSRS due queue: cached, stale acceptable during offline | Server-side storage + sync | When server-side storage exists |
| **First-run online required** | Server initializes profile, downloads default chord library, computes initial FSRS scheduling, populates due queue cache | Server-side profile + FSRS | When server-side profile exists |
| **BYOK keys encrypted at rest** | BYOK keys are encrypted at rest | BYOK storage system | When BYOK is implemented |
| **OAuth tokens encrypted at rest** | OAuth tokens are encrypted at rest | OAuth integration | When OAuth is implemented |
| **Pooled API quota** | Pooled API quota is tracked per-user | Pooled API infrastructure | When pooled API exists |
| **125:1 data compression** | Raw keystrokes → structured summaries for premium AI analysis cost control | Premium AI analysis pipeline | When premium AI exists |
| **Pattern bucketing** | Cache strategy for premium AI analysis achieving 85%+ hit rate | Premium AI analysis pipeline | When premium AI exists |
| **Smart model routing** | V3 for speed, R1 for reasoning in premium AI analysis | Premium AI analysis pipeline | When premium AI exists |
| **Usage caps** | 15 calls/day (Pro), 50 calls/day (Coach) for premium AI analysis | Subscription system + premium AI | When subscription system exists |
| **Token-to-WPM math** | 200 wpm × 5 chars/word = 1000 chars/min = 250 tokens/min generation rate | LLM integration + text generation | When LLM integration exists |
| **Batch challenge words** | Generate text containing multiple challenge chords in one request instead of one per request | ChordPracticeGenerator + LLM integration | When ChordPracticeGenerator exists |

---

## Cross-Cutting Dependencies

| Dependency | Blocks These Terms |
|------------|-------------------|
| Typing sequence API | Session stats, Event interface, FSRS, Challenge Point, CV, IKI, Self-referential baseline, Digraph/Trigraph analysis |
| Data cleaning | FSRS, Challenge Point, CV, IKI, Self-referential baseline, Digraph/Trigraph analysis, Chord mastery |
| Event emission (wrapper) | Session stats, Event interface |
| Database (sqlx/SQLite) | FSRS, Spaced repetition queue, Chord mastery, Server-wins reconciliation, Offline profile, Cache policy, First-run online required |
| User accounts / auth | Chord mastery, Self-referential baseline, Request budgeting, Pooled API quota, Usage caps |
| LLM integration | Local escalation hierarchy, Free-first delegation, 8B model preference, Adaptive buffer depth, Request budgeting, Token-to-WPM math, Batch challenge words |
| FSRS implementation | Spaced repetition queue, Chord mastery, Lesson queue, Mastery score, Ease factor, Interval, Lapse, Cache policy, First-run online required |
| Premium AI analysis | 125:1 data compression, Pattern bucketing, Smart model routing, Usage caps |
| Subscription system | Usage caps, Subscription tier enforcement |
