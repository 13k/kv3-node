import { MultilineStringToken, StringToken, TextToken } from "../token/token";
import { Node } from "./node";

/**
 * StringNode represents a string value.
 *
 * Children: none.
 *
 * Tokens (length: 1 or 2):
 *   - A {@link StringToken} or {@link MultilineStringToken} containing the string text.
 *   - A {@link TextToken} containing the flag name if this is a {@link
 *     https://developer.valvesoftware.com/wiki/Dota_2_Workshop_Tools/KeyValues3#Flags |
 *     flagged string}.
 *
 * @note It's not clear from the "specification" page whether all property values can be flagged.
 *       This implementation adopts the strict approach of only allowing single-line strings to be
 *       flagged.
 */
export class StringNode extends Node {
  /**
   * @param parent Parent node.
   * @param token A token containing the string text.
   * @param flagToken A token containing the flag name if this is a {@link
   *        https://developer.valvesoftware.com/wiki/Dota_2_Workshop_Tools/KeyValues3#Flags |
   *        flagged string}.
   */
  constructor(parent: Node, token: StringToken | MultilineStringToken, flagToken?: TextToken) {
    super(parent);

    this.appendTokens(token);

    if (flagToken != null) {
      this.appendTokens(flagToken);
    }
  }

  /** Returns the string text from the first token */
  get text(): string {
    if (this.firstToken == null) {
      throw this.error("missing string token");
    }

    return this.firstToken.text;
  }

  /** Returns the flag text from the second token */
  get flagText(): string | null {
    return this.tokens[1]?.text ?? null;
  }
}
