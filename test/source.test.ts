import { expect } from "chai";
import { inspect } from "util";

import { Position, Source } from "../src/source";

describe("Source", () => {
  describe("indexOf", () => {
    interface SourceIndexOfTestCase {
      description: string;
      src: Source;
      subjects: { pos: Position; expected: number }[];
    }

    const testCases: SourceIndexOfTestCase[] = [
      {
        description: "with invalid position values",
        src: new Source(`hello\nworld\n`),
        subjects: [
          { pos: { offset: -1, line: -1, column: -1 }, expected: -1 },
          { pos: { offset: -1, line: -1, column: 0 }, expected: -1 },
          { pos: { offset: -1, line: -1, column: 1 }, expected: -1 },
          { pos: { offset: -1, line: 0, column: -1 }, expected: -1 },
          { pos: { offset: -1, line: 0, column: 0 }, expected: -1 },
          { pos: { offset: -1, line: 0, column: 1 }, expected: -1 },
          { pos: { offset: -1, line: 1, column: -1 }, expected: -1 },
          { pos: { offset: -1, line: 1, column: 0 }, expected: -1 },
          { pos: { offset: -1, line: 1, column: 1 }, expected: -1 },
          { pos: { offset: 0, line: -1, column: -1 }, expected: -1 },
          { pos: { offset: 0, line: -1, column: 0 }, expected: -1 },
          { pos: { offset: 0, line: -1, column: 1 }, expected: -1 },
          { pos: { offset: 0, line: 0, column: -1 }, expected: -1 },
          { pos: { offset: 0, line: 0, column: 0 }, expected: -1 },
          { pos: { offset: 0, line: 0, column: 1 }, expected: -1 },
          { pos: { offset: 0, line: 1, column: -1 }, expected: -1 },
          { pos: { offset: 0, line: 1, column: 0 }, expected: -1 },
        ],
      },
      {
        description: "with empty source",
        src: new Source(``),
        subjects: [{ pos: { offset: 0, line: 1, column: 1 }, expected: -1 }],
      },
      {
        description: "with out-of-bounds position offset",
        src: new Source(`hello\nworld\n`),
        subjects: [
          { pos: { offset: 12, line: 1, column: 1 }, expected: -1 },
          { pos: { offset: 99, line: 1, column: 1 }, expected: -1 },
        ],
      },
      {
        description: "with out-of-bounds position line",
        src: new Source(`hello\nworld\n`),
        subjects: [
          { pos: { offset: 0, line: 3, column: 1 }, expected: -1 },
          { pos: { offset: 0, line: 4, column: 1 }, expected: -1 },
        ],
      },
      {
        description: "with out-of-bounds position column",
        src: new Source(`brave\nnew\nworld\n`),
        subjects: [
          { pos: { offset: 0, line: 1, column: 6 }, expected: -1 },
          { pos: { offset: 0, line: 2, column: 4 }, expected: -1 },
          { pos: { offset: 0, line: 3, column: 6 }, expected: -1 },
        ],
      },
      {
        description: "without position offset",
        src: new Source(`brave\nnew\nworld\n`),
        subjects: [
          { pos: { offset: 0, line: 1, column: 3 }, expected: 2 },
          { pos: { offset: 0, line: 2, column: 3 }, expected: 8 },
          { pos: { offset: 0, line: 3, column: 3 }, expected: 12 },
        ],
      },
      {
        description: "with position offset at line-ending",
        src: new Source(`brave\nnew\nworld\n`),
        subjects: [
          { pos: { offset: 5, line: 1, column: 1 }, expected: 6 },
          { pos: { offset: 9, line: 1, column: 1 }, expected: 10 },
          { pos: { offset: 15, line: 1, column: 1 }, expected: -1 },
        ],
      },
      {
        description: "with position offset at non-line-ending",
        src: new Source(`hello\nworld\n`),
        subjects: [
          { pos: { offset: 0, line: 1, column: 1 }, expected: 0 },
          { pos: { offset: 4, line: 1, column: 1 }, expected: 4 },
          { pos: { offset: 6, line: 1, column: 1 }, expected: 6 },
          { pos: { offset: 10, line: 1, column: 1 }, expected: 10 },
        ],
      },
    ];

    testCases.forEach(({ description, src, subjects }, caseIdx) => {
      describe(description, () => {
        subjects.forEach(({ pos, expected }, subjectIdx) => {
          it(`should return ${expected}`, () => {
            const message = `case #${caseIdx}, subject #${subjectIdx}`;

            expect(src.indexOf(pos), message).to.equal(expected);
          });
        });
      });
    });
  });

  describe("positionAt", () => {
    interface SourcePositionAtTestCase {
      description: string;
      src: Source;
      subjects: { index: number; expected: Position | null }[];
    }

    const testCases: SourcePositionAtTestCase[] = [
      {
        description: "with empty source",
        src: new Source(``),
        subjects: [
          { index: -1, expected: null },
          { index: 0, expected: null },
          { index: 1, expected: null },
        ],
      },
      {
        description: "with out-of-bounds index",
        src: new Source(`hello\nworld\n`),
        subjects: [
          { index: -1, expected: null },
          { index: 12, expected: null },
        ],
      },
      {
        description: "with index at line-ending",
        src: new Source(`brave\nnew\nworld\n`),
        subjects: [
          { index: 5, expected: { offset: 0, line: 1, column: 5 } },
          { index: 9, expected: { offset: 0, line: 2, column: 3 } },
          { index: 15, expected: { offset: 0, line: 3, column: 5 } },
        ],
      },
      {
        description: "with index at non-line-ending",
        src: new Source(`hello\nworld\n`),
        subjects: [
          { index: 0, expected: { offset: 0, line: 1, column: 1 } },
          { index: 4, expected: { offset: 0, line: 1, column: 5 } },
          { index: 6, expected: { offset: 0, line: 2, column: 1 } },
          { index: 10, expected: { offset: 0, line: 2, column: 5 } },
        ],
      },
    ];

    testCases.forEach(({ description, src, subjects }, caseIdx) => {
      describe(description, () => {
        subjects.forEach(({ index, expected }, subjectIdx) => {
          it("should return correct position", () => {
            const message = `case #${caseIdx}, subject #${subjectIdx}`;

            expect(src.positionAt(index), message).to.eql(expected);
          });
        });
      });
    });
  });
});
