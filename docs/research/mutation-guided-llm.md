# Mutation-Guided LLM Test Generation

> Research prototype based on the MutGen paper (Wang et al., 2026).
> Branch: `feat/perf-typer-optimizations`
> Date: 2026-05-15

## 1. Approach

Mutation testing (via Stryker) introduces small syntactic changes (mutants) into source code. If the existing test suite does not detect a mutant, it "survives." Each survived mutant represents a specific behavioral gap in the test suite.

The MutGen-inspired workflow is:

1. **Run Stryker** to generate mutants and identify survivors.
2. **Parse the mutation report** to extract, per file:
   - Mutant type (e.g., `EqualityOperator`, `BooleanLiteral`, `ConditionalExpression`)
   - Exact source location (line, column)
   - The applied replacement (the change that survived)
3. **Feed survived mutants to an LLM** as targeted test-generation prompts.
4. **LLM generates tests** that specifically kill the survived mutants by asserting the original behavior.
5. **Iterate** until mutation score reaches the desired threshold.

This is more efficient than generic LLM test generation because the prompt is grounded in a concrete, machine-detected weakness rather than an abstract coverage metric.

## 2. Current Stryker Results

Run: `cd frontend && npx stryker run`

### Overall Score

| Metric | Value |
|--------|-------|
| Total mutants | 262 |
| Killed | 166 |
| Timed out | 8 |
| Survived | 72 |
| No coverage | 16 |
| **Mutation score** | **66.41%** |
| Covered mutation score | 70.73% |

### Per-File Breakdown

| File | Survived | No Coverage | Mutation Score |
|------|----------|-------------|----------------|
| `src/typer.ts` | 49 | 8 | 56.82% |
| `src/chordManager.ts` | 12 | 1 | 64.86% |
| `src/textRenderer.ts` | 7 | 7 | 60.00% |
| `src/device/chordSerialization.ts` | 4 | 0 | 90.24% |
| `src/device/lineBreakTransformer.ts` | 0 | 0 | 100.00% |

### Top Survived Mutants by File

#### `src/typer.ts` (49 survived)

The typer has the highest number of survivors, concentrated in:

- **Event listener logic** (L32–L40): `StringLiteral` mutations on event names (`"mousedown"`, `"focus"`, `""`), `OptionalChaining` mutations on `window.getSelection()?.selectAllChildren(cursor)`, and `BlockStatement` mutations that empty listener bodies.
- **Scroll throttling** (L99–L103): `BooleanLiteral` and `ConditionalExpression` mutations on `scrollPending` guards, `ObjectLiteral` mutations on `scrollIntoView` options.
- **Buffer refill** (L88–L92): `BooleanLiteral` mutations on `refillPending`, `EqualityOperator` mutation on the `while (this.#untypedCount < TEST_BUFFER_MIN_LENGTH)` loop condition.
- **Keyboard handling** (L155–L156): `LogicalOperator` and `ConditionalExpression` mutations on the Space/Arrow key guard.
- **Init/session storage** (L128–L143): `StringLiteral` mutations on storage keys, `BooleanLiteral` mutations on `typerInited`.

#### `src/chordManager.ts` (12 survived)

- **Empty chord guard** (L24): `ConditionalExpression` and `EqualityOperator` mutations on `if (chords.length > 0)`.
- **Lookup logic** (L14): `OptionalChaining` and `ConditionalExpression` mutations on `chords.find(...)`.
- **Split/tokenization** (L25–L32): `BooleanLiteral`, `ArrowFunction`, and `StringLiteral` mutations on the regex construction and token toggling logic.

#### `src/textRenderer.ts` (7 survived, 7 no-coverage)

- **Token wrapping** (L4, L18, L24, L40, L47): `BlockStatement`, `MethodExpression`, `ConditionalExpression`, and `EqualityOperator` mutations on word/chord wrapping, space handling, and `trim()`.
- **Ruby annotation branch** (L24–L35): Entirely uncovered (`NoCoverage`) — the `chordy` branch that builds `<ruby>` elements is never exercised.

## 3. Sample Prompt Template for LLM-Based Test Generation

### Prompt Template: Survived-Mutant-Guided Test Generation

