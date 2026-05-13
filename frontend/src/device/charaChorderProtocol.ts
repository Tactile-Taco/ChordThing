import type { SerialTransport } from './serialTransport';

export interface ChordData {
  actions: number[];
  phrase: string;
}

export class CharaChorderProtocol {
  private transport: SerialTransport;
  private reader: ReadableStreamDefaultReader<string> | null = null;
  private writer: WritableStreamDefaultWriter<string> | null = null;
  private readableStreamClosed: Promise<void> | null = null;
  private writableStreamClosed: Promise<void> | null = null;

  constructor(transport: SerialTransport) {
    this.transport = transport;
  }

  async connect(): Promise<void> {
    await this.transport.open({ baudRate: 115200 });

    const decoder = new TextDecoderStream();
    this.readableStreamClosed = this.transport.readable.pipeTo(decoder.writable as WritableStream<Uint8Array>);
    this.reader = decoder.readable.getReader();

    const encoder = new TextEncoderStream();
    this.writableStreamClosed = encoder.readable.pipeTo(this.transport.writable);
    this.writer = encoder.writable.getWriter();
  }

  async disconnect(): Promise<void> {
    if (this.reader) {
      await this.reader.cancel();
      await this.readableStreamClosed?.catch(() => {});
      this.reader = null;
      this.readableStreamClosed = null;
    }

    if (this.writer) {
      await this.writer.close();
      await this.writableStreamClosed;
      this.writer = null;
      this.writableStreamClosed = null;
    }

    await this.transport.close();
  }

  async sendCommand(command: string): Promise<string[]> {
    await this.writer!.write(command + '\r\n');
    return this.readResponse();
  }

  private async readResponse(): Promise<string[]> {
    let response = '';
    while (true) {
      const { value, done } = await this.reader!.read();
      if (done) {
        break;
      }
      response += value;
      if (response.includes('\r\n')) {
        break;
      }
    }
    return response.trim().split(' ');
  }

  async getOperatingSystem(): Promise<string> {
    const response = await this.sendCommand('VAR B1 91');
    if (response.length < 5) {
      throw new Error('Unexpected response format');
    }
    const value = response[3];
    const status = response[4];
    if (status !== '0') {
      throw new Error(`Failed to get operating system. Status: ${status}`);
    }
    const osCode = parseInt(value, 10);
    const osMap: Record<number, string> = {
      0: 'Windows',
      1: 'MacOS',
      2: 'Linux',
      3: 'iOS',
      4: 'Android',
      255: 'Unknown',
    };
    return osMap[osCode] || 'Unknown';
  }

  async getChordCount(): Promise<number> {
    const response = await this.sendCommand('CML C0');
    if (response.length < 3) {
      throw new Error('Unexpected response format for chord count');
    }
    return parseInt(response[2], 10);
  }

  async getChord(index: number): Promise<ChordData> {
    const response = await this.sendCommand(`CML C1 ${index}`);
    if (response.length < 5) {
      throw new Error('Unexpected response format for chord');
    }
    const actions = this.parseChordActions(response[3]);
    const phrase = this.parsePhraseHex(response[4]);
    return { actions, phrase };
  }

  private parseChordActions(hexString: string): number[] {
    const bigInt = BigInt(`0x${hexString}`);
    const actions: number[] = [];
    for (let i = 0; i < 12; i++) {
      const action = Number((bigInt >> BigInt(10 * i)) & BigInt(0x3ff));
      if (action !== 0) {
        actions.unshift(action);
      }
    }
    return actions;
  }

  private parsePhraseHex(hexString: string): string {
    const pairs = hexString.match(/.{2}/g);
    return pairs ? pairs.map((hex) => String.fromCharCode(parseInt(hex, 16))).join('') : '';
  }
}
