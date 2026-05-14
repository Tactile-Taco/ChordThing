# Shared Context — ChordThing

Domain terms and data contracts used across frontend, backend, and (future) Tauri desktop.

## Domain Glossary

| Term | Definition |
|------|------------|
| **Chord** | A multi-key press on a CharaChorder device that outputs a word or phrase (e.g., `t+h+e` → "the") |
| **Chord input** | The physical switch combination (e.g., "t+h+e"), stored normalized |
| **Chord output** | The text result (e.g., "the") |
| **Chentry** | A measure of how slow/awkward a word is to type normally (without chord). Factors: keystrokes, finger travel, alternation |
| **Typing sequence** | A contiguous burst of typing activity bounded by inactivity (>5s gap, blur, pause, unload). Atomic unit sent to backend. See ADR 0002. |
| **Typing event** | A single input action within a sequence: `insert`, `delete`, `cursor_move`, `blur`, `focus`. Includes timestamp and position. |
| **Sequence boundary** | Criteria that end a typing sequence: >5s gap between events, blur event, pause dialog open, page unload. |
| **Session** | A typing activity with start, end, device model, total/correct chars, WPM peak/average. **Note:** The API uses "typing sequences" (contiguous bursts) rather than "sessions." Sessions may be reconstructed from sequences. |
| **Session detail** | Character-level error log: expected vs typed, chord flag, timestamp. **Note:** Chord flag is inferred by backend data cleaning, not sent by frontend. |

## Data Contracts

### TypingSequence (API payload)

```typescript
interface TypingSequence {
  sequence_id: string;        // client-generated UUID
  started_at: string;         // ISO 8601
  ended_at: string;           // ISO 8601
  source_text: string;        // the test text that was displayed
  device_model?: string;      // "CC1", "CC Lite", "Master Forge"
  device_settings_hash?: string;
  events: TypingEvent[];
}

interface TypingEvent {
  timestamp: number;          // ms since sequence start, monotonic
  type: 'insert' | 'delete' | 'cursor_move' | 'blur' | 'focus';
  data?: string;              // inserted text
  position?: number;          // cursor position in source_text
}
```

### SequenceComplete Event Payload

```typescript
interface SequenceCompletePayload {
  sequence: TypingSequence;
  timingDelta: number;        // sequenceTotalTime - sum(allEditDurations)
}
```

## Invariants

- `data-index` is monotonic and globally unique within a session.
- Text generation (commodity) stays client-side/local/BYOK. AI analysis (value) is server-side and subscription-controlled.
- Backend framework is **Axum** (not Salvo). The PLAN.md/ARCHITECTURE.md mention of Salvo is outdated.

## Decisions

See `docs/adr/` for system-wide decisions.
