import { describe, it, expect } from 'vitest';
import { MockSerialTransport } from './mockSerialTransport';
import { CharaChorderProtocol } from './charaChorderProtocol';

describe('CharaChorderProtocol', () => {
  describe('getOperatingSystem', () => {
    it('should return Windows for OS code 0', async () => {
      const transport = new MockSerialTransport([
        { expectWrite: 'VAR B1 91\r\n', respondWith: ['VAR B1 91 0 0'] },
      ]);
      const protocol = new CharaChorderProtocol(transport);
      await protocol.connect();

      const os = await protocol.getOperatingSystem();
      expect(os).toBe('Windows');
    });

    it('should return MacOS for OS code 1', async () => {
      const transport = new MockSerialTransport([
        { expectWrite: 'VAR B1 91\r\n', respondWith: ['VAR B1 91 1 0'] },
      ]);
      const protocol = new CharaChorderProtocol(transport);
      await protocol.connect();

      const os = await protocol.getOperatingSystem();
      expect(os).toBe('MacOS');
    });

    it('should return Linux for OS code 2', async () => {
      const transport = new MockSerialTransport([
        { expectWrite: 'VAR B1 91\r\n', respondWith: ['VAR B1 91 2 0'] },
      ]);
      const protocol = new CharaChorderProtocol(transport);
      await protocol.connect();

      const os = await protocol.getOperatingSystem();
      expect(os).toBe('Linux');
    });

    it('should throw on non-zero status', async () => {
      const transport = new MockSerialTransport([
        { expectWrite: 'VAR B1 91\r\n', respondWith: ['VAR B1 91 0 1'] },
      ]);
      const protocol = new CharaChorderProtocol(transport);
      await protocol.connect();

      await expect(protocol.getOperatingSystem()).rejects.toThrow('Failed to get operating system');
    });
  });

  describe('getChordCount', () => {
    it('should parse chord count', async () => {
      const transport = new MockSerialTransport([
        { expectWrite: 'CML C0\r\n', respondWith: ['CML C0 42'] },
      ]);
      const protocol = new CharaChorderProtocol(transport);
      await protocol.connect();

      const count = await protocol.getChordCount();
      expect(count).toBe(42);
    });
  });

  describe('getChord', () => {
    it('should parse chord actions and phrase', async () => {
      const transport = new MockSerialTransport([
        { expectWrite: 'CML C1 0\r\n', respondWith: ['CML C1 0 000CC200000000000000000000000000 68656C6C6F 0'] },
      ]);
      const protocol = new CharaChorderProtocol(transport);
      await protocol.connect();

      const chord = await protocol.getChord(0);
      expect(chord.actions).toEqual([51, 32]);
      expect(chord.phrase).toBe('hello');
    });
  });

  describe('sendCommand', () => {
    it('should send command and return response parts', async () => {
      const transport = new MockSerialTransport([
        { expectWrite: 'VERSION\r\n', respondWith: ['VERSION 2.2.0'] },
      ]);
      const protocol = new CharaChorderProtocol(transport);
      await protocol.connect();

      const response = await protocol.sendCommand('VERSION');
      expect(response).toEqual(['VERSION', '2.2.0']);
    });
  });
});
