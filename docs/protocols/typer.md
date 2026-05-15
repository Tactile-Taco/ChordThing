# Typer Protocol

**Module:** `frontend/src/typer.ts`
**Test Evidence:** `frontend/src/typer.test.ts`
**Mutation Score:** 56.82% (Stryker)

---

## Structural Invariants (S)

### DOM Structure
- `#typer-display` contains only `char`, `word`, `ruby`, `rp`, `rt` elements
- Every `char` element has exactly these dataset attributes:
  - `data-index`: unique integer, monotonically increasing left-to-right
  - `data-val`: the expected character
  - `data-typed`: one of `"untyped"` | typed character
- Exactly one element has `id="cursor"` at all times after `init()` completes
- The cursor element is always a `char` with valid `data-index`

### State Shape
- `#untypedCount` is a non-negative integer
- `#scrollPending` and `#refillPending` are boolean flags
- `#scrollTarget` is `HTMLElement | null`

---

## Behavioral Invariants (B)

### Input Handling
- **Cursor advancement:** `insertText` advances cursor by 1 (new `id="cursor"` has `data-index + 1`)
- **Cursor retreat:** `deleteContentBackward` retreats cursor by 1
- **Boundary:** backspace at index 0 is a no-op — cursor stays, no state change, no error
- **Class correctness:** after `insertText`, the *previous* cursor element gets class `correct` if `dataset.val === dataset.typed`, else `typo`
- **Backspace reset:** after `deleteContentBackward`, the new cursor element has:
  - `class` removed
  - `textContent` restored to `dataset.val`
  - `data-typed="untyped"`
- **Pause dialog:** `blur` on `#typer` shows `#test-pause-dialog`
- **Unpause:** `focus` or `click` on dialog closes it and focuses `#typer`

### Counter Accuracy
- After any sequence of `insertText` and `deleteContentBackward`, `#untypedCount` equals `querySelectorAll('[data-typed="untyped"]').length`
- The counter never drifts from ground truth

### Buffer Management
- **Refill trigger:** when `#untypedCount` falls below `TEST_BUFFER_MIN_LENGTH` (800), fragments are appended until count ≥ 800
- **Refill timing:** appending never occurs synchronously inside `beforeinput`. It is deferred to `requestAnimationFrame`
- **Refill idempotency:** only one rAF callback is scheduled per frame (`#refillPending` guard)

### Scroll Behavior
- **Throttling:** `scrollIntoView` is called at most once per animation frame
- **Target accuracy:** the scrolled element is the *latest* cursor position, not a stale one
- **Visibility:** after scrolling, the cursor element is within the scroll container bounds

---

## Operational Invariants (O)

### Performance
- `beforeinput` handler completes without forced synchronous layout
- No `querySelectorAll` scans inside the hot path (counter is maintained incrementally)
- CSS transitions on `char` are scoped to `color` and `background-color` only (no `all`)

### Side Effects
- `sessionStorage.getItem('next_char_index')` is read during fragment generation
- `sessionStorage.setItem('next_char_index', ...)` is written after fragment generation
- `localStorage.getItem('test_gen_mode')` is read during `init()` if session preference unset

### Resource Bounds
- Buffer never grows unbounded (capped by refill logic)
- rAF callbacks are always cleared (flags reset)

---

## Untrusted Input Handling

The typer receives input via `beforeinput` events from the browser. These are trusted (user keystrokes), but the handler must still:
- Validate `inputType` is known (log and ignore unknown types)
- Handle `e.data` being `null` or empty string gracefully
- Prevent default browser behavior (composition, paste, etc.)

---

## Evidence Chain

| Artifact | Location |
|----------|----------|
| Tests | `frontend/src/typer.test.ts` |
| Oracle doc (temporary) | `TEST_ORACLE.md` |
| Mutation report | `frontend/reports/mutation/mutation.html` |
| ADR (performance) | `docs/adr/0008-typer-web-component-analysis.md` |
