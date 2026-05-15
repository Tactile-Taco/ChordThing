# Chord Serialization Protocol

**Module:** `frontend/src/device/chordSerialization.ts`
**Test Evidence:** `frontend/src/device/chordSerialization.test.ts`
**Mutation Score:** 90.24% (Stryker)

---

## Structural Invariants (S)

### Input/Output Contracts
- `parseChordActions(hexString: string): number[]`
  - Input: 32-character hex string (128 bits)
  - Output: array of integers (action codes), 0–12 elements
  - Each action code is in range [1, 1023]
- `stringifyChordActions(actions: number[]): string`
  - Input: array of integers
  - Output: 32-character uppercase hex string, zero-padded
  - Max 12 actions; extras are silently truncated

### Bit Layout
- 128 bits total:
  - Bits 120–127: 8-bit chain index (not exposed by these functions)
  - Bits 0–119: 12 × 10-bit action codes
- Action 1 (array[0]) is encoded at highest bits (bits 110–119)
- Action 12 (array[11]) is encoded at lowest bits (bits 0–9)
- Action code 0 means "no action" and is omitted from output

---

## Behavioral Invariants (B)

### Round-trip
- **Property:** ∀ actions. parse(stringify(actions)) === actions
- Verified by property-based testing with 1000 random arrays

### Order Preservation
- Output order matches bitstream order (high bits first)
- For valid CCOS chords, this corresponds to descending action codes (greatest first)
- The function does not sort; it reads the bitstream as-is

### Zero Filtering
- Action code 0 is omitted from `parseChordActions` output
- Empty action arrays stringify to 32 zeros

### Boundary Cases
- Empty hex string: behavior undefined (not a valid input)
- Odd-length hex string: behavior undefined
- Non-hex characters: `BigInt` constructor throws
- Actions > 1023: truncated to 10 bits (silently corrupted)
- Negative actions: `BigInt` treats as two's complement (silently corrupted)

### Phrase Functions
- `parsePhraseHex(hexString: string): string`
  - Empty input → empty string
  - Odd-length input: final nibble ignored (due to `.match(/.{2}/g)`)
- `stringifyPhrase(phrase: string): string`
  - Empty input → empty string
  - Non-ASCII characters: encoded as UTF-8 byte sequences (may produce multi-byte hex)

---

## Operational Invariants (O)

### Performance
- `parseChordActions`: O(1) — fixed 12 iterations
- `stringifyChordActions`: O(1) — fixed max 12 iterations
- `parsePhraseHex`: O(n) where n = hex string length
- `stringifyPhrase`: O(n) where n = phrase length

### Side Effects
- None. All functions are pure.

---

## Untrusted Input Handling

These functions receive data from the CharaChorder device via serial API. Device output is **untrusted**:
- Malformed hex strings could crash `BigInt` constructor
- Truncated responses could produce wrong action counts
- Corrupted data could yield action codes outside expected range

**Current validation:** None. `parseChordActions` assumes well-formed 32-char hex.
**Recommended:** Add input validation (length check, hex character check) before parsing.

---

## Evidence Chain

| Artifact | Location |
|----------|----------|
| Tests | `frontend/src/device/chordSerialization.test.ts` |
| Property tests | fast-check round-trips (1000 runs) |
| Mutation report | `frontend/reports/mutation/mutation.html` |
| Spec reference | CCOS Serial API documentation |
