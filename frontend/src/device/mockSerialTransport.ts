import type { SerialTransport, SerialPortInfo } from './serialTransport';

interface ExpectedInteraction {
  expectWrite?: string;
  respondWith: string[];
}

export interface ChaosConfig {
  chaosLevel: number;
  seed?: number;
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

  private readonly chaosLevel: number;
  private rng: () => number;

  constructor(interactions: ExpectedInteraction[], chaosConfig?: ChaosConfig) {
    this.interactions = interactions;
    this.chaosLevel = Math.max(0, Math.min(1, chaosConfig?.chaosLevel ?? 0));
    this.rng = this._createRng(chaosConfig?.seed);
  }

  private _createRng(seed?: number): () => number {
    if (seed === undefined) {
      return () => Math.random();
    }
    // Simple LCG for reproducible seeded randomness
    let s = seed;
    return () => {
      s = (s * 16807 + 0) % 2147483647;
      return (s - 1) / 2147483646;
    };
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
          // Enqueue the responses (with optional chaos)
          const encoder = new TextEncoder();
          for (const response of interaction.respondWith) {
            this._enqueueWithChaos(encoder.encode(response + '\r\n'));
          }
          this.currentInteraction++;
        } else {
          throw new Error(
            `Unexpected write with no remaining interactions: "${text.trim()}"`
          );
        }
      },
    });
  }

  private _enqueueWithChaos(data: Uint8Array): void {
    if (this.chaosLevel <= 0 || !this.readableController) {
      this.readableController?.enqueue(data);
      return;
    }

    // 1. Drop response
    if (this.rng() < this.chaosLevel * 0.25) {
      return;
    }

    let payload = new Uint8Array(data);

    // 2. Corrupt response data
    if (this.rng() < this.chaosLevel * 0.25) {
      const numCorruptions = Math.max(1, Math.floor(this.rng() * 3));
      for (let i = 0; i < numCorruptions; i++) {
        const idx = Math.floor(this.rng() * payload.length);
        payload[idx] = Math.floor(this.rng() * 256);
      }
    }

    // 3. Close stream unexpectedly mid-response
    if (this.rng() < this.chaosLevel * 0.25) {
      // Enqueue partial data then close
      const partialLength = Math.floor(this.rng() * payload.length);
      if (partialLength > 0) {
        this.readableController.enqueue(payload.slice(0, partialLength));
      }
      try {
        this.readableController.close();
      } catch {
        // ignore if already closed
      }
      this._closed = true;
      return;
    }

    // 4. Delay response
    if (this.rng() < this.chaosLevel * 0.25) {
      const delayMs = Math.floor(this.rng() * 500 * this.chaosLevel) + 50;
      setTimeout(() => {
        if (!this._closed && this.readableController) {
          try {
            this.readableController.enqueue(payload);
          } catch {
            // Controller may be closed
          }
        }
      }, delayMs);
      return;
    }

    this.readableController.enqueue(payload);
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
