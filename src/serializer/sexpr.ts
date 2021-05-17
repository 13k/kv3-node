import { BooleanNode, CommentNode, NumberNode, PropertyNode, StringNode } from "../ast";
import type { Node } from "../ast/node";
import type { Serializer } from "./serializer";

/** SexprSerializer serializes a node tree as S-expressions. */
export class SexprSerializer implements Serializer {
  /** Serializes a node tree. */
  stringify(node: Node, level = 0): string {
    let result;
    const indent = "  ".repeat(level);

    result = `${indent}(${node.type}`;

    if (node instanceof PropertyNode) {
      result += ` [${node.name}]`;
    } else if (
      node instanceof NumberNode ||
      node instanceof BooleanNode ||
      node instanceof CommentNode
    ) {
      result += ` [${node.text}]`;
    } else if (node instanceof StringNode) {
      result += " [";

      if (node.flagText) {
        result += `${node.flagText}:`;
      }

      result += `${node.text}]`;
    }

    if (node.nodes.length > 0) {
      result += "\n";

      for (const child of node.nodes) {
        result += this.stringify(child, level + 1);
        result += "\n";
      }

      result += `${indent})`;
    } else {
      result += ")";
    }

    return result;
  }
}
