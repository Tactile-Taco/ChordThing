import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { getChords, saveChords, getChordForPhrase, splitChords } from './chordManager';

describe('chordManager', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('round-trip property', () => {
    it('should round-trip save and get for any chord array', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              chord: fc.string({ unit: 'grapheme-ascii' }),
              phrase: fc.string({ unit: 'grapheme-ascii' }),
            }),
            { maxLength: 50 }
          ),
          (chords) => {
            saveChords(chords);
            const retrieved = getChords();
            expect(retrieved).toEqual(chords);
          }
        ),
        { numRuns: 1000 }
      );
    });
  });

  describe('getChordForPhrase case-insensitivity', () => {
    it('should return the same chord regardless of input case', () => {
      fc.assert(
        fc.property(
          fc.string({ unit: 'grapheme-ascii' }),
          fc.string({ unit: 'grapheme-ascii' }),
          fc.string({ unit: 'grapheme-ascii' }),
          (phrase, chord, otherPhrase) => {
            const lowerPhrase = phrase.toLowerCase();
            // Avoid empty phrase collisions by ensuring uniqueness if needed
            const chords = [
              { chord, phrase: lowerPhrase },
              { chord: 'other', phrase: otherPhrase.toLowerCase() },
            ];
            saveChords(chords);
            const resultLower = getChordForPhrase(lowerPhrase);
            const resultUpper = getChordForPhrase(lowerPhrase.toUpperCase());
            const resultMixed = getChordForPhrase(
              lowerPhrase
                .split('')
                .map((c, i) => (i % 2 === 0 ? c.toUpperCase() : c))
                .join('')
            );
            expect(resultLower).toBe(chord);
            expect(resultUpper).toBe(chord);
            expect(resultMixed).toBe(chord);
          }
        ),
        { numRuns: 1000 }
      );
    });
  });

  describe('splitChords token reconstruction', () => {
    it('should reconstruct input (minus word boundaries) from tokens', () => {
      fc.assert(
        fc.property(
          fc.string({ unit: 'grapheme-ascii' }),
          (input) => {
            localStorage.clear();
            // No chords stored => splitChords yields the whole string as one token
            const tokens = Array.from(splitChords(input));
            const reconstructed = tokens.map((t) => t.token).join('');
            expect(reconstructed).toBe(input);
            expect(tokens.every((t) => t.chordy === false)).toBe(true);
          }
        ),
        { numRuns: 1000 }
      );
    });

    it('should reconstruct input when chords are present', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              chord: fc.string({ minLength: 1, unit: 'grapheme-ascii' }),
              phrase: fc.string({ minLength: 1, unit: 'grapheme-ascii' }),
            }),
            { minLength: 1, maxLength: 5 }
          ),
          fc.string({ unit: 'grapheme-ascii' }),
          (chords, input) => {
            // Ensure unique phrases to avoid overlapping regex issues
            const uniquePhrases = new Set<string>();
            const dedupedChords = chords.filter((c) => {
              const p = c.phrase.toLowerCase();
              if (uniquePhrases.has(p)) return false;
              uniquePhrases.add(p);
              return true;
            });
            saveChords(dedupedChords);
            const tokens = Array.from(splitChords(input));
            const reconstructed = tokens.map((t) => t.token).join('');
            expect(reconstructed).toBe(input);
          }
        ),
        { numRuns: 1000 }
      );
    });
  });
});
