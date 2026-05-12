# ADR 0002: Typing Sequence API Design

## Status
Proposed — pending frontend instrumentation agreement

## Context

The backend needs to receive granular typing data from the frontend for analysis, training, and FSRS scheduling. However, the CharaChorder device's behavior makes raw keystroke data ambiguous:

- **Chord output modes vary by device settings**: Some configurations output the chord result directly; others output the individual keypresses first, then delete and rewrite with the chord result.
- **Smart chording window**: Some settings delay output until the chording window closes, avoiding intermediate characters. Others emit immediately.
- **Failed chord cleanup**: Some settings auto-delete extra keys from failed chord attempts.
- **No explicit chord signal**: The browser receives `beforeinput` events with `insertText` or `deleteContentBackward` — it cannot distinguish "user pressed Backspace" from "device auto-deleted failed chord keys."

This means **raw DOM input events are insufficient** for determining whether the user was chording or using character entry (chentry), and whether backspaces represent user intent or device cleanup.

## Decision

### 1. API receives "typing sequences," not "sessions"

A **typing sequence** is a contiguous burst of typing activity bounded by inactivity. It is the atomic unit sent to the backend.

**Sequence boundary criteria** (proposed):
- Gap of >5 seconds between any two input events
- Blur event (user clicked away)
- Explicit pause dialog open
- Page unload / navigation

A single "session" from the user's perspective may contain multiple sequences.

### 2. Request payload shape

```typescript
interface TypingSequence {
  // Metadata
  sequence_id: string;        // client-generated UUID
  started_at: string;         // ISO 8601
  ended_at: string;           // ISO 8601
  source_text: string;        // the test text that was displayed
  device_model?: string;      // "CC1", "CC Lite", "Master Forge", etc.
  device_settings_hash?: string; // hash of relevant device settings affecting output

  // Granular events
  events: TypingEvent[];
}

interface TypingEvent {
  timestamp: number;          // ms since sequence start, monotonic
  type: 'insert' | 'delete' | 'cursor_move' | 'blur' | 'focus';
  data?: string;              // inserted text (may be 1 char or multi-char chord output)
  position?: number;          // cursor position in source_text (if determinable)
}
```

### 3. Chord detection is deferred to backend data cleaning

The frontend **does not attempt to detect chords**. It sends raw events. The backend's **Training Data module** will run data cleaning pipelines to infer chord usage:

- **Pattern matching**: Multi-character insertions in a single event (e.g., "the" appears in one `insertText`) strongly suggest a chord.
- **Backspace clusters**: Rapid delete-insert pairs (e.g., delete "t+h+e", insert "the") suggest device cleanup of a failed or misconfigured chord.
- **Timing analysis**: Chord outputs typically have near-zero inter-key intervals compared to chentry.
- **Chord library cross-reference**: If the user's chord library contains "the" → `t+h+e`, and "the" appears as a single insert event, mark as chorded.

### 4. Data cleaning pipeline (backend responsibility)

The Training Data module will implement cleaning stages:

1. **Ingest**: Store raw sequences as-is (append-only)
2. **Segment**: Split sequences into "candidate chords" vs "chentry" regions
3. **Classify**: Label each event as `chord_output`, `chentry`, `device_cleanup`, or `unknown`
4. **Derive metrics**: Compute per-word WPM, error rate, chord vs chentry ratio
5. **Feed FSRS**: Cleaned chord attempts feed into FSRS scheduling

### 5. Endpoint design (proposed)

```
POST /api/typing-sequences
Body: TypingSequence
Response: 202 Accepted (async processing)

GET /api/typing-sequences/:id
Response: { sequence: TypingSequence, cleaning_status: 'pending' | 'cleaned' | 'failed' }
```

### 6. Deferred concerns

| Concern | Status | Rationale |
|---------|--------|-----------|
| sqlx / SQLite schema | Deferred | API shape must stabilize first |
| User auth / ownership | Deferred | Sequences will include `user_id` once auth exists |
| Real-time processing | Deferred | Batch async processing is sufficient for now |
| Chord detection ML | Deferred | Heuristic rules sufficient for MVP |

## Consequences

- **Frontend must instrument `Typer` to emit events** with timestamps. Current `Typer` handles input but does not record or emit event streams.
- **Backend must accept and store raw sequences** before cleaning. This means the API layer needs to exist before the cleaning pipeline.
- **Data volume may be high**: A 5-minute typing test at 100 WPM ≈ 500 chars ≈ 500+ events. Compression or batching may be needed later.
- **Chord ambiguity is accepted**: Some events will be classified `unknown`. This is a known limitation, not a bug.

## Open Questions

1. Should the frontend buffer sequences locally and sync on reconnect, or require online submission?
2. What is the exact device settings hash? (Which settings affect output?)
3. Should `cursor_move` include arrow-key navigation, or only implicit cursor changes from insert/delete?
4. How do we handle paste events? (Currently ignored by `Typer`.)

## Related

- `frontend/src/typer.ts` — sacred engine, needs event instrumentation
- `backend/CONTEXT.md` — Training Data API module glossary
- ADR 0001 (future) — Database schema for typing sequences
