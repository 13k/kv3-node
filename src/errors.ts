import type { Position, Source, SourcePosition } from "./source";

/** KeyValuesError is the base error class for all errors in the package. */
export class KeyValuesError extends Error {}

/** KeyValuesSourceError is an error thrown by the tokenizer on input source errors. */
export class KeyValuesSourceError extends KeyValuesError {
  #toString?: string;

  /**
   * @param message Error message
   * @param src Source
   */
  constructor(message: string, public src: Source) {
    super(message);
  }

  /** Returns a formatted representation of the error. */
  toString(): string {
    if (this.#toString != null) {
      return this.#toString;
    }

    this.#toString = "";

    if (this.src) {
      this.#toString += this.src.filename || "<input>";
    }

    if (this.#toString.length > 0) {
      this.#toString += ": ";
    }

    this.#toString += this.message;

    return this.#toString;
  }
}

/** KeyValuesSyntaxError is an error thrown by the parser on syntax errors. */
export class KeyValuesSyntaxError extends KeyValuesSourceError {
  pos: Position;
  #toString?: string;

  /**
   * @param message Error message
   * @param srcPos Source pointer with source and position where error happened
   */
  constructor(message: string, public srcPos: SourcePosition) {
    super(message, srcPos.source);

    this.pos = srcPos.position;
  }

  /**
   * Returns a formatted representation of the error with context lines around the error position.
   */
  toString(): string {
    if (this.#toString != null) {
      return this.#toString;
    }

    const ctxLines = 2;
    const filename = this.src.filename || "<input>";
    const context = this.src.context(this.pos, ctxLines);
    let lineno = this.pos.line - ctxLines;

    this.#toString = `${filename}:${this.pos.line}:${this.pos.column}: ${this.message}\n`;

    for (const line of context.split("\n")) {
      const linenoCol = `${lineno.toString().padStart(4, " ")} | `;

      this.#toString += `${linenoCol}${line}\n`;

      if (this.pos.line === lineno) {
        this.#toString += " ".repeat(linenoCol.length + this.pos.column - 1);
        this.#toString += "^^^\n";
      }

      lineno += 1;
    }

    return this.#toString;
  }
}
