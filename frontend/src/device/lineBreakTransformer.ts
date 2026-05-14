export class LineBreakTransformer implements Transformer<string, string> {
  private buffer = '';

  transform(
    chunk: string,
    controller: TransformStreamDefaultController<string>
  ): void {
    this.buffer += chunk;
    let index: number;

    while ((index = this.buffer.indexOf('\r\n')) !== -1) {
      const line = this.buffer.substring(0, index);
      controller.enqueue(line);
      this.buffer = this.buffer.substring(index + 2);
    }
  }

  flush(controller: TransformStreamDefaultController<string>): void {
    if (this.buffer.length > 0) {
      controller.enqueue(this.buffer);
    }
  }
}
