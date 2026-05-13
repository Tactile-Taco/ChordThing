import type { SerialTransport, SerialPortInfo } from './serialTransport';

export class MockSerialTransport implements SerialTransport {
  private _readable: ReadableStream<Uint8Array> | null = null;
  private _writable: WritableStream<Uint8Array> | null = null;
  private _closed = false;
  private _opened = false;

  private readonly responses: string[];

  constructor(responses: string[]) {
    this.responses = responses;
  }

  async open(_options: { baudRate: number }): Promise<void> {
    if (this._opened) {
      throw new Error('Already open');
    }
    this._opened = true;
    this._closed = false;

    const encoder = new TextEncoder();
    const responseQueue = this.responses.map((r) => encoder.encode(r + '\r\n'));
    let index = 0;

    this._readable = new ReadableStream<Uint8Array>({
      pull: (controller) => {
        if (this._closed) {
          controller.close();
          return;
        }
        if (index < responseQueue.length) {
          controller.enqueue(responseQueue[index++]);
        } else {
          controller.close();
        }
      },
    });

    this._writable = new WritableStream<Uint8Array>({
      write: () => {
        if (this._closed) {
          throw new Error('Transport closed');
        }
      },
    });
  }

  async close(): Promise<void> {
    this._closed = true;
    this._opened = false;
  }

  get readable(): ReadableStream<Uint8Array> {
    if (!this._readable) {
      throw new Error('Transport not open');
    }
    return this._readable;
  }

  get writable(): WritableStream<Uint8Array> {
    if (!this._writable) {
      throw new Error('Transport not open');
    }
    return this._writable;
  }

  getInfo(): SerialPortInfo {
    return { usbVendorId: 0x1234, usbProductId: 0x5678 };
  }
}
