import { describe, it, expect } from 'vitest';
import { MockSerialTransport } from './mockSerialTransport';
import { CharaChorderDevice } from '../cc';

describe('CharaChorderDevice', () => {
  describe('protocol commands', () => {
    it('should get operating system', async () => {
      const transport = new MockSerialTransport([
        'VAR B1 91 0 0',
      ]);
      const device = new CharaChorderDevice(transport);
      await device.connect();

      const os = await device.getOperatingSystem();
      expect(os).toBe('Windows');
    });

    it('should get chord count', async () => {
      const transport = new MockSerialTransport([
        'CML C0 5',
      ]);
      const device = new CharaChorderDevice(transport);
      await device.connect();

      const count = await device.getChordCount();
      expect(count).toBe(5);
    });

    it('should list chords', async () => {
      const transport = new MockSerialTransport([
        'CML C0 2',
        'CML C1 0 000CC200000000000000000000000000 68656C6C6F',
        'CML C1 1 00000000000000000000000000000000 776F726C64',
      ]);
      const device = new CharaChorderDevice(transport);
      await device.connect();

      const chords = await device.listChords();
      expect(chords).toHaveLength(2);
      expect(chords[0].phrase).toBe('hello');
      expect(chords[1].phrase).toBe('world');
    });
  });
});
