import { Node, NodeType } from "./node";

export type Value = string | FlagString | boolean | number | unknown[] | Record<string, unknown>;

export class FlagString extends String {
  constructor(s: string, public flag: string) {
    super(s);
  }

  toString(): string {
    return `${this.flag}:${super.toString()}`;
  }
}

function unpackString(s: string): string {
  if (s.startsWith(`"""\n`) && s.endsWith(`\n"""`)) {
    return s.slice(4, -4);
  }

  if (s.startsWith(`"`) && s.endsWith(`"`)) {
    return s.slice(1, -1);
  }

  return s;
}

export function createValue(node: Node & { type: NodeType.String }): string | FlagString;
export function createValue(node: Node & { type: NodeType.Boolean }): boolean;
export function createValue(node: Node & { type: NodeType.Number }): number;
export function createValue(node: Node & { type: NodeType.Array }): unknown[];
export function createValue(node: Node & { type: NodeType.Object }): Record<string, unknown>;
export function createValue(node: Node): unknown;
export function createValue(node: Node): Value {
  if (node.isString()) {
    return createString(node);
  }

  if (node.isBoolean()) {
    return createBoolean(node);
  }

  if (node.isNumber()) {
    return createNumber(node);
  }

  if (node.isArray()) {
    return createArray(node);
  }

  if (node.isObject()) {
    return createObject(node);
  }

  throw new Error(`Invalid node type ${node.type}`);
}

export function createString(node: Node & { type: NodeType.String }): string | FlagString {
  const str = unpackString(node.tokens[0].text);

  if (node.tokens.length > 1) {
    return new FlagString(str, node.tokens[1].text);
  }

  return str;
}

export function createBoolean(node: Node & { type: NodeType.Boolean }): boolean {
  const text = node.tokens[0].text;

  switch (text) {
    case "true":
      return true;
    case "false":
      return false;
    default:
      throw new Error(`Invalid boolean value ${text}`);
  }
}

export function createNumber(node: Node & { type: NodeType.Number }): number {
  const text = node.tokens[0].text;

  return text.includes(".") ? parseFloat(text) : parseInt(text);
}

export function createArray(node: Node & { type: NodeType.Array }): unknown[] {
  const ary: unknown[] = [];

  for (const child of node.nodes) {
    ary.push(createValue(child));
  }

  return ary;
}

export function createObject(node: Node & { type: NodeType.Object }): Record<string, unknown> {
  const object: Record<string, unknown> = {};

  for (const child of node.nodes) {
    if (child.type !== NodeType.Property) {
      continue;
    }

    const keyName = child.tokens[0].text;
    const valueNode = child.nodes[0];

    object[keyName] = createValue(valueNode);
  }

  return object;
}
