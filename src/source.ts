/**
 * Represents a (`line`, `column`) position in the source code, starting from `offset`.
 */
export interface Position {
  /** Source data offset index. Value starts at `0`. A value lower than `0` is treated as error or ignored. */
  offset: number;
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
   * If `position` contains an `offset` greater than 0, the search starts from its value and `line`
   * and `column` are considered relative to `offset`.
   *
   * @returns If `position` contains invalid values, it returns `-1` (see {@link Position}).
   *   If `position` could not be found in source data, it returns `-1`.
   */
  indexOf(pos: Position): number {
    if (pos.offset < 0 || pos.offset >= this.data.length || pos.line < 1 || pos.column < 1) {
      return -1;
    }

    let line = this.data[pos.offset] === "\n" ? 0 : 1;
    let column = 0;

    for (let i = pos.offset; i < this.data.length; i++) {
      if (this.data[i] === "\n") {
        column = 0;
        line += 1;
        continue;
      }

      column += 1;

      // fail early
      if ((line === pos.line && column > pos.column) || line > pos.line) {
        return -1;
      }

      if (pos.line === line && pos.column === column) {
        return i;
      }
    }

    return -1;
  }

  /**
   * Calculates the position at given index.
   *
   * @param index Source data index
   * @param offsetPos Start search from given position offset
   * @returns If index could not be found (out-of-bounds), returns `null`.
   */
  positionAt(index: number, offsetPos?: Position): Position | null {
    offsetPos ||= { offset: 0, line: 1, column: 1 };

    let { line, column } = offsetPos;

    for (let i = offsetPos.offset; i < index; i++) {
      if (i === this.data.length) {
        return null;
      }

      if (this.data[i] === "\n") {
        column = 1;
        line += 1;
      } else {
        column += 1;
      }
    }

    return { offset: offsetPos.offset, line, column };
  }

  /**
   * Returns a slice of source data containing the source code context around the given `pos`.
   *
   * @param pos Position in source
   * @param lines Number of context lines around `pos`
   */
  getContext(pos: Position, lines = 1): string {
    const startPos: Position = { offset: pos.offset, line: pos.line - lines, column: 1 };
    const endPos: Position = { offset: pos.offset, line: pos.line + lines + 1, column: 1 };
    const startIndex = this.indexOf(startPos);
    const endIndex = this.indexOf(endPos);

    return this.data.slice(startIndex, endIndex);
  }
}
