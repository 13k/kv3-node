import type { Node } from "../ast/node";

/** Serializer is an interface defining the API for serializing a {@link Node} tree. */
export interface Serializer {
  /** Serializes a node tree. */
  stringify(node: Node): string;
}
