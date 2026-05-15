# Chord Manager Protocol

**Module:** `frontend/src/chordManager.ts`
**Test Evidence:** —
**Mutation Score:** 13.51% (Stryker)

---

## Structural Invariants (S)

### Data Model
- `Chord` interface: `{ chord: string; phrase: string }`
- Chord library is stored as JSON array in `localStorage` under key `'chords'`
- Empty or missing storage → empty array

### `splitChords` Output
- Returns a `Generator<{ chordy: boolean; token: string }>`
- Tokens are non-empty strings
- `chordy: true` means the token matches a chord phrase (case-insensitive)
- `chordy: false` means the token is plain text
- Tokens reconstruct the original input when concatenated (minus chord boundaries)

---

## Behavioral Invariants (B)

### Storage
- **Round-trip:** `saveChords` followed by `getChords` returns equivalent array
- **Persistence:** chords survive page reloads (localStorage)
- **Empty default:** no stored chords → empty array, not error

### Lookup
- **Case-insensitive:** `getChordForPhrase` normalizes both stored phrases and input to lowercase
- **Missing chord:** returns empty string `''` for unknown phrases
- **First match:** if multiple chords have the same phrase, first one wins

### Splitting
- **Empty chords:** `splitChords(s)` with no stored chords yields a single `{ chordy: false, token: s }`
- **No match:** input with no chord phrases yields a single plain-text token
- **Multiple matches:** all chord phrases are matched (non-overlapping, regex `...`)
- **Case-insensitive matching:** regex uses `'i'` flag

---

## Operational Invariants (O)

### Performance
- `getChords`: O(1) amortized (localStorage read + JSON parse)
- `getChordForPhrase`: O(n) where n = number of chords
- `saveChords`: O(1) amortized (JSON stringify + localStorage write)
- `splitChords`: O(m × n) where m = input length, n = number of chords (regex compilation + split)

### Side Effects
- Reads `localStorage.getItem('chords')`
- Writes `localStorage.setItem('chords', ...)`
- `splitChords` is otherwise pure (given same chord library)

---

## Untrusted Input Handling

### Chord library (user-supplied)
- Imported from CSV or synced from server
- Could contain:
  - Empty strings
  - Very long phrases
  - Regex-special characters (escaped via `RegExp.escape`)
  - Duplicate phrases

### `splitChords` input (LLM-generated or user text)
- Could be any string
- Very long strings may cause regex performance issues (ReDoS if `RegExp.escape` is buggy)

---

## Evidence Chain

| Artifact | Location |
|----------|----------|
| Tests | — (not yet implemented) |
| Mutation report | `frontend/reports/mutation/mutation.html` |
| Consumer | `frontend/src/textRenderer.ts` (calls `splitChords`, `getChordForPhrase`) |

---

## Open Questions

1. Should `RegExp.escape` polyfill be extracted and tested independently?
2. What is the max safe size for chord library (performance of `splitChords`)?
3. Should duplicate phrases be deduplicated on save?
