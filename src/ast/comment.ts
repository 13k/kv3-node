import { CommentToken, MultilineCommentToken } from "../token/token";
import { Node } from "./node";

/**
 * CommentNode represents a comment.
 *
 * Children: none.
 *
 * Tokens (length: 1):
 *   - A {@link CommentToken} or {@link MultilineCommentToken} containing the comment text
 */
export class CommentNode extends Node {
  /**
   * @param parent Parent node.
   * @param token A token containing the comment text.
   */
  constructor(parent: Node, token: CommentToken | MultilineCommentToken) {
    super(parent);

    this.appendTokens(token);
  }

  /** Returns the comment text from the first token */
  get text(): string {
    if (this.firstToken == null) {
      throw this.error("missing comment token");
    }

    return this.firstToken.text;
  }
}
