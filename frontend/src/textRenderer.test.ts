import { describe, it, expect, beforeEach } from 'vitest';
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
});
