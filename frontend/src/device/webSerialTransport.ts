import type { SerialTransport, SerialPortInfo } from './serialTransport';

// CharaChorder device USB filters from DeviceManager
// https://github.com/CharaChorder/DeviceManager
export const CHARACHORDER_PORT_FILTERS: SerialPortFilter[] = [
  { usbProductId: 0x800f, usbVendorId: 0x239a }, // ONE M0
  { usbProductId: 0x8252, usbVendorId: 0x303a }, // TWO S3 (pre-production)
  { usbProductId: 0x8253, usbVendorId: 0x303a }, // TWO S3
  { usbProductId: 0x812e, usbVendorId: 0x303a }, // LITE S2
  { usbProductId: 0x801c, usbVendorId: 0x239a }, // LITE M0
  { usbProductId: 0x818b, usbVendorId: 0x303a }, // X
  { usbProductId: 0x1001, usbVendorId: 0x303a }, // M4G S3 (pre-production)
  { usbProductId: 0x829a, usbVendorId: 0x303a }, // M4G S3
  { usbProductId: 0x82f2, usbVendorId: 0x303a }, // CCB S2
];

export class WebSerialTransport implements SerialTransport {
  private port: SerialPort | null = null;
  private _readable: ReadableStream<Uint8Array> | null = null;
  private _writable: WritableStream<Uint8Array> | null = null;

  async open(options: { baudRate: number }): Promise<void> {
    if (!('serial' in navigator)) {
      throw new Error('Web Serial API is not available in this browser');
    }
    if (this.port) {
      throw new Error('Transport already open');
    }
    this.port = await navigator.serial.requestPort({
      filters: CHARACHORDER_PORT_FILTERS,
    });
    try {
      await this.port.open(options);
    } catch (error) {
      // Port may already be open from a previous session
      if (
        error instanceof DOMException &&
        error.name === 'InvalidStateError'
      ) {
        // Proceed — port is already open
      } else {
        this.port = null;
        throw error;
      }
    }
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
