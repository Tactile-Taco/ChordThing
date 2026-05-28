# Text Renderer Protocol

**Module:** `frontend/src/textRenderer.ts`
**Test Evidence:** `frontend/src/textRenderer.test.ts`
**Mutation Score:** 40.00% (Stryker)

---

## Structural Invariants (S)

### Output Shape
- `wrapText` returns a `DocumentFragment`
- Fragment contains only these element types: `char`, `word`, `ruby`, `rp`, `rt`
- Every `char` element has exactly these dataset attributes:
  - `data-index`: integer, monotonically increasing within the fragment
  - `data-val`: the character (including `' '` for spaces)
  - `data-typed="untyped"`
- `ruby` elements contain, in order:
  1. `char` children (one per character of the word)
  2. `rp` with textContent `'('`
  3. `rt` with textContent = chord notation from `getChordForPhrase(token)`
  4. `rp` with textContent `')'`
- `word` elements contain only `char` children (one per character)

### Index Continuity
- `data-index` values form a contiguous sequence with no gaps
- The starting index is `Number(sessionStorage.getItem('next_char_index') ?? 0)`
- The ending index is stored back to `sessionStorage` as `'next_char_index'`

---

## Behavioral Invariants (B)

### Text Processing
- **Trailing space:** output always ends with a space `char` element
- **Trim:** leading/trailing whitespace from input is removed before processing
- **Space preservation:** internal spaces become standalone `char` elements (not inside `word`)
- **Word splitting:** non-space sequences are wrapped in `word` elements
- **Empty input:** `wrapText('')` returns a fragment with only a trailing space `char`

### Chord Annotation
- When `splitChords` identifies a chord token, it is wrapped in `ruby`
- The `rt` element contains the chord notation from `getChordForPhrase(token)`
- `rp` elements contain `'('` and `')'` respectively

### Session State
- `next_char_index` is incremented by the number of `char` elements produced
- The stored value persists across calls within the same session

---

## Operational Invariants (O)

### Performance
- Time complexity: O(n) where n = input string length
- Single pass through input (generator-based chord splitting)

### Side Effects
- Reads `sessionStorage.getItem('next_char_index')`
- Writes `sessionStorage.setItem('next_char_index', ...)`
- Otherwise pure: same input + same starting index → same output

---

## Untrusted Input Handling

`wrapText` receives text from potentially untrusted sources:
- LLM-generated text (server-side)
- User-imported chord libraries
- Random word generators

The function must handle:
- Any Unicode string (though ASCII is expected for typing tests)
- Empty strings
- Strings with only whitespace
- Very long strings (performance degradation, not crash)

---

## Evidence Chain

| Artifact | Location |
|----------|----------|
| Tests | `frontend/src/textRenderer.test.ts` |
| Mutation report | `frontend/reports/mutation/mutation.html` |
| Consumer | `frontend/src/typer.ts` (calls `wrapText`) |
