import { describe, it, expect } from 'vitest';
import { KEYMAP_CODES, getActionName } from './keymap';

describe('keymap', () => {
  describe('KEYMAP_CODES', () => {
    it('should contain known action codes', () => {
      expect(KEYMAP_CODES.get(32)).toEqual({ id: 'SPACE', display: 'SPACE' });
      expect(KEYMAP_CODES.get(65)).toEqual({ id: 'A', display: 'A' });
      expect(KEYMAP_CODES.get(296)).toEqual({ id: 'ENTER', display: 'ENTER' });
    });

    it('should have entries for ASCII printable range', () => {
      for (let i = 32; i <= 126; i++) {
        expect(KEYMAP_CODES.has(i)).toBe(true);
      }
    });
  });

  describe('getActionName', () => {
    it('should return display name for known codes', () => {
      expect(getActionName(32)).toBe('SPACE');
      expect(getActionName(296)).toBe('ENTER');
    });

    it('should return ASCII character for printable range', () => {
      expect(getActionName(65)).toBe('A');
      expect(getActionName(97)).toBe('a');
    });

    it('should return Unknown for unrecognized codes', () => {
      expect(getActionName(9999)).toBe('Unknown(9999)');
    });
  });
});
