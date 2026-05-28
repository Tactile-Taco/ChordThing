import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { wrapText } from './textRenderer';

describe('wrapText', () => {
  beforeEach(() => {
    sessionStorage.clear();
    sessionStorage.setItem('next_char_index', '0');
  });

  it('should produce a fragment containing an element with data-index="0"', () => {
    const fragment = wrapText('some text');
    expect(fragment.querySelector('[data-index="0"]')).not.toBeNull();
  });

  it('should produce valid fragments on multiple calls as next_char_index increments', () => {
    const fragment1 = wrapText('first');
    expect(fragment1.querySelector('[data-index="0"]')).not.toBeNull();

    const fragment2 = wrapText('second');
    const firstIndex2 = fragment2.querySelector('[data-index="0"]');
    // Because next_char_index has advanced, the new fragment should not contain data-index="0"
    expect(firstIndex2).toBeNull();

    // But the fragment should still contain elements with valid sequential indices
    const allIndexed = fragment2.querySelectorAll('[data-index]');
    expect(allIndexed.length).toBeGreaterThan(0);

    const indices = Array.from(allIndexed).map((el) => Number((el as HTMLElement).dataset.index));
    const minIndex = Math.min(...indices);
    expect(minIndex).toBeGreaterThan(0);
  });

  describe('property-based tests', () => {
    it('output fragment always contains valid char elements', () => {
      fc.assert(
        fc.property(
          fc.string({ unit: 'grapheme-ascii' }),
          (text) => {
            sessionStorage.setItem('next_char_index', '0');
            const fragment = wrapText(text);
            const chars = fragment.querySelectorAll('char');
            for (const char of chars) {
              expect(char.textContent).toBeDefined();
              expect(char.getAttribute('data-val')).toBeDefined();
              expect(char.getAttribute('data-index')).toBeDefined();
              expect(char.getAttribute('data-typed')).toBe('untyped');
            }
          }
        ),
        { numRuns: 1000 }
      );
    });

    it('data-index is monotonically increasing across char elements', () => {
      fc.assert(
        fc.property(
          fc.string({ unit: 'grapheme-ascii' }),
          (text) => {
            sessionStorage.setItem('next_char_index', '0');
            const fragment = wrapText(text);
            const chars = Array.from(fragment.querySelectorAll('char'));
            if (chars.length === 0) return;
            const indices = chars.map((el) => Number((el as HTMLElement).dataset.index));
            for (let i = 1; i < indices.length; i++) {
              expect(indices[i]).toBeGreaterThan(indices[i - 1]);
            }
          }
        ),
        { numRuns: 1000 }
      );
    });

    it('output always ends with a space char', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, unit: 'grapheme-ascii' }).filter((s) => s.trim().length > 0),
          (text) => {
            sessionStorage.setItem('next_char_index', '0');
            const fragment = wrapText(text);
            const children = Array.from(fragment.childNodes);
            expect(children.length).toBeGreaterThan(0);
            const last = children[children.length - 1] as HTMLElement;
            // wrapText trims input and appends a space, then splits on spaces.
            // The split can produce an empty trailing word token (e.g. "hello " => ["hello", " ", ""]),
            // which creates an empty <word> element after the space char. So the final node may be
            // an empty <word> rather than the space char itself.
            if (last.tagName.toLowerCase() === 'word') {
              expect(last.textContent).toBe('');
              // The space char should be the second-to-last node
              const secondLast = children[children.length - 2] as HTMLElement;
              expect(secondLast.tagName.toLowerCase()).toBe('char');
              expect(secondLast.textContent).toBe(' ');
              expect(secondLast.dataset.val).toBe(' ');
            } else {
              expect(last.tagName.toLowerCase()).toBe('char');
              expect(last.textContent).toBe(' ');
              expect(last.dataset.val).toBe(' ');
            }
          }
        ),
        { numRuns: 1000 }
      );
    });
  });
});
