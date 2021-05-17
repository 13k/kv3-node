import { TextToken } from "../token";
import { Node } from "./node";

/**
 * ObjectNode represents an object value.
 *
 * Children (length: 0 or more): {@link PropertyNode} or {@link CommentNode}.
 *
 * Tokens (length: 2):
 *   - An {@link ObjectOpenToken}
 *   - An {@link ObjectCloseToken}
 */
export class ObjectNode extends Node {
  *propertyNodes(): Generator<PropertyNode, void, undefined> {
    for (const node of this.nodes) {
      if (node instanceof PropertyNode) {
        yield node;
      }
    }
  }
}

/**
 * RootNode is the root {@link ObjectNode} of an AST.
 */
export class RootNode extends ObjectNode {
  constructor() {
    super();
  }
}

/**
 * PropertyNode represents one property of an {@link ObjectNode}.
 *
 * Children (length: 1): one {@link Node} representing the property value.
 *
 * Tokens (length: 2):
 *   - A {@link TextToken} containing the property name text
 *   - A {@link ControlToken} with code {@link TokenCode.Equals}
 *
 * @note Currently, the ending position of the node cannot be determined.
 */
export class PropertyNode extends Node {
  /**
   * @param parent Parent node.
   * @param token A token containing the property name text.
   */
  constructor(parent: ObjectNode, token: TextToken) {
    super(parent);

    this.appendTokens(token);
  }

  /** Returns the property name from the first token */
  get name(): string {
    if (this.firstToken == null) {
      throw this.error("missing property name token");
    }

    return this.firstToken.text;
  }

  /** Returns the value node (first child node). */
  get valueNode(): Node {
    if (this.first == null) {
      throw this.error("missing property value node");
    }

    return this.first;
  }
}
