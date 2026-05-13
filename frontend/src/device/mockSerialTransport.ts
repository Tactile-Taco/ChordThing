import type { SerialTransport, SerialPortInfo } from './serialTransport';

interface ExpectedInteraction {
  expectWrite?: string;
  respondWith: string[];
}

export class MockSerialTransport implements SerialTransport {
  private _readable: ReadableStream<Uint8Array> | null = null;
  private _writable: WritableStream<Uint8Array> | null = null;
  private _closed = false;
  private _opened = false;

  private readonly interactions: ExpectedInteraction[];
  private writeLog: string[] = [];
  private currentInteraction = 0;
  private readableController: ReadableStreamDefaultController<Uint8Array> | null = null;

  constructor(interactions: ExpectedInteraction[]) {
    this.interactions = interactions;
  }

  async open(_options: { baudRate: number }): Promise<void> {
    if (this._opened) {
      throw new Error('Already open');
    }
    this._opened = true;
    this._closed = false;
    this.writeLog = [];
    this.currentInteraction = 0;
    this.readableController = null;

    this._readable = new ReadableStream<Uint8Array>({
      start: (controller) => {
        this.readableController = controller;
      },
      pull: () => {
        // Push-based: responses are enqueued when writes happen
      },
    });

    this._writable = new WritableStream<Uint8Array>({
      write: (chunk) => {
        if (this._closed) {
          throw new Error('Transport closed');
        }
        const text = new TextDecoder().decode(chunk);
        this.writeLog.push(text);

        // Check if this write matches the expected command
        if (this.currentInteraction < this.interactions.length) {
          const interaction = this.interactions[this.currentInteraction];
          const expected = interaction.expectWrite;
          if (expected && text.trim() !== expected.trim()) {
            throw new Error(
              `Unexpected write: "${text.trim()}". Expected: "${expected.trim()}"`
            );
          }
          // Enqueue the responses immediately
          const encoder = new TextEncoder();
          for (const response of interaction.respondWith) {
            this.readableController?.enqueue(encoder.encode(response + '\r\n'));
          }
          this.currentInteraction++;
        }
      },
    });
  }

  async close(): Promise<void> {
    this._closed = true;
    this._opened = false;
    // Only close controller if it's not already closed
    try {
      this.readableController?.close();
    } catch {
      // Controller may already be closed
    }
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

  // Test helpers
  getWrites(): string[] {
    return this.writeLog;
  }

  assertAllInteractionsUsed(): void {
    if (this.currentInteraction < this.interactions.length) {
      throw new Error(
        `Not all interactions used. Expected ${this.interactions.length}, got ${this.currentInteraction}`
      );
    }
  }
}
