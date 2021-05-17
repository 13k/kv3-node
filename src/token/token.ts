import { inspect } from "util";

import { Keyword } from "../const";
import {
  isControlCode,
  isWhitespaceCode,
  SyntaxControlTokenCode,
  TokenCode,
  WhitespaceTokenCode,
} from "./token_code";

/** TokenType defines {@link Token} types. */
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

/** Token is a string of one or more characters with a {@link TokenType}. */
export class Token {
  /**
   * Creates a single character token, depending on the given character code.
   *
   * The resulting token attributes are as follows:
   *   - `text`: set to `String.fromCharCode(code)`. If `code` is `TokenCode.EndOfFile`, set to empty string.
   *   - `start`: set to the given `pos`.
   *   - `end`: set to `pos + 1`. If code is `TokenCode.EndOfFile`, set to `pos`.
   */
  static char(code: TokenCode.EndOfFile, pos: number): EndOfFileToken;
  static char(code: WhitespaceTokenCode, pos: number): WhitespaceToken;
  static char(code: SyntaxControlTokenCode, pos: number): ControlToken;
  static char(code: number, pos: number): TextToken;
  static char(code: number, pos: number): Token {
    if (code === TokenCode.EndOfFile) {
      return this.eof(pos);
    }

    if (isWhitespaceCode(code)) {
      return new this(TokenType.Whitespace, String.fromCharCode(code), pos, pos + 1, code);
    }

    if (isControlCode(code)) {
      return new this(TokenType.Control, String.fromCharCode(code), pos, pos + 1, code);
    }

    return this.text([code], pos + 1);
  }

  /**
   * Creates a multi character token with the given `type`.
   *
   * The resulting token attributes are as follows:
   *   - `text` is set to `String.fromCharCode(...codes)`
   *   - `start` position is set to the given `endPos - codes.length`. The `end` position is set to
   *     `endPos`.
   */
  static sequence(type: TokenType.Keyword, codes: number[], endPos: number): KeywordToken;
  static sequence(type: TokenType.Number, codes: number[], endPos: number): NumberToken;
  static sequence(type: TokenType.String, codes: number[], endPos: number): StringToken;
  static sequence(
    type: TokenType.MultilineString,
    codes: number[],
    endPos: number
  ): MultilineStringToken;
  static sequence(type: TokenType.Comment, codes: number[], endPos: number): CommentToken;
  static sequence(
    type: TokenType.MultilineComment,
    codes: number[],
    endPos: number
  ): MultilineCommentToken;
  static sequence(type: TokenType.Text, codes: number[], endPos: number): TextToken;
  static sequence(type: TokenType, codes: number[], endPos: number): Token;
  static sequence(type: TokenType, codes: number[], endPos: number): Token {
    return new this(type, String.fromCharCode(...codes), endPos - codes.length, endPos);
  }

  static eof(pos: number): EndOfFileToken {
    return new this(TokenType.Control, "", pos, pos, TokenCode.EndOfFile) as EndOfFileToken;
  }

  static keyword(codes: number[], endPos: number): KeywordToken {
    return this.sequence(TokenType.Keyword, codes, endPos);
  }

  static number(codes: number[], endPos: number): NumberToken {
    return this.sequence(TokenType.Number, codes, endPos);
  }

  static string(codes: number[], endPos: number): StringToken {
    return this.sequence(TokenType.String, codes, endPos);
  }

  static stringM(codes: number[], endPos: number): MultilineStringToken {
    return this.sequence(TokenType.MultilineString, codes, endPos);
  }

  static comment(codes: number[], endPos: number): CommentToken {
    return this.sequence(TokenType.Comment, codes, endPos);
  }

  static commentM(codes: number[], endPos: number): MultilineCommentToken {
    return this.sequence(TokenType.MultilineComment, codes, endPos);
  }

  static text(codes: number[], endPos: number): TextToken {
    return this.sequence(TokenType.Text, codes, endPos);
  }

  #toString?: string;
  #inspect?: string;

