import type { SerialTransport } from './device/serialTransport';
import { WebSerialTransport } from './device/webSerialTransport';
import { getActionName } from './device/keymap';

export interface KeymapAction {
  id: string;
  display: string;
}

export class SerialTimeoutError extends Error {
  constructor(
    message: string,
    public readonly command: string,
  ) {
    super(message);
    this.name = 'SerialTimeoutError';
  }
}

export class CharaChorderDevice {
  private transport: SerialTransport | null = null;
  private reader: ReadableStreamDefaultReader<string> | null = null;
  private writer: WritableStreamDefaultWriter<string> | null = null;
  private readableStreamClosed: Promise<void> | null = null;
  private writableStreamClosed: Promise<void> | null = null;
  private decoder: TextDecoderStream | null = null;
  private encoder: TextEncoderStream | null = null;
  private debug = false;

  constructor(transport?: SerialTransport) {
    this.transport = transport ?? null;
  }

  private log(...args: unknown[]): void {
    if (this.debug) {
      console.log(...args);
    }
  }

  async connect(): Promise<void> {
    try {
      if (!this.transport) {
        // Default: use Web Serial API
        this.transport = new WebSerialTransport();
      }
      await this.transport.open({ baudRate: 115200 });

      this.decoder = new TextDecoderStream();
      this.readableStreamClosed = this.transport.readable.pipeTo(
        this.decoder.writable as WritableStream<Uint8Array>,
      );
      this.reader = this.decoder.readable.getReader();

      this.encoder = new TextEncoderStream();
      this.writableStreamClosed = this.encoder.readable.pipeTo(
        this.transport.writable,
      );
      this.writer = this.encoder.writable.getWriter();
    } catch (error) {
      console.error('Error connecting to device:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    // Clean up reader / decoder pipe first to unlock port.readable
    if (this.reader) {
      await this.reader.cancel();
      // Abort decoder.writable to break the pipeTo and release the lock
      // on port.readable.  We keep the promise in readableStreamClosed
      // but ignore its result.
      await this.readableStreamClosed?.catch(() => {});
      this.reader = null;
      this.readableStreamClosed = null;
    }
    if (this.decoder) {
      try {
        this.decoder.writable.abort();
      } catch {
        // ignore — may already be aborted/closed
      }
      this.decoder = null;
    }

    // Clean up writer / encoder pipe to unlock port.writable
    if (this.writer) {
      await this.writer.close();
      await this.writableStreamClosed?.catch(() => {});
      this.writer = null;
      this.writableStreamClosed = null;
    }
    if (this.encoder) {
      try {
        this.encoder.readable.cancel();
      } catch {
        // ignore — may already be canceled/closed
      }
      this.encoder = null;
    }

    if (this.transport) {
      await this.transport.close();
      this.transport = null;
    }
  }

  async sendCommand(command: string, timeoutMs = 5000): Promise<string[]> {
    if (!this.writer) {
      throw new Error('Device not connected');
    }
    this.log('Sending command:', command);
    await this.writer.write(command + '\r\n');
    return this.readResponse(command, timeoutMs);
  }

  async readResponse(command: string, timeoutMs: number): Promise<string[]> {
    if (!this.reader) {
      throw new Error('Device not connected');
    }

    const timeout = new Promise<never>((_, reject) => {
      const id = setTimeout(() => {
        reject(new SerialTimeoutError(`Command "${command}" timed out after ${timeoutMs}ms`, command));
      }, timeoutMs);
      // Allow Node.js to exit if this is the only pending timer (test env)
      if (typeof id === 'object' && 'unref' in id) {
        (id as { unref(): void }).unref();
      }
    });

    const read = async (): Promise<string[]> => {
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
      this.log('Received response:', response.trim());
      return response.trim().split(' ');
    };

    return Promise.race([read(), timeout]);
  }

  async getOperatingSystem(): Promise<string> {
    try {
      const response = await this.sendCommand('VAR B1 91');
      this.log('OS response:', response);
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
    } catch (error) {
      console.error('Error in getOperatingSystem:', error);
      throw error;
    }
  }

  async getKeymap(): Promise<string[][]> {
    const keymaps: string[][] = [];
    for (let layer = 1; layer <= 3; layer++) {
      const layerMap: string[] = [];
      for (let keyIndex = 0; keyIndex < 90; keyIndex++) {
        try {
          const response = await this.sendCommand(`VAR B3 A${layer} ${keyIndex}`);
          this.log(`Keymap response for layer ${layer}, key ${keyIndex}:`, response);
          if (response.length < 6) {
            throw new Error('Unexpected response format');
          }
          const actionId = parseInt(response[4], 10);
          layerMap.push(this.getActionName(actionId));
        } catch (error) {
          console.error(`Error getting keymap for layer ${layer}, key ${keyIndex}:`, error);
          layerMap.push('Unknown');
        }
      }
      keymaps.push(layerMap);
    }
    return keymaps;
  }

  async getChordCount(): Promise<number> {
    const response = await this.sendCommand('CML C0');
    this.log('Chord count response:', response);
    if (response.length < 3) {
      throw new Error('Unexpected response format for chord count');
    }
    return parseInt(response[2], 10);
  }

  async listChords(): Promise<{ chord: string; phrase: string }[]> {
    try {
      const chordCount = await this.getChordCount();
      const chords: { chord: string; phrase: string }[] = [];

      for (let i = 0; i < chordCount; i++) {
        const response = await this.sendCommand(`CML C1 ${i}`);
        this.log(`Chord response for index ${i}:`, response);
        if (response.length < 6) {
          throw new Error('Unexpected response format for chord');
        }
        const status = response[5];
        if (status !== '0') {
          throw new Error(`Failed to get chord at index ${i}. Status: ${status}`);
        }
        const actions = this.parseChordActions(response[3]);
        const phrase = this.parsePhraseHex(response[4]);
        chords.push({
          chord: actions.map((action) => this.getActionName(action)).join('+'),
          phrase,
        });
      }

      return chords;
    } catch (error) {
      console.error('Error in listChords:', error);
      throw error;
    }
  }

  private parseChordActions(hexString: string): number[] {
    const bigInt = BigInt(`0x${hexString}`);
    const actions: number[] = [];
    // Key 1 is at highest bits (bits 118-127), Key 12 at lowest (bits 8-17)
    // Read from high to low to maintain descending order
    for (let i = 0; i < 12; i++) {
      const action = Number((bigInt >> BigInt(10 * (11 - i))) & BigInt(0x3ff));
      if (action !== 0) {
        actions.push(action);
      }
    }
    return actions;
  }

  private parsePhraseHex(hexString: string): string {
    if (hexString.length % 2 !== 0) {
      throw new Error(`Invalid hex phrase: odd length (${hexString.length})`);
    }
    const pairs = hexString.match(/.{2}/g);
    if (!pairs) return '';
    return pairs.map((hex) => {
      const code = parseInt(hex, 16);
      if (Number.isNaN(code)) {
        throw new Error(`Invalid hex phrase: non-hex pair "${hex}"`);
      }
      return String.fromCharCode(code);
    }).join('');
  }

  private getActionName(actionId: number): string {
    return getActionName(actionId);
  }
}
