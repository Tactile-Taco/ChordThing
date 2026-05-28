# Test Oracle: Typer Performance Optimizations

## Source
Issue #12 — ADR 0008 performance priorities.

## Correctness Criteria (independent of implementation)

### 1. untypedCount Accuracy
After any sequence of insertions and deletions, the internal counter tracking untyped characters must exactly match `typeDisplay.querySelectorAll('[data-typed="untyped"]').length`. The counter must never drift from ground truth.

### 2. Buffer Refill Trigger
When the count of untyped characters falls below `TEST_BUFFER_MIN_LENGTH` (800), the system must append new text fragments until the count is at least 800. This must happen without blocking the input handler.

### 3. CSS Transition Scope
The `<char>` element style must transition only `color` and `background-color`. The keyword `all` must not appear in the transition declaration for `char`.

### 4. scrollIntoView Throttling
Multiple input events within a single animation frame must result in at most one `scrollIntoView` call. The cursor element must remain visible (within scroll container bounds) after the frame.

### 5. Buffer Refill Batching
Text fragment appending must not occur synchronously inside the `beforeinput` event handler. It must be deferred to a `requestAnimationFrame` callback (or equivalent).

### 6. Public Behavior Preservation
All existing observable behavior must be preserved:
- Cursor advances on `insertText`, retreats on `deleteContentBackward`
- `correct` class when `dataset.val === dataset.typed`, `typo` otherwise
- `data-typed` attribute updated to the typed character
- Focus management (focus on init, blur shows pause dialog)
- Global keyboard handling (Space/Arrow prevention)
