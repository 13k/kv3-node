/** TokenCode defines relevant character codes to be used by the {@link Tokenizer}. */
export enum TokenCode {
  EndOfFile = -1,
  Tab = 9, // '\t'
  NewLine = 10, // '\n'
  FormFeed = 12, // '\f'
  CarriageReturn = 13, // '\r'
  Space = 32, // ' '
  Quotation = 34, // '"'
  Apostrophe = 39, // "'"
  Asterisk = 42, // '*'
  Comma = 44, // ','
  Hyphen = 45, // '-'
  FullStop = 46, // '.'
  Solidus = 47, // '/'
  Digit0 = 48, // '0'
  Digit1 = 49, // '1'
  Digit2 = 50, // '2'
  Digit3 = 51, // '3'
  Digit4 = 52, // '4'
  Digit5 = 53, // '5'
  Digit6 = 54, // '6'
  Digit7 = 55, // '7'
  Digit8 = 56, // '8'
  Digit9 = 57, // '9'
  Colon = 58, // ':'
  Equals = 61, // '='
  LeftSquareBracket = 91, // '['
  ReverseSolidus = 92, // '\\'
  RightSquareBracket = 93, // ']'
  LeftCurlyBracket = 123, // '{'
  RightCurlyBracket = 125, // '}'
}

/** Represents character codes considered whitespace. */
export type WhitespaceTokenCode =
  | TokenCode.Tab
  | TokenCode.NewLine
  | TokenCode.FormFeed
  | TokenCode.CarriageReturn
  | TokenCode.Space;

/** Represents digit character codes. */
export type DigitTokenCode =
  | TokenCode.Digit0
  | TokenCode.Digit1
  | TokenCode.Digit2
  | TokenCode.Digit3
  | TokenCode.Digit4
  | TokenCode.Digit5
  | TokenCode.Digit6
  | TokenCode.Digit7
  | TokenCode.Digit8
  | TokenCode.Digit9;

/** Represents syntax control character codes. */
export type SyntaxControlTokenCode =
  | TokenCode.Comma
  | TokenCode.Colon
  | TokenCode.Equals
  | TokenCode.LeftSquareBracket
  | TokenCode.RightSquareBracket
  | TokenCode.LeftCurlyBracket
  | TokenCode.RightCurlyBracket;

/** Checks if the given character `code` represents a whitespace character. */
export function isWhitespaceCode(code: number): code is WhitespaceTokenCode {
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

/** Checks if the given character `code` represents a digit character. */
export function isDigitCode(code: number): code is DigitTokenCode {
  return code >= TokenCode.Digit0 && code <= TokenCode.Digit9;
}

/** Checks if the given character `code` represents a syntax control character. */
export function isControlCode(code: number): code is SyntaxControlTokenCode {
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
