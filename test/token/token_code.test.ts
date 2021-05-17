import { expect } from "chai";

import {
  isControlCode,
  isDigitCode,
  isWhitespaceCode,
  TokenCode,
} from "../../src/token/token_code";
import { numseq } from "../helpers";

describe("token/token_code", () => {
  const CONTROL_CODES = [
    TokenCode.Comma,
    TokenCode.Colon,
    TokenCode.Equals,
    TokenCode.LeftSquareBracket,
    TokenCode.RightSquareBracket,
    TokenCode.LeftCurlyBracket,
    TokenCode.RightCurlyBracket,
  ];

  const DIGIT_CODES = [
    TokenCode.Digit0,
    TokenCode.Digit1,
    TokenCode.Digit2,
    TokenCode.Digit3,
    TokenCode.Digit4,
    TokenCode.Digit5,
    TokenCode.Digit6,
    TokenCode.Digit7,
    TokenCode.Digit8,
    TokenCode.Digit9,
  ];

  const WHITESPACE_CODES = [
    TokenCode.Tab,
    TokenCode.NewLine,
    TokenCode.FormFeed,
    TokenCode.CarriageReturn,
    TokenCode.Space,
  ];

  describe("isControlCode", () => {
    interface IsControlCodeTestCase {
      description: string;
      subjects: number[];
      expected: boolean;
    }

    const testCases: IsControlCodeTestCase[] = [
      {
        description: "with non syntax control codes",
        subjects: [...numseq(255, -1)].filter((n) => !CONTROL_CODES.includes(n)),
        expected: false,
      },
      {
        description: "with syntax control codes",
        subjects: CONTROL_CODES,
        expected: true,
      },
    ];

    testCases.forEach(({ description, subjects, expected }, caseIdx) => {
      describe(description, () => {
        it(`should return ${expected}`, () => {
          subjects.forEach((code, subjectIdx) => {
            const actual = isControlCode(code);
            const message = `case: #${caseIdx}, subject: #${subjectIdx}`;

            expect(actual, message).to.equal(expected);
          });
        });
      });
    });
  });

  describe("isDigitCode", () => {
    interface IsDigitCodeTestCase {
      description: string;
      subjects: number[];
      expected: boolean;
    }

    const testCases: IsDigitCodeTestCase[] = [
      {
        description: "with non digit codes",
        subjects: [...numseq(255, -1)].filter((n) => !DIGIT_CODES.includes(n)),
        expected: false,
      },
      {
        description: "with digit codes",
        subjects: DIGIT_CODES,
        expected: true,
      },
    ];

    testCases.forEach(({ description, subjects, expected }, caseIdx) => {
      describe(description, () => {
        it(`should return ${expected}`, () => {
          subjects.forEach((code, subjectIdx) => {
            const actual = isDigitCode(code);
            const message = `case: #${caseIdx}, subject: #${subjectIdx}`;

            expect(actual, message).to.equal(expected);
          });
        });
      });
    });
  });

  describe("isWhitespaceCode", () => {
    interface IsWhitespaceCodeTestCase {
      description: string;
      subjects: number[];
      expected: boolean;
    }

    const testCases: IsWhitespaceCodeTestCase[] = [
      {
        description: "with non whitespace codes",
        subjects: [...numseq(255, -1)].filter((n) => !WHITESPACE_CODES.includes(n)),
        expected: false,
      },
      {
        description: "with whitespace codes",
        subjects: WHITESPACE_CODES,
        expected: true,
      },
    ];

    testCases.forEach(({ description, subjects, expected }, caseIdx) => {
      describe(description, () => {
        it(`should return ${expected}`, () => {
          subjects.forEach((code, subjectIdx) => {
            const actual = isWhitespaceCode(code);
            const message = `case: #${caseIdx}, subject: #${subjectIdx}`;

            expect(actual, message).to.equal(expected);
          });
        });
      });
    });
  });
});
