import "core-js/modules/esnext.array.last-item";

import { inspect } from "util";

import { KeyValuesInputError } from "./errors";
import { Input } from "./source";

const HEADER = /^(\s*|)(?<header><!--\s+kv3.+-->)\s*\n/;
const MIN_NUMBER_CODE = "0".charCodeAt(0); // 48
const MAX_NUMBER_CODE = "9".charCodeAt(0); // 57
const KEYWORDS = ["true", "false"];

export enum TokenCode {
  EndOfFile = -1,
  Tab = "\t".charCodeAt(0), // 9
  NewLine = "\n".charCodeAt(0), // 10
  FormFeed = "\f".charCodeAt(0), // 12
  CarriageReturn = "\r".charCodeAt(0), // 13
  Space = " ".charCodeAt(0), // 32
  Quotation = '"'.charCodeAt(0), // 34
  Apostrophe = "'".charCodeAt(0), // 39
  Asterisk = "*".charCodeAt(0), // 42
  Comma = ",".charCodeAt(0), // 44
  Hyphen = "-".charCodeAt(0), // 45
  FullStop = ".".charCodeAt(0), // 46
  Solidus = "/".charCodeAt(0), // 47
  Colon = ":".charCodeAt(0), // 58
  Equals = "=".charCodeAt(0), // 61
  LeftSquareBracket = "[".charCodeAt(0), // 91
  ReverseSolidus = "\\".charCodeAt(0), // 92
  RightSquareBracket = "]".charCodeAt(0), // 93
  LeftCurlyBracket = "{".charCodeAt(0), // 123
  RightCurlyBracket = "}".charCodeAt(0), // 125
}

export enum TokenType {
  Whitespace,
  Control,
  Keyword,
  Number,
  String,
  MultilineString,
  Comment,
  MultilineComment,
  Text,
}

export class Token {
  static char(code: number, pos: number): Token {
    if (code === TokenCode.EndOfFile) {
      return new this(TokenType.Control, "", pos, pos, code);
    }

    if (isWhitespaceCode(code)) {
      return new this(TokenType.Whitespace, String.fromCharCode(code), pos, pos + 1, code);
    }

    if (isControlCode(code)) {
      return new this(TokenType.Control, String.fromCharCode(code), pos, pos + 1, code);
    }

    return this.text([code], pos + 1);
  }

  static sequence(type: TokenType, codes: number[], endPos: number): Token {
    return new this(type, String.fromCharCode(...codes), endPos - codes.length, endPos);
  }

  static number(codes: number[], endPos: number): Token {
    return this.sequence(TokenType.Number, codes, endPos);
  }

  static keyword(codes: number[], endPos: number): Token {
    return this.sequence(TokenType.Keyword, codes, endPos);
  }

  static string(codes: number[], endPos: number): Token {
    return this.sequence(TokenType.String, codes, endPos);
  }

  static stringM(codes: number[], endPos: number): Token {
    return this.sequence(TokenType.MultilineString, codes, endPos);
  }

  static comment(codes: number[], endPos: number): Token {
    return this.sequence(TokenType.Comment, codes, endPos);
  }

  static commentM(codes: number[], endPos: number): Token {
    return this.sequence(TokenType.MultilineComment, codes, endPos);
  }

  static text(codes: number[], endPos: number): Token {
    return this.sequence(TokenType.Text, codes, endPos);
  }

  #toString?: string;

  constructor(
    public type: TokenType,
    public text: string,
    public start: number,
    public end: number,
    public code?: TokenCode
  ) {}

  get isEOF(): boolean {
    return this.isControl(TokenCode.EndOfFile);
  }

  get isWhitespace(): boolean {
    return this.type === TokenType.Whitespace;
  }

  get isComment(): boolean {
    return this.type === TokenType.Comment || this.type === TokenType.MultilineComment;
  }

  get isString(): boolean {
    return this.type === TokenType.String || this.type === TokenType.MultilineString;
  }

  get isText(): boolean {
    return this.type === TokenType.Text;
  }

  isControl(code: TokenCode): boolean {
    return this.type === TokenType.Control && this.code === code;
  }

  toString(): string {
    if (this.#toString == null) {
      this.#toString = inspect({
        type: TokenType[this.type],
        text: this.text,
        start: this.start,
        end: this.end,
        code: this.code ? TokenCode[this.code] : null,
      });
    }

    return this.#toString;
  }
}

export class Tokenizer implements Iterator<Token, void>, Iterable<Token> {
  header: string;
  src: string;
  pos: number;
  #eof = false;

  constructor(public input: Input) {
    const match = input.src.match(HEADER);

    if (match == null || match.groups == null) {
      throw new KeyValuesInputError("No header found", input);
    }

    this.src = this.input.src;
    this.header = match.groups["header"];
    this.pos = match[0].length;
  }

