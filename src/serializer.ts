import type { Node } from "./node";

export interface Serializer {
  stringify(node: Node): string;
}
