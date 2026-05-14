# ADR 0008: Typer Web Component Conversion — Performance Analysis

## Status
Analyzed — Recommendation: **Do NOT convert to a Web Component** at this time.

## Context

The `Typer` class (`frontend/src/typer.ts`) is the "sacred engine" — a tight, imperative DOM manipulation loop handling every keystroke. It currently:
- Queries the global DOM (`document.getElementById`, `querySelector` on `typeDisplay`)
- Manipulates DOM directly inside a `beforeinput` handler (`cursor.id = ...`, `move.scrollIntoView()`)
- Uses `data-ignore-morph` to isolate itself from Datastar
- Has zero event emission (sequence builder deferred per ADR 0006)

The question: would encapsulating it as a true Web Component (`<chord-typer>` with Shadow DOM) improve or hurt performance?

## Analysis

### 1. Current Architecture (Plain TS Class)

**Strengths:**
- **Direct DOM access with no abstraction overhead.** `handleInput()` touches exactly 2-3 nodes per keystroke (cursor, next char, possibly appended fragment). No shadow boundary crossing.
- **No lifecycle overhead.** The class is instantiated once in `main.ts`. No `connectedCallback`, `attributeChangedCallback`, or observed attributes.
- **Global CSS works natively.** Styles in `style.css` apply directly to `<char>`, `<word>`, `<ruby>` custom elements without `:host` or `::slotted` indirection.
- **Event handling is flat.** `beforeinput` fires on `#typer` (contenteditable). The handler does `e.preventDefault()` and mutates DOM synchronously. No event retargeting.
- **`data-ignore-morph` is a single attribute.** Datastar sees it and skips the subtree. Simple, zero-cost.

**Weaknesses:**
- `document.getElementById('cursor')` scans the entire document tree (though browsers optimize this to an ID hashmap — effectively O(1)).
- `querySelectorAll('[data-typed="untyped"]')` in the buffer-refill loop scans the visible + buffered text. With `TEST_BUFFER_MIN_LENGTH = 800`, this is ~800-1000 nodes every few keystrokes.
- CSS selectors like `char`, `word`, `ruby` are global. In theory another component could conflict, but the app is small and controlled.

### 2. Web Component Approach (Custom Element + Shadow DOM)

**Hypothetical implementation:**
```ts
class ChordTyper extends HTMLElement {
  #shadow = this.attachShadow({ mode: 'open' });
  // ... same logic, but all queries scoped to #shadow
}
```

**Potential benefits:**
- **Style encapsulation:** Shadow DOM scopes `char { ... }` rules to the component. No global CSS pollution. (Marginal benefit — the app has one typer.)
- **DOM scoping:** `this.#shadow.getElementById('cursor')` is technically scoped, though `document.getElementById` is already O(1) in practice.
- **Repaint containment:** Shadow DOM can act as a layout/paint boundary in some browsers, potentially containing scroll/reflow during `scrollIntoView`.
- **Cleaner `data-ignore-morph`:** The entire component could be ignored by Datastar in one shot, though `data-ignore-morph` on the display div already achieves this.

**Concrete costs:**
- **Shadow boundary DOM access overhead:** Every `getElementById`, `querySelector`, `append` crosses the shadow boundary. Modern browsers optimize this, but it is *not* free. In a tight loop handling 5-12 keystrokes per second (fast typist), boundary crossing adds up.
- **Style recalculation boundaries:** Shadow DOM creates separate style scopes. Each keystroke mutates classes (`correct`/`typo`) and text content. With Shadow DOM, the browser must recalculate styles within the shadow scope. While this *contains* recalculation, it also means the browser cannot reuse global style computation caches. For a small subtree (~800 nodes), the overhead of scope switching likely exceeds the benefit of containment.
- **Event retargeting:** `beforeinput` on a contenteditable inside Shadow DOM retargets through the shadow boundary. The event's `target` becomes the custom element, not the contenteditable. This breaks the current logic which relies on `e.target === document.body` checks in `setupGlobalKeyboardHandling`. Would require refactoring.
- **Selection API complexity:** `window.getSelection()` returns the *composed* selection, but `selectAllChildren(cursor)` inside Shadow DOM requires `getSelection()` on the shadow root or using `ShadowRoot.prototype.getSelection()` (non-standard in some browsers). The current code does `window.getSelection()?.selectAllChildren(cursor)` — this would break or behave unpredictably inside Shadow DOM because the selection must be in the same tree as the node.
- **Scroll into view:** `move.scrollIntoView()` inside Shadow DOM scrolls the shadow host or the nearest scrollable ancestor in the flat tree. With the current layout (`#typer-display` has `overflow-y: scroll`), the shadow host would need to be the scroll container, or the scrollable element must be inside the shadow. This forces restructuring the DOM hierarchy (moving `#typer-display` into the shadow), which breaks the current grid layout (`grid-column: core`) unless the host itself is placed in the grid.
- **Memory overhead:** Custom element registry, shadow root object, slotting infrastructure (if used). Minimal but non-zero.
- **Build/testing complexity:** Playwright E2E tests (`e2e/tests/typer.spec.ts`) use `#typer`, `#typer-display`, `#cursor`. Shadow DOM would require piercing (`page.locator('chord-typer').locator('#cursor')`) or `evaluate` handles. The test suite is small now but this adds friction.

### 3. Performance-Critical Path Deep-Dive

The hot path is `handleInput` → `beforeinput`:

