import { describe, it, expect } from 'vitest';
import { LineBreakTransformer } from './lineBreakTransformer';

describe('LineBreakTransformer', () => {
  function createTransformer(): LineBreakTransformer {
    return new LineBreakTransformer();
  }

  function enqueueChunks(
    transformer: LineBreakTransformer,
    chunks: string[]
  ): string[] {
    const lines: string[] = [];
    const controller = {
      enqueue: (line: string) => lines.push(line),
      desiredSize: 1,
      error: () => {},
      terminate: () => {},
    } as unknown as TransformStreamDefaultController<string>;

    for (const chunk of chunks) {
      transformer.transform(chunk, controller);
    }

    return lines;
  }

  describe('basic line splitting', () => {
    it('should split a single line ending with CRLF', () => {
      const transformer = createTransformer();
      const lines = enqueueChunks(transformer, ['hello\r\n']);
      expect(lines).toEqual(['hello']);
    });

    it('should split multiple lines in one chunk', () => {
      const transformer = createTransformer();
      const lines = enqueueChunks(transformer, ['line1\r\nline2\r\n']);
      expect(lines).toEqual(['line1', 'line2']);
    });

    it('should handle an empty line (CRLF immediately)', () => {
      const transformer = createTransformer();
      const lines = enqueueChunks(transformer, ['\r\n']);
      expect(lines).toEqual(['']);
    });
  });

  describe('chunked input', () => {
    it('should handle line split across chunks', () => {
      const transformer = createTransformer();
      const lines1 = enqueueChunks(transformer, ['hel']);
      expect(lines1).toEqual([]);

      const lines2 = enqueueChunks(transformer, ['lo\r\n']);
      expect(lines2).toEqual(['hello']);
    });

    it('should handle CRLF split across chunks', () => {
      const transformer = createTransformer();
      const lines1 = enqueueChunks(transformer, ['hello\r']);
      expect(lines1).toEqual([]);

      const lines2 = enqueueChunks(transformer, ['\nworld\r\n']);
      expect(lines2).toEqual(['hello', 'world']);
    });

    it('should handle multiple chunks building one line', () => {
      const transformer = createTransformer();
      enqueueChunks(transformer, ['V']);
      enqueueChunks(transformer, ['ER']);
      const lines = enqueueChunks(transformer, ['SION 2.2.0\r\n']);
      expect(lines).toEqual(['VERSION 2.2.0']);
    });
  });

  describe('flush', () => {
    it('should emit remaining buffer on flush', () => {
      const transformer = createTransformer();
      const lines: string[] = [];
      const controller = {
        enqueue: (line: string) => lines.push(line),
        desiredSize: 1,
        error: () => {},
        terminate: () => {},
      } as unknown as TransformStreamDefaultController<string>;

      transformer.transform('unterminated', controller);
      expect(lines).toEqual([]);

      transformer.flush(controller);
      expect(lines).toEqual(['unterminated']);
    });

    it('should not emit empty buffer on flush', () => {
      const transformer = createTransformer();
      const lines: string[] = [];
      const controller = {
        enqueue: (line: string) => lines.push(line),
        desiredSize: 1,
        error: () => {},
        terminate: () => {},
      } as unknown as TransformStreamDefaultController<string>;

      transformer.flush(controller);
      expect(lines).toEqual([]);
    });
  });

  describe('edge cases', () => {
    it('should handle empty chunks', () => {
      const transformer = createTransformer();
      const lines = enqueueChunks(transformer, ['', 'hello\r\n', '']);
      expect(lines).toEqual(['hello']);
    });

    it('should handle multiple consecutive CRLF', () => {
      const transformer = createTransformer();
      const lines = enqueueChunks(transformer, ['a\r\n\r\nb\r\n']);
      expect(lines).toEqual(['a', '', 'b']);
    });

    it('should handle trailing CRLF', () => {
      const transformer = createTransformer();
      const lines = enqueueChunks(transformer, ['hello\r\n']);
      expect(lines).toEqual(['hello']);
    });
  });
});
