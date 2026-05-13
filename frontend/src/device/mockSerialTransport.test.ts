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

  describe('readable stream', () => {
    it('replays a single response', async () => {
      const transport = new MockSerialTransport(['hello']);
      await transport.open({ baudRate: 115200 });

      const reader = transport.readable.getReader();
      const { value } = await reader.read();
      expect(new TextDecoder().decode(value)).toBe('hello\r\n');
      await reader.cancel();
      await transport.close();
    });

    it('replays multiple responses in sequence', async () => {
      const transport = new MockSerialTransport(['one', 'two', 'three']);
      await transport.open({ baudRate: 115200 });

      const reader = transport.readable.getReader();
      const chunks: Uint8Array[] = [];
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        chunks.push(value!);
      }

      const decoder = new TextDecoder();
      expect(chunks.map((c) => decoder.decode(c))).toEqual([
        'one\r\n',
        'two\r\n',
        'three\r\n',
      ]);
      await transport.close();
    });

    it('closes the stream when all responses are consumed', async () => {
      const transport = new MockSerialTransport(['done']);
      await transport.open({ baudRate: 115200 });

      const reader = transport.readable.getReader();
      const r1 = await reader.read();
      expect(r1.done).toBe(false);
      const r2 = await reader.read();
      expect(r2.done).toBe(true);
      await transport.close();
    });
  });

  describe('writable stream', () => {
    it('accepts writes without error', async () => {
      const transport = new MockSerialTransport([]);
      await transport.open({ baudRate: 115200 });

      const writer = transport.writable.getWriter();
      const data = new TextEncoder().encode('test command\r\n');
      await writer.write(data);
      await writer.close();
      await transport.close();
    });

    it('throws on write after close', async () => {
      const transport = new MockSerialTransport([]);
      await transport.open({ baudRate: 115200 });
      const writer = transport.writable.getWriter();
      await transport.close();

      const data = new TextEncoder().encode('x');
      await expect(writer.write(data)).rejects.toThrow('Transport closed');
    });
  });

  describe('integration with TextDecoderStream and LineBreakTransformer', () => {
    it('pipes through TextDecoderStream + LineBreakTransformer correctly', async () => {
      const transport = new MockSerialTransport([
        'VERSION 2.2.0',
        'OK',
        'ID CharaChorder',
      ]);
      await transport.open({ baudRate: 115200 });

      const lines: string[] = [];
      const lineBreakTransform = new TransformStream(
        new LineBreakTransformer()
      );

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

      // Allow microtasks to process the stream pipeline
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(lines).toEqual(['VERSION 2.2.0', 'OK', 'ID CharaChorder']);
      await transport.close();
    });

    it('handles responses split across chunks with LineBreakTransformer', async () => {
      // Simulate a long response that may be split by the mock's per-response framing
      const transport = new MockSerialTransport([
        'first line',
        'second line',
      ]);
      await transport.open({ baudRate: 115200 });

      const lines: string[] = [];
      const lineBreakTransform = new TransformStream(
        new LineBreakTransformer()
      );

      await transport.readable
        .pipeThrough(new TextDecoderStream() as unknown as TransformStream<Uint8Array, string>)
        .pipeThrough(lineBreakTransform)
        .pipeTo(
          new WritableStream({
            write(line) {
              lines.push(line);
            },
          })
        );

      expect(lines).toEqual(['first line', 'second line']);
      await transport.close();
    });
  });
});
