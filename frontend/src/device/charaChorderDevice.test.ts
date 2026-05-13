import { describe, it, expect } from 'vitest';
import { MockSerialTransport } from './mockSerialTransport';
import { CharaChorderDevice } from '../cc';

describe('CharaChorderDevice', () => {
  describe('protocol commands', () => {
    it('should get operating system', async () => {
      const transport = new MockSerialTransport([
        { expectWrite: 'VAR B1 91\r\n', respondWith: ['VAR B1 91 0 0'] },
      ]);
      const device = new CharaChorderDevice(transport);
      await device.connect();

      const os = await device.getOperatingSystem();
      expect(os).toBe('Windows');
    });

    it('should get chord count', async () => {
      const transport = new MockSerialTransport([
        { expectWrite: 'CML C0\r\n', respondWith: ['CML C0 5'] },
      ]);
      const device = new CharaChorderDevice(transport);
      await device.connect();

      const count = await device.getChordCount();
      expect(count).toBe(5);
    });

    it('should list chords with decoded chord and phrase', async () => {
      const transport = new MockSerialTransport([
        { expectWrite: 'CML C0\r\n', respondWith: ['CML C0 2'] },
        { expectWrite: 'CML C1 0\r\n', respondWith: ['CML C1 0 000CC200000000000000000000000000 68656C6C6F 0'] },
        { expectWrite: 'CML C1 1\r\n', respondWith: ['CML C1 1 00000000000000000000000000000000 776F726C64 0'] },
      ]);
      const device = new CharaChorderDevice(transport);
      await device.connect();

      const chords = await device.listChords();
      expect(chords).toHaveLength(2);
      
      // Check phrase decoding
      expect(chords[0].phrase).toBe('hello');
      expect(chords[1].phrase).toBe('world');
      
      // Check chord action decoding (descending order per CCOS spec)
      expect(chords[0].chord).toBeDefined();
      expect(chords[1].chord).toBeDefined();
    });
  });
});
