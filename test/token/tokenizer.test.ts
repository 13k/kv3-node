import { expect } from "chai";
import dedent from "ts-dedent";

import { DEFAULT_HEADER } from "../../src/const";
import { KeyValuesSourceError } from "../../src/errors";
import { Source } from "../../src/source";
import { Token } from "../../src/token/token";
import { TokenCode } from "../../src/token/token_code";
import { Tokenizer } from "../../src/token/tokenizer";
import { fixture, tokensFixture } from "../helpers";

describe("token/tokenizer", () => {
  describe("Tokenizer", () => {
    const validEmptyData = dedent`
      ${DEFAULT_HEADER}
      {}
    `;

    const headerOffset = DEFAULT_HEADER.length + 1;

    describe("constructor", () => {
      describe("with headerless source", () => {
        it("should throw an error", () => {
          const fn = () => new Tokenizer(new Source(`abc`));

          expect(fn).to.throw(KeyValuesSourceError, "Header not found");
        });
      });

      describe("with valid source", () => {
        it("should extract header", () => {
          const tokenizer = new Tokenizer(new Source(validEmptyData));

          expect(tokenizer.header).to.equal(DEFAULT_HEADER);
        });
      });
    });

    describe("iterable", () => {
      it("should return itself", () => {
        const tokenizer = new Tokenizer(new Source(validEmptyData));

        expect(tokenizer[Symbol.iterator]()).to.equal(tokenizer);
      });
    });

    describe("iterator", () => {
      interface TokenizerIteratorTestCase {
        description: string;
        data?: string;
        dataFixture?: string;
        expected?: Token[];
        expectedFixture?: string;
      }

      const testCases: TokenizerIteratorTestCase[] = [
        {
          description: "with minimal valid data",
          data: validEmptyData,
          expected: [
            Token.char(TokenCode.LeftCurlyBracket, headerOffset),
            Token.char(TokenCode.RightCurlyBracket, headerOffset + 1),
            Token.eof(headerOffset + 2),
          ],
        },
        {
          description: "with sample addoninfo data",
          dataFixture: "addoninfo.txt",
          expectedFixture: "addoninfo.txt",
        },
      ];

      testCases.forEach(
        ({ description, data, dataFixture, expected, expectedFixture }, caseIdx) => {
          describe(description, () => {
            const loadData = async () => {
              if (dataFixture != null) {
                return await fixture(dataFixture);
              }

              if (data != null) {
                return data;
              }

              throw new Error("Invalid test case: `data` and `dataFixture` are null");
            };

            const loadExpected = async () => {
              if (expectedFixture != null) {
                return await tokensFixture(expectedFixture);
              }

              if (expected != null) {
                return expected;
              }

              throw new Error("Invalid test case: `expected` and `expectedFixture` are null");
            };

            it("should generate the correct tokens", async () => {
              const message = `case: #${caseIdx}`;
              const data = await loadData();
              const expectedResult = await loadExpected();
              const tokenizer = new Tokenizer(new Source(data));
              const actual = [...tokenizer];

              expect(actual, message).to.eql(expectedResult);

              for (const token of actual) {
                const text = data.slice(token.start, token.end);
                expect(text, message).to.equal(token.text);
              }
            });
          });
        }
      );
    });
  });
});
