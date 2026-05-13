import { describe, it, expect } from 'vitest';
import { MockSerialTransport } from './mockSerialTransport';
import { LineBreakTransformer } from './lineBreakTransformer';

describe('MockSerialTransport', () => {
  describe('basic lifecycle', () => {
    it('can be opened and closed', async () => {
      const transport = new MockSerialTransport([]);
      await transport.open({ baudRate: 115200 });
      await transport.close();
    });

    it('throws when accessing readable before open', () => {
      const transport = new MockSerialTransport([]);
      expect(() => transport.readable).toThrow('Transport not open');
    });

    it('throws when accessing writable before open', () => {
      const transport = new MockSerialTransport([]);
      expect(() => transport.writable).toThrow('Transport not open');
    });

    it('throws when opening twice', async () => {
      const transport = new MockSerialTransport([]);
      await transport.open({ baudRate: 115200 });
      await expect(transport.open({ baudRate: 115200 })).rejects.toThrow(
        'Already open'
      );
    });
  });

  describe('getInfo', () => {
    it('returns fake SerialPortInfo', () => {
      const transport = new MockSerialTransport([]);
      expect(transport.getInfo()).toEqual({
        usbVendorId: 0x1234,
        usbProductId: 0x5678,
      });
    });
  });

  describe('request-driven responses', () => {
    it('emits response after matching command is written', async () => {
      const transport = new MockSerialTransport([
        { expectWrite: 'VERSION\r\n', respondWith: ['VERSION 2.2.0'] },
      ]);
      await transport.open({ baudRate: 115200 });

      const reader = transport.readable.getReader();
      const writer = transport.writable.getWriter();

      // Write the expected command
      await writer.write(new TextEncoder().encode('VERSION\r\n'));

      // Now the response should be available
      const { value } = await reader.read();
      expect(new TextDecoder().decode(value)).toBe('VERSION 2.2.0\r\n');

      await reader.cancel();
      await writer.close();
      await transport.close();
    });

    it('throws on unexpected write', async () => {
      const transport = new MockSerialTransport([
        { expectWrite: 'VERSION\r\n', respondWith: ['VERSION 2.2.0'] },
      ]);
      await transport.open({ baudRate: 115200 });

      const writer = transport.writable.getWriter();
      await expect(
        writer.write(new TextEncoder().encode('WRONG_COMMAND\r\n'))
      ).rejects.toThrow('Unexpected write');

      await transport.close();
    });

    it('records all writes for verification', async () => {
      const transport = new MockSerialTransport([
        { expectWrite: 'CMD1\r\n', respondWith: ['OK'] },
        { expectWrite: 'CMD2\r\n', respondWith: ['DONE'] },
      ]);
      await transport.open({ baudRate: 115200 });

      const writer = transport.writable.getWriter();
      await writer.write(new TextEncoder().encode('CMD1\r\n'));
      await writer.write(new TextEncoder().encode('CMD2\r\n'));
      await writer.close();

      expect(transport.getWrites()).toEqual(['CMD1\r\n', 'CMD2\r\n']);
      await transport.close();
    });

    it('asserts all interactions were used', async () => {
      const transport = new MockSerialTransport([
        { expectWrite: 'CMD1\r\n', respondWith: ['OK'] },
      ]);
      await transport.open({ baudRate: 115200 });

      // Don't write anything
      expect(() => transport.assertAllInteractionsUsed()).toThrow(
        'Not all interactions used'
      );

      await transport.close();
    });
  });

  describe('integration with TextDecoderStream and LineBreakTransformer', () => {
    it('pipes through TextDecoderStream + LineBreakTransformer correctly', async () => {
      const transport = new MockSerialTransport([
        { expectWrite: 'VERSION\r\n', respondWith: ['VERSION 2.2.0', 'ID CharaChorder'] },
      ]);
      await transport.open({ baudRate: 115200 });

      const lines: string[] = [];
      const lineBreakTransform = new TransformStream(
        new LineBreakTransformer()
      );

      // Start reading
      transport.readable
        .pipeThrough(new TextDecoderStream() as unknown as TransformStream<Uint8Array, string>)
        .pipeThrough(lineBreakTransform)
        .pipeTo(
          new WritableStream({
            write(line) {
              lines.push(line);
            },
          })
        );

      // Write command to trigger responses
      const writer = transport.writable.getWriter();
      await writer.write(new TextEncoder().encode('VERSION\r\n'));
      await new Promise((resolve) => setTimeout(resolve, 50));
      await writer.close();

      // Allow time for stream processing
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(lines).toEqual(['VERSION 2.2.0', 'ID CharaChorder']);
      await transport.close();
    });
  });
});