```markdown
You are a test engineer. Your task is to write a minimal, focused test that kills a specific survived mutant.

## Context

File: {{FILE_PATH}}
Function/Class: {{SCOPE}}

## Original Code (excerpt)

```typescript
{{ORIGINAL_CODE_SNIPPET}}
```

## Survived Mutant

- **Type**: {{MUTANT_TYPE}}
- **Location**: Line {{LINE}}, Column {{COLUMN}}
- **Replacement applied by Stryker**:
  ```typescript
  {{MUTANT_REPLACEMENT}}
  ```

## What "killing" this mutant means

The test must exercise the original code path and assert a behavior that would FAIL if the mutant replacement were present, but PASS with the original code.

## Existing test file

{{EXISTING_TEST_FILE_PATH}}

## Instructions

1. Write one or more test cases in the same style as the existing tests ({{TEST_FRAMEWORK}}).
2. The test must specifically target the behavior at the mutant location.
3. Do not change production code.
4. If the mutant is a `BooleanLiteral` or `ConditionalExpression`, ensure the test covers both the true and false branches where applicable.
5. If the mutant is a `StringLiteral` (e.g., an event name or DOM attribute), ensure the test verifies the exact string value or its effect.
6. If the mutant is `NoCoverage`, the test must reach that line for the first time.

## Output

Provide only the test code to be added to the existing test file, wrapped in a markdown code block.
```

### Example Filled Prompt (Typer `scrollPending` BooleanLiteral)

```markdown
## Context

File: `src/typer.ts`
Scope: `Typer` class — `beforeinput` event handler scroll throttling

## Original Code (excerpt)

```typescript
if (!this.scrollPending) {
  this.scrollPending = true;
  requestAnimationFrame(() => {
    this.scrollPending = false;
    this.scrollTarget?.scrollIntoView({ block: 'start' });
    this.scrollTarget = null;
  });
}
```

## Survived Mutant

- **Type**: `BooleanLiteral`
- **Location**: Line 99, Column 13
- **Replacement applied by Stryker**:
  ```typescript
  if (this.scrollPending) { ... }
  ```

## What "killing" this mutant means

If `scrollPending` is initialized to `true` (another survived mutant), or if the guard is inverted, the scroll behavior must still be correct. A test should trigger multiple inputs rapidly and assert that `scrollIntoView` is called exactly once per animation frame.

## Existing test file

`src/typer.test.ts`

## Instructions

Write a Vitest test using `happy-dom` or `jsdom` that:
1. Simulates two rapid `beforeinput` events.
2. Asserts that `scrollIntoView` on the scroll target is invoked exactly once per frame.
3. Would fail if the `if (!this.scrollPending)` guard were mutated to `if (this.scrollPending)`.
```

## 4. Automation Roadmap

### Phase 1: Report Parsing (Done)

- Stryker HTML report parsed to extract survived mutants per file.
- JSON dump created at `frontend/reports/mutation/mutants.json`.

### Phase 2: Prompt Generation Script

Create `scripts/generate-mutant-prompts.ts` that:

1. Reads `mutants.json`.
2. Groups mutants by file and sorts by density (most survivors first).
3. For each mutant, reads the source file and extracts a context window (±5 lines).
4. Fills the prompt template above.
5. Writes prompts to `docs/research/prompts/YYYY-MM-DD/<file>-<line>-<mutator>.md`.

### Phase 3: LLM Integration

- Pipe generated prompts to an LLM API (e.g., OpenAI, Anthropic, or local Ollama).
- Collect generated test snippets.
- Auto-insert into the corresponding `*.test.ts` files (with human review gate).

### Phase 4: Validation Loop

1. Re-run Stryker after applying generated tests.
2. Check which mutants are now killed.
3. Feed remaining survivors back into the pipeline (iterative refinement).

### Phase 5: CI Integration

- Add a GitHub Actions job that:
  - Runs Stryker on PRs.
  - Posts a comment with the top-N survived mutants.
  - Optionally triggers an LLM-based test generation bot for mutants above a severity threshold.

## 5. Quick Wins (Immediate Targets)

Based on the current report, the highest-impact tests to write manually (or generate first) are:

1. **`src/typer.ts` L99–L103**: Scroll throttling — assert `scrollIntoView` call count across rapid inputs.
2. **`src/typer.ts` L88–L92**: Buffer refill — assert that `requestAnimationFrame` is used and that `#untypedCount` stays above `TEST_BUFFER_MIN_LENGTH`.
3. **`src/textRenderer.ts` L24–L35**: Ruby annotation branch — this is entirely uncovered. Any test that passes `chordy=true` and verifies `<ruby>` element creation would kill 7 no-coverage mutants at once.
4. **`src/chordManager.ts` L24**: Empty chord guard — assert behavior when `chords` array is empty.
5. **`src/chordManager.ts` L14**: `getChordForPhrase` optional chaining — assert behavior when no matching chord exists.

## 6. Files Created / Modified

- `docs/research/mutation-guided-llm.md` (this document)
- `frontend/reports/mutation/mutants.json` (parsed Stryker data)
