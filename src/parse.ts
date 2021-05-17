import { readFile } from "fs";
import { promisify } from "util";

import { Parser } from "./parser";
import { Source } from "./source";
import { createObject, ObjectValue } from "./values";

const readFileP = promisify(readFile);

/** Options passed to {@link parseFile}. */
export interface ParseFileOptions {
  /** Encoding of the file, defaults to "utf-8". */
  encoding?: string;
}

/**
 * Reads data from `filename` and parses the data.
 *
 * @param filename Path to file.
 * @param options Options object.
 * @param options.encoding Encoding of file. Default is "utf-8".
 */
export async function parseFile(
  filename: string,
  options: ParseFileOptions = {}
): Promise<ObjectValue> {
  const encoding = options.encoding ?? "utf-8";
  const data = await readFileP(filename, { encoding });

  return parse(data, { filename });
}

/** Options passed to {@link parse}. */
export interface ParseOptions {
  /** Filename to be shown in error messages. */
  filename?: string;
}

/** Parses the given `data`. */
export async function parse(data: string, options: ParseOptions = {}): Promise<ObjectValue> {
  const src = new Source(data, options.filename);
  const parser = new Parser(src);
  const root = parser.parse();

  return createObject(root);
}