  constructor(
    public type: TokenType,
    public text: string,
    public start: number,
    public end: number,
    public code?: TokenCode
  ) {}

  isWhitespace(): this is WhitespaceToken {
    return this.type === TokenType.Whitespace;
  }

  isControl(): this is ControlToken {
    return this.type === TokenType.Control;
  }

  isControlCode<T extends TokenCode>(code: T): this is ControlToken & { code: T } {
    return this.isControl() && this.code === code;
  }

  isEOF(): this is EndOfFileToken {
    return this.isControlCode(TokenCode.EndOfFile);
  }

  isObjectOpen(): this is ObjectOpenToken {
    return this.isControlCode(TokenCode.LeftCurlyBracket);
  }

  isObjectClose(): this is ObjectOpenToken {
    return this.isControlCode(TokenCode.RightCurlyBracket);
  }

  isArrayOpen(): this is ArrayOpenToken {
    return this.isControlCode(TokenCode.LeftSquareBracket);
  }

  isArrayElemSep(): this is ArrayElemSepToken {
    return this.isControlCode(TokenCode.Comma);
  }

  isArrayClose(): this is ArrayOpenToken {
    return this.isControlCode(TokenCode.RightSquareBracket);
  }

  isKeyword(): this is KeywordToken {
    return this.type === TokenType.Keyword;
  }

  isBoolean(): this is BooleanToken {
    return this.isKeyword() && (this.text === Keyword.True || this.text === Keyword.False);
  }

  isNumber(): this is NumberToken {
    return this.type === TokenType.Number;
  }

  isString(): this is StringToken {
    return this.type === TokenType.String;
  }

  isMultilineString(): this is MultilineStringToken {
    return this.type === TokenType.MultilineString;
  }

  isComment(): this is CommentToken {
    return this.type === TokenType.Comment;
  }

  isMultilineComment(): this is MultilineCommentToken {
    return this.type === TokenType.MultilineComment;
  }

  isText(): this is TextToken {
    return this.type === TokenType.Text;
  }

  inspect(): string {
    if (this.#inspect == null) {
      this.#inspect = inspect({
        type: TokenType[this.type],
        text: this.text,
        start: this.start,
        end: this.end,
        code: this.code ? TokenCode[this.code] : null,
      });
    }

    return this.#inspect;
  }

  toString(): string {
    if (this.#toString == null) {
      this.#toString = `${inspect(this.text)} (type: ${TokenType[this.type]})`;
    }

    return this.#toString;
  }
}

export interface WhitespaceToken extends Token {
  type: TokenType.Whitespace;
}

export interface ControlToken extends Token {
  type: TokenType.Control;
}

export interface KeywordToken extends Token {
  type: TokenType.Keyword;
}

export interface NumberToken extends Token {
  type: TokenType.Number;
}

export interface StringToken extends Token {
  type: TokenType.String;
}

export interface MultilineStringToken extends Token {
  type: TokenType.MultilineString;
}

export interface CommentToken extends Token {
  type: TokenType.Comment;
}

export interface MultilineCommentToken extends Token {
  type: TokenType.MultilineComment;
}

export interface TextToken extends Token {
  type: TokenType.Text;
}

// specific control tokens

export interface EndOfFileToken extends ControlToken {
  code: TokenCode.EndOfFile;
}

export interface ObjectOpenToken extends ControlToken {
  code: TokenCode.LeftCurlyBracket;
}

export interface ObjectCloseToken extends ControlToken {
  code: TokenCode.RightCurlyBracket;
}

export interface ArrayOpenToken extends ControlToken {
  code: TokenCode.LeftSquareBracket;
}

export interface ArrayElemSepToken extends ControlToken {
  code: TokenCode.Comma;
}

export interface ArrayCloseToken extends ControlToken {
  code: TokenCode.RightSquareBracket;
}

// specific keyword tokens

export interface BooleanToken extends KeywordToken {
  text: Keyword.True | Keyword.False;
}
