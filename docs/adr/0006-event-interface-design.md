# ADR 0006: Event Interface Design — Sequence-Level Emission

## Status
Proposed — contract designed, implementation deferred until CI/CD + test harnesses

## Context

The sacred engine (`Typer`) currently handles all input imperatively with zero event emission. The frontend invariant claims "It emits events," but this is aspirational — not yet true. The typing sequence API (ADR 0002) needs sequence-level data, not per-keystroke events.

Key constraint: **Timing accuracy is critical.** Granular per-character event emission could introduce jitter/delays. The timing system must be coupled to the sequence builder, not dependent on event dispatch overhead.

## Decision

### 1. Granular per-character events are NOT emitted

`Typer` will NOT emit `charTyped`, `charDeleted`, `wordCompleted`, etc. These are unnecessary for the sequence API and would compromise timing accuracy. Per-character timing is recorded internally by the sequence builder, not via event dispatch.

Future consumers (e.g., LLM assistants monitoring typing in real-time) may need granular events, but that is un-specced and deferred.

### 2. Sequence-level events ARE emitted

`Typer` emits the following events:

| Event | When | Payload |
|-------|------|---------|
| `sequenceComplete` | Sequence ends (boundary triggered) | Full sequence data: characters entered, backspaces, per-edit timings, total sequence time, aggregate vs measured time delta |
| `bufferLow` | Untyped buffer drops below threshold | Current buffer length, requested fill amount |

**Sequence boundary triggers:** >5s gap between edits, blur, pause dialog open, page unload.

### 3. Timing accuracy strategy

- Per-edit timestamps are captured at the point of `beforeinput` handling (not via event listener callback).
- Sequence total time is measured independently (sequence start → sequence end).
- Delta = `sequenceTotalTime - sum(allEditDurations)`. High variance indicates timing system performance issues.
- This delta is included in the `sequenceComplete` payload for diagnostics.

### 4. Sequence builder responsibility

A `SequenceBuilder` class (or module) will:
- Sit alongside `Typer` (not inside it)
- Record per-edit data directly from `beforeinput` handling
- Maintain running sequence state
- Emit `sequenceComplete` when boundary is reached
- Emit `bufferLow` when buffer needs refilling
- Handle API communication (deferred)

`Typer` remains focused on DOM manipulation and input handling. It delegates sequence building to the separate module.

### 5. Deferred until CI/CD

Implementation of the sequence builder and event emission is deferred until after CI/CD and test harnesses are in place. However, the contract (this ADR) is established now to guide test design.

## Consequences

- `Typer` stays minimal — no event infrastructure added yet.
- Sequence builder is a new architectural boundary between sacred engine and data layer.
- Timing accuracy is preserved by avoiding event dispatch overhead for granular edits.
- `sequenceComplete` payload is rich enough for typing sequence API ingestion.
- Design flourishes based on sequence data are possible but not planned yet.

## Open Questions

1. Should `sequenceComplete` include the target text that was displayed during the sequence?
2. Should `bufferLow` include the current test generation mode preference?
3. How does the sequence builder handle mid-sequence device disconnect?
4. What is the exact threshold for `bufferLow`? (Currently `TEST_BUFFER_MIN_LENGTH = 800`)

## Related

- ADR 0002 — Typing sequence API (consumer of sequence data)
- ADR 0004 — CI/CD test harness (blocks implementation)
- `frontend/src/typer.ts` — sacred engine, will delegate to sequence builder
- `docs/agents/deferred-terms-archive.md` — Session stats, Event interface (archived granular events)
