export interface SerialPortInfo {
  usbVendorId?: number;
  usbProductId?: number;
}

export interface SerialTransport {
  open(options: { baudRate: number }): Promise<void>;
  close(): Promise<void>;
  readonly readable: ReadableStream<Uint8Array>;
  readonly writable: WritableStream<Uint8Array>;
  getInfo(): SerialPortInfo;
}
