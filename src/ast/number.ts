import { NumberToken } from "../token/token";
import { Node } from "./node";

/**
 * NumberNode represents a number value.
 *
 * Children: none.
 *
 * Tokens (length: 1):
 *   - A {@link NumberToken} containing the number text
 */
export class NumberNode extends Node {
  /**
   * @param parent Parent node.
   * @param token A token containing the number text.
   */
  constructor(parent: Node, token: NumberToken) {
    super(parent);

    this.appendTokens(token);
  }

  /** Returns the number text from the first token */
  get text(): string {
    if (this.firstToken == null) {
      throw this.error("missing number token");
    }

    return this.firstToken.text;
  }
}
