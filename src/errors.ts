import type { Input, Source } from "./source";

export class KeyValuesError extends Error {}

export class KeyValuesInputError extends KeyValuesError {
  #toString?: string;

  /**
   * @param message Error message
   * @param input Source input
   */
  constructor(message: string, public input?: Input) {
    super(message);
  }

  toString(): string {
    if (this.#toString != null) {
      return this.#toString;
    }

    let result = "";

    if (this.input) {
      result += this.input.filename || "<input>";
    }

    if (result.length > 0) {
      result += ": ";
    }

    result += this.message;

    this.#toString = result;

    return this.#toString;
  }
}

export class KeyValuesSyntaxError extends KeyValuesInputError {
  #toString?: string;

  /**
   * @param message Error message
   * @param source Source with input and position where error happened
   */
  constructor(message: string, public source?: Source) {
    super(message, source?.input);
  }

  toString(): string {
    if (this.#toString != null) {
      return this.#toString;
    }

    let result = "";

    if (this.source) {
      result += this.source.input.filename || "<input>";
      result += `:${this.source.position.line}:${this.source.position.column}`;
    }

    if (result.length > 0) {
      result += ": ";
    }

    result += this.message;

    if (this.source) {
      result += "\n";

      const contextLines = 2;
      const context = this.source.input.getContext(this.source.position, contextLines);
      let lineno = this.source.position.line - contextLines;

      for (const line of context.split("\n")) {
        const linenoCol = `${lineno.toString().padStart(4, " ")} | `;
        result += `${linenoCol}${line}\n`;

        if (this.source.position.line === lineno) {
          result += " ".repeat(linenoCol.length + this.source.position.column - 1);
          result += "^^^\n";
        }

        lineno += 1;
      }
    }

    this.#toString = result;

    return this.#toString;
  }
}
