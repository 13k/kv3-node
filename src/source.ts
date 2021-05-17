/**
 * Represents a (`line`, `column`) position in the source code.
 */
export interface Position {
  /** Source line number. Value starts at `1`. A value lower than `1` is treated as error or ignored. */
  line: number;
  /** Source column number. Value starts at `1`. A value lower than `1` is treated as error or ignored. */
  column: number;
}

/**
 * Contains a `source` and a pointer `position`.
 *
 * It can be used to represent a slice of `source` starting at `position`, or, for example, to
 * indicate a `position` in `source` where an error happened.
 */
export interface SourcePosition {
  source: Source;
  position: Position;
}

/** Represents a {@link Source} with non-null `filename` property. */
export interface NamedSource extends Source {
  filename: string;
}

/** Source code abstraction over a raw string. */
export class Source {
  /**
   * @param data Source data
   * @param filename Filename for error messages
   */
  constructor(public data: string, public filename?: string) {}

  /** Checks if this Source has a filename present. */
  hasFilename(): this is NamedSource {
    return this.filename != null;
  }

  /**
   * Finds the index in source data for the given position.
   *
   * @returns If `position` contains invalid values, it returns `-1` (see {@link Position}).
   *   If `position` could not be found in source data, it returns `-1`.
   */
  indexOf(pos: Position): number {
    if (pos.line < 1 || pos.column < 1) {
      return -1;
    }

    if (this.data.length === 0) {
      return -1;
    }

    let line = this.data[0] === "\n" ? 0 : 1;
    let column = 0;

    for (let i = 0; i < this.data.length; i++) {
      if (this.data[i] === "\n") {
        column = 0;
        line += 1;
        continue;
      }

      column += 1;

      if (pos.line === line && pos.column === column) {
        return i;
      }

      if ((line === pos.line && column > pos.column) || line > pos.line) {
        return -1;
      }
    }

    return -1;
  }

  /**
   * Calculates the position at given index.
   *
   * @param index Source data index
   * @returns If index could not be found (out-of-bounds), returns `null`.
   */
  positionAt(index: number): Position | null {
    if (index < 0 || index >= this.data.length) {
      return null;
    }

    if (index === 0) {
      return { line: 1, column: 1 };
    }

    let line = 1;
    let column = 0;

    for (let i = 0; i <= index; i++) {
      if (this.data[i] !== "\n") {
        column += 1;
      } else if (i < index) {
        column = 0;
        line += 1;
      }
    }

    return { line, column };
  }

  /**
   * Returns a slice of source data containing the source code context around the given `pos`.
   *
   * @param pos Position in source
   * @param lines Number of context lines around `pos`
   */
  context(pos: Position, lines = 1): string {
    if (lines < 1) {
      return "";
    }

    if (this.indexOf(pos) === -1) {
      return "";
    }

    const startLine = pos.line - lines;
    const startPos: Position = {
      line: startLine < 1 ? 1 : startLine,
      column: 1,
    };

    const startIndex = this.indexOf(startPos);

    if (startIndex === -1) {
      return "";
    }

    const endPos: Position = { line: pos.line + lines + 1, column: 1 };
    let endIndex: number | undefined = this.indexOf(endPos);

    if (endIndex === -1) {
      endIndex = undefined;
    }

    return this.data.slice(startIndex, endIndex);
  }
}
