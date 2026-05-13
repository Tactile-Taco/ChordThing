import type { SerialTransport, SerialPortInfo } from './serialTransport';

export class WebSerialTransport implements SerialTransport {
  private port: SerialPort | null = null;
  private _readable: ReadableStream<Uint8Array> | null = null;
  private _writable: WritableStream<Uint8Array> | null = null;

  async open(options: { baudRate: number }): Promise<void> {
    this.port = await navigator.serial.requestPort();
    await this.port.open(options);
    this._readable = this.port.readable;
    this._writable = this.port.writable;
  }

  async close(): Promise<void> {
    if (this.port) {
      await this.port.close();
      this.port = null;
      this._readable = null;
      this._writable = null;
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
    if (!this.port) {
      throw new Error('Transport not open');
    }
    // Web Serial API getInfo() may not be in all TypeScript DOM typings
    return (this.port as unknown as { getInfo(): SerialPortInfo }).getInfo();
  }
}
