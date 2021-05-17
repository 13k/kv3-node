import { BooleanToken } from "../token/token";
import { Node } from "./node";

/**
 * BooleanNode represents a boolean value.
 *
 * Children: none.
 *
 * Tokens (length: 1):
 *   - A {@link BooleanToken} containing the boolean keyword text
 */
export class BooleanNode extends Node {
  /**
   * @param parent Parent node.
   * @param token A token containing the boolean keyword text.
   */
  constructor(parent: Node, token: BooleanToken) {
    super(parent);

    this.appendTokens(token);
  }

  /** Returns the boolean text from the first token */
  get text(): string {
    if (this.firstToken == null) {
      throw this.error("missing keyword token");
    }

    return this.firstToken.text;
  }
}
