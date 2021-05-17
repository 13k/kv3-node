import { Node } from "./node";

/**
 * ArrayNode represents an array value.
 *
 * Children (length: 0 or more): {@link Node} nodes of element values.
 *
 * Tokens (length: 2):
 *   - An {@link ArrayOpenToken}
 *   - An {@link ArrayCloseToken}
 */
export class ArrayNode extends Node {
  /**
   * @param parent Parent node.
   */
  constructor(parent: Node) {
    super(parent);
  }
}
