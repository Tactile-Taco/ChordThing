import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  parseChordActions,
  stringifyChordActions,
  parsePhraseHex,
  stringifyPhrase,
} from './chordSerialization';

describe('chordSerialization', () => {
  describe('parseChordActions', () => {
    it('should parse known hex string', () => {
      const result = parseChordActions('000CC200000000000000000000000000');
      expect(result).toEqual([51, 32]);
    });

    it('should return empty array for all zeros', () => {
      const result = parseChordActions('00000000000000000000000000000000');
      expect(result).toEqual([]);
    });

    it('should return empty array for empty string', () => {
      const result = parseChordActions('');
      expect(result).toEqual([]);
    });

    it('should return empty array for odd-length hex string', () => {
      const result = parseChordActions('000CC20000000000000000000000000');
      expect(result).toEqual([]);
    });

    it('should return empty array for non-hex characters', () => {
      const result = parseChordActions('000CC2000000000000000000000000GG');
      expect(result).toEqual([]);
    });

    it('should return empty array for wrong length (not 32)', () => {
      const result = parseChordActions('000CC2000000000000000000000000');
      expect(result).toEqual([]);
    });

    it('should parse doc example chord (carpe diem)', () => {
      // From CCOS Serial API docs: CML C1 522 001946418C0000000000000000000000 6361727065206469656D 0
      // This chord encodes 'c' (99), 'd' (100), 'e' (101) in descending order
      const result = parseChordActions('001946418C0000000000000000000000');
      expect(result).toEqual([101, 100, 99]);
    });

    it('should maintain descending order', () => {
      // Keys should be returned in descending order (greatest to least)
      const result = parseChordActions('000CC200000000000000000000000000');
      expect(result[0]).toBeGreaterThan(result[1]);
    });
  });

  describe('stringifyChordActions', () => {
    it('should stringify known actions', () => {
      const result = stringifyChordActions([51, 32]);
      expect(result).toBe('000CC200000000000000000000000000');
    });

    it('should return 32 zeros for empty array', () => {
      const result = stringifyChordActions([]);
      expect(result).toBe('00000000000000000000000000000000');
    });

    it('should stringify doc example chord (carpe diem)', () => {
      // From CCOS Serial API docs
      const result = stringifyChordActions([101, 100, 99]);
      expect(result).toBe('001946418C0000000000000000000000');
    });

    it('should truncate actions beyond 12', () => {
      const actions = Array.from({ length: 15 }, (_, i) => i + 1);
      const result = stringifyChordActions(actions);
      const parsed = parseChordActions(result);
      expect(parsed).toHaveLength(12);
    });
  });

  describe('round-trip property', () => {
    it('should round-trip for any valid action array', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 1, max: 1023 }), { maxLength: 12 }),
          (actions) => {
            const serialized = stringifyChordActions(actions);
            const deserialized = parseChordActions(serialized);
            expect(deserialized).toEqual(actions);
          }
        ),
        { numRuns: 1000 }
      );
    });
  });

  describe('parsePhraseHex', () => {
    it('should parse known hex phrase', () => {
      const result = parsePhraseHex('68656C6C6F');
      expect(result).toBe('hello');
    });

    it('should return empty string for empty input', () => {
      const result = parsePhraseHex('');
      expect(result).toBe('');
    });

    it('should return empty string for odd-length hex input', () => {
      const result = parsePhraseHex('68656');
      expect(result).toBe('');
    });

    it('should return empty string for non-hex characters', () => {
      const result = parsePhraseHex('68656C6C6G');
      expect(result).toBe('');
    });
  });

  describe('stringifyPhrase', () => {
    it('should stringify known phrase', () => {
      const result = stringifyPhrase('hello');
      expect(result).toBe('68656C6C6F');
    });

    it('should return empty string for empty input', () => {
      const result = stringifyPhrase('');
      expect(result).toBe('');
    });
  });

  describe('phrase round-trip property', () => {
    it('should round-trip for any ASCII phrase', () => {
      fc.assert(
        fc.property(
          fc.string({ unit: 'grapheme-ascii' }),
          (phrase) => {
            const serialized = stringifyPhrase(phrase);
            const deserialized = parsePhraseHex(serialized);
            expect(deserialized).toBe(phrase);
          }
        ),
        { numRuns: 1000 }
      );
    });
  });
});
