import "core-js/modules/esnext.array.last-item";

import { HEADER_REGEX, Keyword } from "../const";
import { KeyValuesSourceError } from "../errors";
import { Source } from "../source";
import { Token } from "./token";
import { isControlCode, isDigitCode, isWhitespaceCode, TokenCode } from "./token_code";

/**
 * Tokenizer is responsible for matching text in the given {@link Source} and generating
 * {@link Token} objects.
 *
 * An amateurish {@link https://pegn.dev | PEGn} syntax grammar is present in file `doc/syntax.pegn`.
 *
 * This class implements both {@link
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols |
 * iteration protocols} over `Token` objects.
 */
export class Tokenizer implements Iterator<Token, void>, Iterable<Token> {
  /** Raw kv3 header string extracted from `src`. */
  header: string;
  #pos: number;
  #eof = false;

  constructor(public src: Source) {
    const match = src.data.match(HEADER_REGEX);

    if (match == null || match.groups == null) {
      throw new KeyValuesSourceError("No header found", src);
    }

    this.header = match.groups["header"];
    this.#pos = match[0].length;
  }

  [Symbol.iterator](): Iterator<Token, void> {
    return this;
  }

  get data(): string {
    return this.src.data;
  }

  next(): IteratorResult<Token, void> {
    if (this.#eof) {
      return { done: true, value: undefined };
    }

    const code = this.read();

    if (code === TokenCode.EndOfFile) {
      this.#eof = true;

      return { done: false, value: Token.eof(this.#pos) };
    }

    let token: Token;

    if (code === TokenCode.Quotation) {
      token = this.readString([code]);
    } else if (isControlCode(code)) {
      token = Token.char(code, this.#pos);
    } else if (code === TokenCode.Solidus) {
      token = this.readComment([code]);
    } else if (code === TokenCode.Hyphen) {
      token = this.readNumber([code]);
    } else if (isWhitespaceCode(code)) {
      token = Token.char(code, this.#pos);
    } else if (isDigitCode(code)) {
      token = this.readNumber([code]);
    } else {
      token = this.readText([code]);
    }

    return { done: false, value: token };
  }

  private read(): number {
    if (this.#pos === this.data.length) {
      return TokenCode.EndOfFile;
    }

    return this.data.charCodeAt(this.#pos++);
  }

  private peek(): number {
    return this.data.charCodeAt(this.#pos);
  }

  private rewind(n = 1): void {
    this.#pos -= n;
  }

  private readSeq(...sequence: number[]): number[] {
    const read: number[] = [];
    const reset = () => {
      this.rewind(read.length);
      read.splice(0, read.length);
    };

    for (let i = 0; i < sequence.length; i++) {
      const current = this.read();

      read.push(current);

      if (current === TokenCode.EndOfFile) {
        reset();
        break;
      }

      if (current !== sequence[i]) {
        reset();
        break;
      }
    }

    return read;
  }

  private readUntil(...sequence: TokenCode[]): number[] {
    const read: number[] = [];
    let i = 0;

    for (;;) {
      const current = this.read();

      read.push(current);

      if (current === TokenCode.EndOfFile) {
        break;
      }

      if (current === sequence[i]) {
        i++;

        if (i === sequence.length) {
          break;
        }
      } else if (i > 0) {
        i = 0;
      }
    }

    return read;
  }

  // read: [\-0-9]
  // try to match number
  private readNumber(read: number[]): Token {
    if (read[0] === TokenCode.Hyphen) {
      // read: -
      if (!isDigitCode(this.peek())) {
        return Token.char(read[0], this.#pos);
      }

      // read: -[0-9]
      read.push(this.read());
    }

    // read: -?[0-9]

    let float = false;

    for (;;) {
      const code = this.read();

      read.push(code);

      if (isDigitCode(code)) {
        continue;
      }

      switch (code) {
        case TokenCode.EndOfFile:
          // read: -?[0-9].*\p{EOF}
          this.rewind();
          // read: -?[0-9].*
          read.pop();

          return Token.text(read, this.#pos);

        case TokenCode.FullStop:
          // read: -?[0-9]+\.

          if (float) {
            // read: -?[0-9]+\.[0-9]*\.
            return Token.text(read, this.#pos);
          }

          float = true;
          break;

        case TokenCode.Comma:
          // read: -?[0-9]+\.?[0-9]*,
          this.rewind();
          // read: -?[0-9]+\.?[0-9]*
          read.pop();

          if (read.lastItem === TokenCode.FullStop) {
            // read: -?[0-9]+\.
            return Token.text(read, this.#pos);
          }

          return Token.number(read, this.#pos);

        default:
          if (isWhitespaceCode(code)) {
            // read: -?[0-9]+\.?[0-9]*\s
            // read: -?[0-9]+\.?[0-9]*
            read.pop();

            if (read.lastItem === TokenCode.FullStop) {
              // read: -?[0-9]+\.
              return Token.text(read, this.#pos);
            }

            return Token.number(read, this.#pos);
          }

          // read: -?[0-9]+\.?[0-9]*.
          return Token.text(read, this.#pos);
      }
    }
  }

  // read: [^\s{}\[\]=,\-:0-9"]
  private readText(read: number[]): Token {
    const keyword = this.readKeyword(read);

    if (keyword != null) {
      return keyword;
    }

    for (;;) {
      const code = this.read();

      read.push(code);

      if (isControlCode(code) || isWhitespaceCode(code) || code === TokenCode.EndOfFile) {
        this.rewind();

        read.pop();

        return Token.text(read, this.#pos);
      }
    }
  }

  private readKeyword(read: number[]): Token | null {
    const readStr = String.fromCharCode(...read);

    for (const keyword of Object.values(Keyword)) {
      if (!keyword.startsWith(readStr)) {
        continue;
      }

      const restStr = keyword.slice(readStr.length);
      const restSeq = Array.from(restStr).map((c) => c.charCodeAt(0));
      const readSeq = this.readSeq(...restSeq);

      if (readSeq.length > 0) {
        return Token.keyword([...read, ...readSeq], this.#pos);
      }
    }

    return null;
  }

  // read: "
  // try to match single-line or multi-line string
  private readString(read: number[]): Token {
    if (this.peek() === TokenCode.Quotation) {
      // read: ""
      read.push(this.read());

      return this.readMultiLineString(read);
    }

    return this.readSingleLineString(read);
  }

  // read: "
  // try to match single-line string "..."
  private readSingleLineString(read: number[]): Token {
    // read: "...["|EOF]
    read = read.concat(this.readUntil(TokenCode.Quotation));

    if (read.lastItem === TokenCode.EndOfFile) {
      // read: "...EOF
      // read: "...
      read.pop();

      this.rewind();

      return Token.text(read, this.#pos);
    }

    // read: "..."
    return Token.string(read, this.#pos);
  }

  // read: ""
  // try to match multi-line string """\n...\n"""
  private readMultiLineString(read: number[]): Token {
    if (this.peek() !== TokenCode.Quotation) {
      return Token.text(read, this.#pos);
    }

    // read: """
    read.push(this.read());

    if (this.peek() !== TokenCode.NewLine) {
      return Token.text(read, this.#pos);
    }

    // read: """\n
    read.push(this.read());

    // read: """\n...[\n"""|EOF]
    read = read.concat(
      this.readUntil(
        TokenCode.NewLine,
        TokenCode.Quotation,
        TokenCode.Quotation,
        TokenCode.Quotation
      )
    );

    if (read.lastItem === TokenCode.EndOfFile) {
      // read: """\n...EOF
      // read: """\n...
      read.pop();

      this.rewind();

      return Token.text(read, this.#pos);
    }

    // read: """\n...\n"""
    return Token.stringM(read, this.#pos);
  }

  // read: /
  // try to match single-line or multi-line comment
  private readComment(read: number[]): Token {
    if (this.peek() === TokenCode.Solidus) {
      // read: //
      read.push(this.read());

      return this.readSingleLineComment(read);
    }

    if (this.peek() === TokenCode.Asterisk) {
      // read: /*
      read.push(this.read());

      return this.readMultiLineComment(read);
    }

    return Token.text(read, this.#pos);
  }

  // read: //
  // try to match single-line comment //...
  private readSingleLineComment(read: number[]): Token {
    // read: //...[\n|EOF]
    read = read.concat(this.readUntil(TokenCode.NewLine));

    if (read.lastItem === TokenCode.EndOfFile) {
      // read: //...EOF
      // read: //...
      read.pop();

      this.rewind();
    }

    if (read.lastItem === TokenCode.NewLine) {
      // read: //...\n
      // read: //...
      read.pop();
    }

    return Token.comment(read, this.#pos);
  }

  // read: /*
  // try to match multi-line comment /*...*/
  private readMultiLineComment(read: number[]): Token {
    // read: /*...[*/|EOF]
    read = read.concat(this.readUntil(TokenCode.Asterisk, TokenCode.Solidus));

    if (read.lastItem === TokenCode.EndOfFile) {
      // read: /*...EOF
      // read: /*...
      read.pop();

      this.rewind();

      return Token.text(read, this.#pos);
    }

    // read: /*...*/
    return Token.commentM(read, this.#pos);
  }
}
