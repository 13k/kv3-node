export interface Position {
  offset: number;
  line: number;
  column: number;
}

export interface Source {
  input: Input;
  position: Position;
}

export interface FindPositionOptions {
  index?: number;
  word?: string;
}

export class Input {
  constructor(public src: string, public filename?: string) {}

  indexOf(pos: Position): number {
    let line = 1;
    let column = 1;

    for (let i = pos.offset; i < this.src.length; i++) {
      if (this.src[i] === "\n") {
        column = 1;
        line += 1;
      } else {
        column += 1;
      }

      if (pos.line === line && pos.column === column) {
        return this.src[i] === "\n" ? i + 1 : i;
      }
    }

    return -1;
  }

  positionAt(index: number, offsetPos?: Position): Position | null {
    offsetPos ||= { offset: 0, line: 1, column: 1 };

    let { line, column } = offsetPos;

    for (let i = offsetPos.offset; i < index; i++) {
      if (i === this.src.length) {
        return null;
      }

      if (this.src[i] === "\n") {
        column = 1;
        line += 1;
      } else {
        column += 1;
      }
    }

    return { offset: offsetPos.offset, line, column };
  }

  positionOf(word: string, offsetPos?: Position): Position | null {
    let src = this.src;

    if (offsetPos) {
      const offsetIndex = this.indexOf(offsetPos);

      if (offsetIndex === -1) {
        return null;
      }

      src = src.slice(offsetIndex);
    }

    const index = src.indexOf(word);

    if (index === -1) {
      return null;
    }

    return this.positionAt(index, offsetPos);
  }

  positionBy(options: FindPositionOptions, offsetPos?: Position): Position | null {
    if (options.index) {
      return this.positionAt(options.index, offsetPos);
    } else if (options.word) {
      return this.positionOf(options.word, offsetPos);
    }

    return null;
  }

  getContext(pos: Position, lines = 1): string {
    const startPos: Position = { offset: pos.offset, line: pos.line - lines, column: 1 };
    const endPos: Position = { offset: pos.offset, line: pos.line + lines + 1, column: 1 };
    const startIndex = this.indexOf(startPos);
    const endIndex = this.indexOf(endPos);

    return this.src.slice(startIndex, endIndex);
  }
}
