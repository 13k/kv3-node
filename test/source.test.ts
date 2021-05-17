import { expect } from "chai";
import { inspect } from "util";

import { Position, Source } from "../src/source";

interface SourceIndexOfTestCase {
  description: string;
  src: Source;
  subjects: [Position, number][];
}

describe("Source", () => {
  describe("indexOf", () => {
    const testCases: SourceIndexOfTestCase[] = [
      {
        description: "with invalid position values",
        src: new Source(`hello\nworld\n`),
        subjects: [
          [{ offset: -1, line: -1, column: -1 }, -1],
          [{ offset: -1, line: -1, column: 0 }, -1],
          [{ offset: -1, line: -1, column: 1 }, -1],
          [{ offset: -1, line: 0, column: -1 }, -1],
          [{ offset: -1, line: 0, column: 0 }, -1],
          [{ offset: -1, line: 0, column: 1 }, -1],
          [{ offset: -1, line: 1, column: -1 }, -1],
          [{ offset: -1, line: 1, column: 0 }, -1],
          [{ offset: -1, line: 1, column: 1 }, -1],
          [{ offset: 0, line: -1, column: -1 }, -1],
          [{ offset: 0, line: -1, column: 0 }, -1],
          [{ offset: 0, line: -1, column: 1 }, -1],
          [{ offset: 0, line: 0, column: -1 }, -1],
          [{ offset: 0, line: 0, column: 0 }, -1],
          [{ offset: 0, line: 0, column: 1 }, -1],
          [{ offset: 0, line: 1, column: -1 }, -1],
          [{ offset: 0, line: 1, column: 0 }, -1],
        ],
      },
      {
        description: "with empty source",
        src: new Source(``),
        subjects: [[{ offset: 0, line: 1, column: 1 }, -1]],
      },
      {
        description: "with out-of-bounds position offset",
        src: new Source(`hello\nworld\n`),
        subjects: [
          [{ offset: 12, line: 1, column: 1 }, -1],
          [{ offset: 99, line: 1, column: 1 }, -1],
        ],
      },
      {
        description: "with out-of-bounds position line",
        src: new Source(`hello\nworld\n`),
        subjects: [
          [{ offset: 0, line: 3, column: 1 }, -1],
          [{ offset: 0, line: 4, column: 1 }, -1],
        ],
      },
      {
        description: "with out-of-bounds position column",
        src: new Source(`brave\nnew\nworld\n`),
        subjects: [
          [{ offset: 0, line: 1, column: 6 }, -1],
          [{ offset: 0, line: 2, column: 4 }, -1],
          [{ offset: 0, line: 3, column: 6 }, -1],
        ],
      },
      {
        description: "without position offset",
        src: new Source(`brave\nnew\nworld\n`),
        subjects: [
          [{ offset: 0, line: 1, column: 3 }, 2],
          [{ offset: 0, line: 2, column: 3 }, 8],
          [{ offset: 0, line: 3, column: 3 }, 12],
        ],
      },
      {
        description: "with position offset at line-ending",
        src: new Source(`brave\nnew\nworld\n`),
        subjects: [
          [{ offset: 5, line: 1, column: 1 }, 6],
          [{ offset: 9, line: 1, column: 1 }, 10],
          [{ offset: 15, line: 1, column: 1 }, -1],
        ],
      },
      {
        description: "with position offset at non-line-ending",
        src: new Source(`hello\nworld\n`),
        subjects: [
          [{ offset: 0, line: 1, column: 1 }, 0],
          [{ offset: 4, line: 1, column: 1 }, 4],
          [{ offset: 6, line: 1, column: 1 }, 6],
          [{ offset: 10, line: 1, column: 1 }, 10],
        ],
      },
    ];

    testCases.forEach(({ description, src, subjects }, caseIdx) => {
      describe(description, () => {
        subjects.forEach(([pos, expected], subjectIdx) => {
          it(`should return ${expected}`, () => {
            const message = `case #${caseIdx}, subject #${subjectIdx}: ${inspect(src.data)}`;

            expect(src.indexOf(pos), message).to.equal(expected);
          });
        });
      });
    });
  });
});
