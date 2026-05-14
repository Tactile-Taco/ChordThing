# Deferred Context — ChordThing

Features and concepts deferred until dependencies are met. These are not actively being worked on but are part of the long-term architecture.

## How to Use This File

When a deferred feature's dependencies are met:
1. Move the relevant terms to `frontend/CONTEXT.md`, `backend/CONTEXT.md`, or `shared/CONTEXT.md`
2. Update the dependency status
3. Remove the term from this file once it's active

---

## Learning System (FSRS + Challenge Point)

| Term | Definition | Dependencies |
|------|------------|--------------|
| **FSRS** | Free Spaced Repetition Scheduler — long-term retention scheduling (hours/days). Optimized for motor skill acquisition with sub-minute intervals | Typing sequence API + data cleaning + database |
| **Challenge Point (CPF)** | Real-time difficulty adaptation based on Coefficient of Variation (CV) in inter-chord latency. Scope: seconds/minutes | Cleaned typing sequences + real-time processing |
| **CV (Coefficient of Variation)** | `std_dev / mean` of inter-chord latency. `< 0.15` = mastered, `0.15-0.30` = challenge point, `> 0.30` = too hard | Cleaned typing sequences |
| **IKI (Inter-Key Interval)** | Time between keystrokes; used for baseline calculation | Cleaned typing sequences |
| **Self-referential baseline** | Each user establishes their own "normal" by typing pangrams for 5-10 minutes | Cleaned typing sequences + user accounts |
| **Digraph/Trigraph analysis** | Measuring latency *between* chords, not just per-chord | Cleaned typing sequences + chord inference |
| **Spaced repetition queue** | Ordered list of chords due for review, computed by FSRS | FSRS implementation + database |
| **Chord mastery** | Per-user per-chord state: hit/miss counts, last practiced, next practice, interval, ease factor, consecutive correct, mastery score | FSRS + database + user accounts |
| **Chord recommendation** | Multi-factor scoring for "which new chord to learn next": word frequency + chentry + pattern similarity + predicted difficulty | Chord mastery + pattern similarity |
| **Pattern similarity** | Predicting new chord difficulty from historical difficulty of similar chords (shared switches, fingers, output prefix, timing pattern) | Chord mastery + historical data |
| **Optimal input pattern generation** | For a target word, suggest chord input patterns that minimize finger travel on the user's specific device layout | Device layout data + algorithm |
| **Device layout** | Per-device switch mapping (CC1, CC Lite, Master Forge). Affects chentry and optimal pattern generation | Device configuration API |
| **Lesson queue** | Pre-generated lessons with target chord sets, scheduled by SR algorithm | FSRS + lesson generation |
| **Mastery score** | Calculated metric combining hit rate, recency, and variance stability | Chord mastery + stats aggregation |
| **Ease factor** | FSRS parameter (default 2.5) controlling interval growth | FSRS implementation |
| **Interval** | Time until next review (seconds/minutes for motor skills, not days) | FSRS implementation |
| **Lapse** | A failed review; FSRS adjusts parameters dynamically (unlike SM-2 reset) | FSRS implementation |

## Sync / Offline

| Term | Definition | Dependencies |
|------|------------|--------------|
| **Server-wins reconciliation** | On sync conflicts, server recalculates from all attempts; client accepts server version | Sync mechanism + database |
| **Offline profile** | Settings touched offline use offline value; untouched settings fall back to cached server value. On reconnect, offline profile merges to server (server wins conflicts, offline changes logged as user intent) | Offline sync + database |
| **Cache policy** | Chord library: full copy (static). Session data: buffer locally, upload append-only batch on reconnect. FSRS due queue: cached, stale acceptable during offline | Server-side storage + sync |
| **First-run online required** | Server initializes profile, downloads default chord library, computes initial FSRS scheduling, populates due queue cache | Server-side profile + FSRS |

## Premium / Subscription

| Term | Definition | Dependencies |
|------|------------|--------------|
| **Premium AI analysis** | Server-side only features: pattern recognition, learning path, predictive difficulty, technique analysis, progress forecast | Auth + subscription infrastructure |
| **Pooled API** | Our shared API key with per-user rate limits (demo tier) | Pooled API infrastructure |
| **125:1 data compression** | Raw keystrokes → structured summaries for premium AI analysis cost control | Premium AI analysis pipeline |
| **Pattern bucketing** | Cache strategy for premium AI analysis achieving 85%+ hit rate | Premium AI analysis pipeline |
| **Smart model routing** | V3 for speed, R1 for reasoning in premium AI analysis | Premium AI analysis pipeline |
| **Usage caps** | 15 calls/day (Pro), 50 calls/day (Coach) for premium AI analysis | Subscription system + premium AI |

## LLM (Advanced)

| Term | Definition | Dependencies |
|------|------------|--------------|
| **WebLLMGenerator** | Runs LLM in browser via WebGPU. Deferred — not MVP | WebGPU + hardware detection |
| **Local escalation hierarchy** | Fallback chain when a provider is rate-limited: Groq → Cerebras → Gemini → Cloudflare → WebLLM → Native Rust → template fallback | Multi-provider LLM integration |
| **Free-first delegation** | Exhaust free tiers systematically before paid; prefer smallest (8B) models | Multi-provider LLM integration |
| **8B model preference** | Use Llama 3.1 8B, Mistral 7B — sufficient for natural language, 10-50x faster than typing | LLM integration |
| **Adaptive buffer depth** | Increase generation batch size when API quotas are low | LLM integration + rate limiting |
| **Request budgeting** | Track per-hour usage to stay within free-tier limits | LLM integration + user accounts |
| **Token-to-WPM math** | 200 wpm × 5 chars/word = 1000 chars/min = 250 tokens/min generation rate | LLM integration + text generation |
| **Batch challenge words** | Generate text containing multiple challenge chords in one request instead of one per request | ChordPracticeGenerator + LLM integration |

## Frontend Events (Granular)

| Term | Definition | Dependencies |
|------|------------|--------------|
| **Session stats** | WPM, accuracy, error count — aggregated from `charTyped` events by the wrapper | Event interface (wrapper) + typing sequence API + data cleaning |
| **Event interface** | `charTyped`, `charDeleted`, `wordCompleted`, `bufferLow`, `sessionStart`, `sessionPause`, `sessionResume`, `sessionComplete` | Wrapper around sacred engine |

## Auth / Security (Deferred)

| Term | Definition | Dependencies |
|------|------------|--------------|
| **BYOK keys encrypted at rest** | BYOK keys are encrypted at rest | BYOK storage system |
| **OAuth tokens encrypted at rest** | OAuth tokens are encrypted at rest | OAuth integration |
| **Pooled API quota** | Pooled API quota is tracked per-user | Pooled API infrastructure |

## Tauri / Desktop

| Term | Definition | Dependencies |
|------|------------|--------------|
| **Tauri backend** | Native Rust desktop backend. Deferred until web app is feature-complete | Web app feature-complete |
| **Hardware capability detection (Tauri)** | Detect system RAM, CPU cores, disk space, GPU acceleration for local LLM recommendation | Tauri desktop port |
