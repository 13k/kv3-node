import { ArrayNode, BooleanNode, Node, NumberNode, ObjectNode, StringNode } from "./ast";
import { Keyword, StringFlag } from "./const";
import { KeyValuesError } from "./errors";

const MULTI_LINE_STRING_OPEN = `"""\n`;
const MULTI_LINE_STRING_CLOSE = `\n"""`;

/** Represents all possible values in a KeyValues3 document. */
export type Value = string | FlaggedString | boolean | number | ArrayValue | ObjectValue;

/** Represents an array of values. */
export type ArrayValue = Value[];

/** Represents an object value. */
export interface ObjectValue {
  [property: string]: Value;
}

/**
 * Container for a {@link
 * https://developer.valvesoftware.com/wiki/Dota_2_Workshop_Tools/KeyValues3#Flags |
 * flagged string}.
 */
export class FlaggedString {
  /**
   * @param string String value
   * @param flag Flag value
   */
  constructor(public string: string, public flag: StringFlag) {}
}

/** Creates an {@link ObjectValue} from the given {@link ObjectNode}. */
export function createValue(node: ObjectNode): ObjectValue;
/** Creates an {@link ArrayValue} from the given {@link ArrayNode}. */
export function createValue(node: ArrayNode): ArrayValue;
/** Creates a `string` or {@link FlaggedString} from the given {@link StringNode}. */
export function createValue(node: StringNode): string | FlaggedString;
/** Creates a `number` from the given {@link NumberNode}. */
export function createValue(node: NumberNode): number;
/** Creates a `boolean` from the given {@link BooleanNode}. */
export function createValue(node: BooleanNode): boolean;
export function createValue(node: Node): Value {
  if (node instanceof ObjectNode) {
    return createObject(node);
  }

  if (node instanceof ArrayNode) {
    return createArray(node);
  }

  if (node instanceof StringNode) {
    return createString(node);
  }

  if (node instanceof NumberNode) {
    return createNumber(node);
  }

  if (node instanceof BooleanNode) {
    return createBoolean(node);
  }

  throw new KeyValuesError(`Invalid node type ${node.type}`);
}

/** Creates an {@link ObjectValue} from the given {@link ObjectNode}. */
export function createObject(node: ObjectNode): ObjectValue {
  const object: ObjectValue = {};

  for (const child of node.propertyNodes()) {
    object[child.name] = createValue(child.valueNode);
  }

  return object;
}

/** Creates an {@link ArrayValue} from the given {@link ArrayNode}. */
export function createArray(node: ArrayNode): ArrayValue {
  const ary: ArrayValue = [];

  for (const child of node.nodes) {
    ary.push(createValue(child));
  }

  return ary;
}

/** Creates a `string` or {@link FlaggedString} from the given {@link StringNode}. */
export function createString(node: StringNode): string | FlaggedString {
  const value = unquote(node.text);
  const flagText = node.flagText;

  if (flagText) {
    return new FlaggedString(value, parseStringFlagValue(flagText));
  }

  return value;
}

function unquote(s: string): string {
  if (s.startsWith(MULTI_LINE_STRING_OPEN) && s.endsWith(MULTI_LINE_STRING_CLOSE)) {
    return s.slice(MULTI_LINE_STRING_OPEN.length, -MULTI_LINE_STRING_CLOSE.length);
  }

  if (s.startsWith(`"`) && s.endsWith(`"`)) {
    return s.slice(1, -1);
  }

  return s;
}

function parseStringFlagValue(text: string): StringFlag {
  switch (text) {
    case StringFlag.Resource:
      return StringFlag.Resource;
    case StringFlag.DeferredResource:
      return StringFlag.DeferredResource;
  }

  throw new KeyValuesError(`Invalid string flag ${text}`);
}

/** Creates a `number` from the given {@link NumberNode}. */
export function createNumber(node: NumberNode): number {
  return parseNumberValue(node.text);
}

function parseNumberValue(text: string): number {
  return text.includes(".") ? parseFloat(text) : parseInt(text);
}

/** Creates a `boolean` from the given {@link BooleanNode}. */
export function createBoolean(node: BooleanNode): boolean {
  return parseBooleanValue(node.text);
}

function parseBooleanValue(text: string): boolean {
  switch (text) {
    case Keyword.True:
      return true;
    case Keyword.False:
      return false;
    default:
      throw new KeyValuesError(`Invalid boolean keyword ${text}`);
  }
}
