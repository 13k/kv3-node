import { strict as assert } from "assert";
import { readFile } from "fs";
import { promisify } from "util";

import { Parser } from "./parser";
import { Input } from "./source";
import { createObject } from "./values";

const readFileP = promisify(readFile);

export async function parseFile(filename: string): Promise<Record<string, unknown>> {
  const src = await readFileP(filename, { encoding: "utf-8" });

  return parse(src, filename);
}

export async function parse(src: string, filename?: string): Promise<Record<string, unknown>> {
  const input = new Input(src, filename);
  const parser = new Parser(input);
  const root = parser.parse();

  assert(root.isObject());

  return createObject(root);
}
