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
      expect(result).toEqual([32, 51]);
    });

    it('should return empty array for all zeros', () => {
      const result = parseChordActions('00000000000000000000000000000000');
      expect(result).toEqual([]);
    });
  });

  describe('stringifyChordActions', () => {
    it('should stringify known actions', () => {
      const result = stringifyChordActions([32, 51]);
      expect(result).toBe('0000000000000000000000000000CC20');
    });

    it('should return 32 zeros for empty array', () => {
      const result = stringifyChordActions([]);
      expect(result).toBe('00000000000000000000000000000000');
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