```ts
cursor.removeAttribute('id');      // 1 DOM mutation
move.id = 'cursor';                // 1 DOM mutation + ID map update
window.getSelection()?.selectAllChildren(move);  // Selection API
move.scrollIntoView({ block: 'start' });         // Layout + scroll

// Buffer refill:
while (typeDisplay.querySelectorAll('[data-typed="untyped"]').length < 800) {
  typeDisplay.append(getTextFragment());  // Fragment append (batch insert)
}
```

**Per-keystroke cost breakdown (current):**
1. `document.getElementById('cursor')` — O(1), browser-optimized ID lookup.
2. `charAt(nextIndex)` — `querySelector` on `typeDisplay` (a div). Scoped to a single subtree, fast.
3. `cursor.removeAttribute('id')` + `move.id = 'cursor'` — Two attribute mutations. Triggers style recalc for `#cursor` rules (minimal: just `color`/`background` via `.correct`/`.typo`).
4. `selectAllChildren(move)` — Selection API call. Forces layout in some browsers.
5. `scrollIntoView` — Layout + scroll. Already expensive; Shadow DOM doesn't help here because the scroll container (`#typer-display`) is the same.
6. `querySelectorAll('[data-typed="untyped"]')` — **The real cost.** Scans ~800-1000 nodes every time the buffer runs low (i.e., frequently during fast typing). This is O(n) where n = buffer size.

**Web Component impact on hot path:**
- Shadow DOM would scope the `querySelectorAll` to the shadow root. The scan is still O(n) over the same number of nodes. No improvement.
- `getElementById` inside Shadow DOM is similarly O(1) but involves shadow boundary lookup. Slightly slower, not faster.
- Selection API inside Shadow DOM is a known pain point. Would likely require workarounds (`Range` + `shadowRoot.getSelection()` where supported), adding latency.
- Style recalculation is contained but the subtree is already small. Containment gain is negligible.

### 4. Datastar Integration

Current: `<div id="typer-display" data-ignore-morph>`
- Datastar's morphing algorithm skips this subtree entirely.
- The attribute is on the display div, not the container. This is precise.

WC approach: `<chord-typer data-ignore-morph>`
- Same directive, same effect. No win.
- If the shadow root is closed, Datastar cannot pierce it even if it wanted to. But `data-ignore-morph` already prevents the attempt.
- **Risk:** If Datastar ever needs to signal the typer (e.g., SSE pushes new test generation mode), crossing the shadow boundary to dispatch a custom event onto the host is possible but adds complexity. Currently, `Typer` reads `sessionStorage` directly.

### 5. Browser Compatibility

Web Components (V1) are supported in all modern browsers. No issue there. However:
- `shadowRoot.getSelection()` is non-standard and missing in Firefox. The standard `getSelection()` returns the composed selection, but programmatic selection inside Shadow DOM is buggy across browsers.
- The current `contenteditable` + `selectAllChildren` pattern is fragile enough globally; inside Shadow DOM it becomes actively problematic.

### 6. Current Bottlenecks (What Actually Matters)

The WC conversion does **nothing** to address the actual performance bottlenecks:

1. **`querySelectorAll` in buffer refill loop:** Should track `untypedCount` as a number instead of re-counting DOM nodes.
2. **`scrollIntoView` on every keystroke:** Forces synchronous layout. Could be throttled or replaced with `scrollTop` manipulation.
3. **`transition: all 0.1s ease` on every `<char>`:** CSS transitions on 800+ elements create compositor work. The `all` keyword is especially expensive.
4. **No `requestIdleCallback` or `requestAnimationFrame` batching:** Buffer refill happens synchronously in the input handler, blocking the next frame.

These are algorithmic/DOM issues, not architectural encapsulation issues.

## Decision

### Do NOT convert Typer to a Web Component.

Reasons:
1. **No measurable performance gain.** The hot path is DOM mutation and query scanning, neither of which Shadow DOM improves.
2. **Concrete performance risks.** Shadow boundary crossing, selection API breakage, and style scope switching add overhead in the tightest loop.
3. **Significant refactoring cost.** `contenteditable`, selection management, scroll container positioning, and grid layout would all need restructuring.
4. **Testing friction.** E2E tests would need shadow piercing.
5. **Distracts from real optimizations.** The time is better spent fixing `querySelectorAll` counting, `scrollIntoView` throttling, and CSS transition scope.

### What TO do instead (performance priorities)

| Priority | Fix | Impact |
|----------|-----|--------|
| High | Replace `querySelectorAll` count with a running `untypedCount` counter | Eliminates O(n) scan per keystroke |
| High | Scope `transition` to specific properties (`color`, `opacity`) instead of `all` | Reduces compositor work per char |
| Medium | Throttle `scrollIntoView` with `requestAnimationFrame` or scroll-margin | Reduces forced synchronous layout |
| Medium | Batch buffer refill with `requestIdleCallback` or rAF | Prevents input blocking |
| Low | Consider `ResizeObserver` or `IntersectionObserver` for cursor visibility instead of `scrollIntoView` | Decouples scroll from input handler |

## Consequences

- `Typer` stays a plain TS class. Sacred engine remains simple and fast.
- `data-ignore-morph` stays on `#typer-display`. No Datastar integration changes needed.
- Future work should focus on algorithmic DOM optimizations, not encapsulation abstractions.
- If the app later has *multiple* typers on one page (unlikely), or if CSS conflicts emerge, the WC question can be revisited. Until then, the cost outweighs the benefit.

## Related

- `frontend/src/typer.ts` — sacred engine
- `frontend/src/textRenderer.ts` — DOM fragment generation
- ADR 0006 — Event interface design (sequence builder deferred)
- ADR 0007 — Datastar integration (`data-ignore-morph`)
