import { expect } from "chai";

import { Position, Source } from "../src/source";

describe("source", () => {
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
            { pos: { line: -1, column: -1 }, expected: -1 },
            { pos: { line: -1, column: 0 }, expected: -1 },
            { pos: { line: -1, column: 1 }, expected: -1 },
            { pos: { line: 0, column: -1 }, expected: -1 },
            { pos: { line: 0, column: 0 }, expected: -1 },
            { pos: { line: 0, column: 1 }, expected: -1 },
            { pos: { line: 1, column: -1 }, expected: -1 },
            { pos: { line: 1, column: 0 }, expected: -1 },
          ],
        },
        {
          description: "with empty source",
          src: new Source(``),
          subjects: [{ pos: { line: 1, column: 1 }, expected: -1 }],
        },
        {
          description: "with out-of-bounds position line",
          src: new Source(`hello\nworld\n`),
          subjects: [
            { pos: { line: 3, column: 1 }, expected: -1 },
            { pos: { line: 4, column: 1 }, expected: -1 },
          ],
        },
        {
          description: "with out-of-bounds position column",
          src: new Source(`brave\nnew\nworld\n`),
          subjects: [
            { pos: { line: 1, column: 6 }, expected: -1 },
            { pos: { line: 2, column: 4 }, expected: -1 },
            { pos: { line: 3, column: 6 }, expected: -1 },
          ],
        },
        {
          description: "with valid position values",
          src: new Source(`brave\nnew\nworld\n`),
          subjects: [
            { pos: { line: 1, column: 3 }, expected: 2 },
            { pos: { line: 2, column: 3 }, expected: 8 },
            { pos: { line: 3, column: 3 }, expected: 12 },
          ],
        },
      ];

      testCases.forEach(({ description, src, subjects }, caseIdx) => {
        describe(description, () => {
          subjects.forEach(({ pos, expected }, subjectIdx) => {
            it(`should return ${expected}`, () => {
              const actual = src.indexOf(pos);
              const message = `case: #${caseIdx}, subject: #${subjectIdx}`;

              expect(actual, message).to.equal(expected);
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
            { index: 5, expected: { line: 1, column: 5 } },
            { index: 9, expected: { line: 2, column: 3 } },
            { index: 15, expected: { line: 3, column: 5 } },
          ],
        },
        {
          description: "with index at non-line-ending",
          src: new Source(`hello\nworld\n`),
          subjects: [
            { index: 0, expected: { line: 1, column: 1 } },
            { index: 4, expected: { line: 1, column: 5 } },
            { index: 6, expected: { line: 2, column: 1 } },
            { index: 10, expected: { line: 2, column: 5 } },
          ],
        },
      ];

      testCases.forEach(({ description, src, subjects }, caseIdx) => {
        describe(description, () => {
          subjects.forEach(({ index, expected }, subjectIdx) => {
            it("should return correct position", () => {
              const actual = src.positionAt(index);
              const message = `case: #${caseIdx}, subject: #${subjectIdx}`;

              expect(actual, message).to.eql(expected);
            });
          });
        });
      });
    });

    describe("context", () => {
      interface SourceContextTestCase {
        description: string;
        src: Source;
        subjects: { pos: Position; lines: number; expected: string }[];
      }

      const testCases: SourceContextTestCase[] = [
        {
          description: "with invalid position values",
          src: new Source(`hello\nworld\n`),
          subjects: [
            { pos: { line: -1, column: -1 }, lines: 1, expected: `` },
            { pos: { line: -1, column: 0 }, lines: 1, expected: `` },
            { pos: { line: -1, column: 1 }, lines: 1, expected: `` },
            { pos: { line: 0, column: -1 }, lines: 1, expected: `` },
            { pos: { line: 0, column: 0 }, lines: 1, expected: `` },
            { pos: { line: 0, column: 1 }, lines: 1, expected: `` },
            { pos: { line: 1, column: -1 }, lines: 1, expected: `` },
            { pos: { line: 1, column: 0 }, lines: 1, expected: `` },
          ],
        },
        {
          description: "with invalid lines values",
          src: new Source(`hello\nworld\n`),
          subjects: [
            { pos: { line: 1, column: 1 }, lines: -1, expected: `` },
            { pos: { line: 1, column: 1 }, lines: 0, expected: `` },
          ],
        },
        {
          description: "with empty source",
          src: new Source(``),
          subjects: [{ pos: { line: 1, column: 1 }, lines: 1, expected: `` }],
        },
        {
          description: "with out-of-bounds position line",
          src: new Source(`hello\nworld\n`),
          subjects: [
            { pos: { line: 3, column: 1 }, lines: 1, expected: `` },
            { pos: { line: 4, column: 1 }, lines: 1, expected: `` },
          ],
        },
        {
          description: "with out-of-bounds position column",
          src: new Source(`brave\nnew\nworld\n`),
          subjects: [
            { pos: { line: 1, column: 6 }, lines: 1, expected: `` },
            { pos: { line: 2, column: 4 }, lines: 1, expected: `` },
            { pos: { line: 3, column: 6 }, lines: 1, expected: `` },
          ],
        },
        {
          description: "with valid position values",
          src: new Source(`brave\nnew\nworld\n`),
          subjects: [
            { pos: { line: 1, column: 3 }, lines: 1, expected: `brave\nnew\n` },
            { pos: { line: 2, column: 2 }, lines: 1, expected: `brave\nnew\nworld\n` },
            { pos: { line: 3, column: 3 }, lines: 1, expected: `new\nworld\n` },
          ],
        },
        {
          description: "with valid position values and out-of-bounds lines values",
          src: new Source(
            `O Fortuna,\nvelut luna\nstatu variabilis,\n` +
              `semper crescis\naut decrescis;\nvita detestabilis\n`
          ),
          subjects: [
            { pos: { line: 1, column: 1 }, lines: 1, expected: `O Fortuna,\nvelut luna\n` },
            {
              pos: { line: 2, column: 7 },
              lines: 2,
              expected: `O Fortuna,\nvelut luna\nstatu variabilis,\nsemper crescis\n`,
            },
            {
              pos: { line: 3, column: 17 },
              lines: 5,
              expected:
                `O Fortuna,\nvelut luna\nstatu variabilis,\n` +
                `semper crescis\naut decrescis;\nvita detestabilis\n`,
            },
          ],
        },
      ];

      testCases.forEach(({ description, src, subjects }, caseIdx) => {
        describe(description, () => {
          subjects.forEach(({ pos, lines, expected }, subjectIdx) => {
            it("should return correct context", () => {
              const actual = src.context(pos, lines);
              const message = `case: #${caseIdx}, subject: #${subjectIdx}`;

              expect(actual, message).to.equal(expected);
            });
          });
        });
      });
    });
  });
});
