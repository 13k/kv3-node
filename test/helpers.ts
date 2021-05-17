import * as fse from "fs-extra";
import * as path from "path";

import { TextToken, Token, TokenType } from "../src/token/token";
import { TokenCode } from "../src/token/token_code";

export interface FixtureOptions {
  encoding?: BufferEncoding;
}

export async function fixture(name: string, options: FixtureOptions = {}): Promise<string> {
  const encoding = options.encoding ?? "utf8";
  const filename = path.resolve(__dirname, "fixtures", name);

  return fse.readFile(filename, encoding);
}

export interface TokensFixtureItem {
  type: string;
  text: string;
  start: number;
  code?: string;
}

export type TokensFixture = TokensFixtureItem[];

export async function tokensFixture(name: string, options: FixtureOptions = {}): Promise<Token[]> {
  const encoding = options.encoding ?? "utf8";
  const filename = path.resolve(__dirname, "fixtures", `${name}.tokens.json`);
  const fixture: TokensFixture = await fse.readJSON(filename, { encoding });

  return fixture.map((item) => {
    const { text, start } = item;
    const type = TokenType[item.type as keyof typeof TokenType];
    const code = item.code != null ? TokenCode[item.code as keyof typeof TokenCode] : undefined;

    return new Token(type, text, start, code);
  });
}

export function* numseq(count: number, start = 0, step = 1): Generator<number> {
  let num = start;

  for (let i = 0; i < count; i++) {
    yield num;

    num += step;
  }
}

export function strCodes(s: string): number[] {
  return Array.from(s).map((c) => c.charCodeAt(0));
}

export function tokenText(s: string, offset: number): TextToken {
  return Token.text(strCodes(s), offset + s.length);
}