  [Symbol.iterator](): Iterator<Token, void> {
    return this;
  }

  next(): IteratorResult<Token, void> {
    if (this.#eof) {
      return { done: true, value: undefined };
    }

    const code = this.read();

    if (code === TokenCode.EndOfFile) {
      this.#eof = true;

      return { done: false, value: Token.char(code, this.pos) };
    }

    let token: Token;

    if (code === TokenCode.Quotation) {
      token = this.readString([code]);
    } else if (isControlCode(code)) {
      token = Token.char(code, this.pos);
    } else if (code === TokenCode.Solidus) {
      token = this.readComment([code]);
    } else if (code === TokenCode.Hyphen) {
      token = this.readNumber([code]);
    } else if (isWhitespaceCode(code)) {
      token = Token.char(code, this.pos);
    } else if (isNumberCode(code)) {
      token = this.readNumber([code]);
    } else {
      token = this.readText([code]);
    }

    return { done: false, value: token };
  }

  private read(): number {
    if (this.pos === this.src.length) {
      return TokenCode.EndOfFile;
    }

    return this.src.charCodeAt(this.pos++);
  }

  private peek(): number {
    return this.src.charCodeAt(this.pos);
  }

  private rewind(n = 1): void {
    this.pos -= n;
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
      if (!isNumberCode(this.peek())) {
        return Token.char(read[0], this.pos);
      }

      // read: -[0-9]
      read.push(this.read());
    }

    // read: -?[0-9]

    let float = false;

    for (;;) {
      const code = this.read();

      read.push(code);

      if (isNumberCode(code)) {
        continue;
      }

      switch (code) {
        case TokenCode.EndOfFile:
          // read: -?[0-9].*\p{EOF}
          this.rewind();
          // read: -?[0-9].*
          read.pop();

          return Token.text(read, this.pos);

        case TokenCode.FullStop:
          // read: -?[0-9]+\.

          if (float) {
            // read: -?[0-9]+\.[0-9]*\.
            return Token.text(read, this.pos);
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
            return Token.text(read, this.pos);
          }

          return Token.number(read, this.pos);

        default:
          if (isWhitespaceCode(code)) {
            // read: -?[0-9]+\.?[0-9]*\s
            // read: -?[0-9]+\.?[0-9]*
            read.pop();

            if (read.lastItem === TokenCode.FullStop) {
              // read: -?[0-9]+\.
              return Token.text(read, this.pos);
            }

            return Token.number(read, this.pos);
          }

          // read: -?[0-9]+\.?[0-9]*.
          return Token.text(read, this.pos);
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

        return Token.text(read, this.pos);
      }
    }
  }

  private readKeyword(read: number[]): Token | null {
    const readStr = String.fromCharCode(...read);

    for (const keyword of KEYWORDS) {
      if (!keyword.startsWith(readStr)) {
        continue;
      }

      const restStr = keyword.slice(readStr.length);
      const restSeq = Array.from(restStr).map((c) => c.charCodeAt(0));
      const readSeq = this.readSeq(...restSeq);

      if (readSeq.length > 0) {
        return Token.keyword([...read, ...readSeq], this.pos);
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

      return Token.text(read, this.pos);
    }

    // read: "..."
    return Token.string(read, this.pos);
  }

  // read: ""
  // try to match multi-line string """\n...\n"""
  private readMultiLineString(read: number[]): Token {
    if (this.peek() !== TokenCode.Quotation) {
      return Token.text(read, this.pos);
    }

    // read: """
    read.push(this.read());

    if (this.peek() !== TokenCode.NewLine) {
      return Token.text(read, this.pos);
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

      return Token.text(read, this.pos);
    }

    // read: """\n...\n"""
    return Token.stringM(read, this.pos);
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

    return Token.text(read, this.pos);
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

    return Token.comment(read, this.pos);
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

      return Token.text(read, this.pos);
    }

    // read: /*...*/
    return Token.commentM(read, this.pos);
  }
}

function isWhitespaceCode(code: number): boolean {
  switch (code) {
    case TokenCode.Tab:
    case TokenCode.NewLine:
    case TokenCode.FormFeed:
    case TokenCode.CarriageReturn:
    case TokenCode.Space:
      return true;
    default:
      return false;
  }
}

function isNumberCode(code: number): boolean {
  return code >= MIN_NUMBER_CODE && code <= MAX_NUMBER_CODE;
}

function isControlCode(code: number): boolean {
  switch (code) {
    case TokenCode.Comma:
    case TokenCode.Colon:
    case TokenCode.Equals:
    case TokenCode.LeftSquareBracket:
    case TokenCode.RightSquareBracket:
    case TokenCode.LeftCurlyBracket:
    case TokenCode.RightCurlyBracket:
      return true;
    default:
      return false;
  }
}
