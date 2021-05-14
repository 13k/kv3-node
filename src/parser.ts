import { AssertionError, strict as assert } from "assert";
import { inspect } from "util";

import { KeyValuesSyntaxError } from "./errors";
import { Node, NodeType } from "./node";
import { Input, Source } from "./source";
import { Token, TokenCode, Tokenizer, TokenType } from "./tokenizer";

interface ReadOptions {
  ws?: boolean;
  eof?: boolean;
}

export class Parser {
  tokenizer: Tokenizer;
  #root: Node;
  #scope?: Node;

  constructor(public input: Input) {
    this.tokenizer = new Tokenizer(this.input);
    this.#root = Node.root();
  }

  parse(): Node {
    const token = this.read();

    if (!token.isControl(TokenCode.LeftCurlyBracket)) {
      throw new KeyValuesSyntaxError(
        `Unexpected character: ${inspect(token.text)}`,
        this.tokenSource(token)
      );
    }

    this.object(token);
    this.readEOF();

    return this.#root;
  }

  private parseToken(token: Token): Node {
    switch (token.type) {
      case TokenType.Control:
        switch (token.code) {
          case TokenCode.LeftCurlyBracket:
            return this.object(token);

          case TokenCode.LeftSquareBracket:
            return this.array(token);

          default:
            throw new KeyValuesSyntaxError(
              `Unexpected character: ${inspect(token.text)}`,
              this.tokenSource(token)
            );
        }

      case TokenType.Comment:
      case TokenType.MultilineComment:
        return this.comment(token);

      case TokenType.String:
      case TokenType.MultilineString:
        return this.string(token);

      case TokenType.Number:
        return this.number(token);

      case TokenType.Keyword:
        return this.keyword(token);

      default:
        throw new KeyValuesSyntaxError(
          `Unexpected token: ${inspect(token.text)}`,
          this.tokenSource(token)
        );
    }
  }

  private tokenSource(token: Token): Source {
    const position = this.input.positionAt(token.start);

    if (position == null) {
      throw new Error(`Internal error: could not find position for token ${token}`);
    }

    return { input: this.input, position };
  }

  private _read(): Token {
    const next = this.tokenizer.next();

    if (next.done !== false) {
      throw new AssertionError({
        message: "Internal error: unexpected end of stream",
      });
    }

    return next.value;
  }

  private read({ ws, eof }: ReadOptions = {}): Token {
    let token = this._read();

    if (!ws) {
      while (token.isWhitespace) {
        token = this._read();
      }
    }

    if (token.isEOF && !eof) {
      throw new KeyValuesSyntaxError("Unexpected end of file", this.tokenSource(token));
    }

    return token;
  }

  private readEOF(): void {
    const token = this.read({ eof: true });

    if (!token.isEOF) {
      throw new KeyValuesSyntaxError(
        `Excess content ${inspect(token.text)}, expected end of file`,
        this.tokenSource(token)
      );
    }
  }

  private readControl(code: TokenCode, options: ReadOptions = {}): Token {
    const token = this.read(options);

    if (!token.isControl(code)) {
      throw new KeyValuesSyntaxError(
        `Unexpected token ${inspect(token.text)}, expected ${inspect(String.fromCharCode(code))}`,
        this.tokenSource(token)
      );
    }

    return token;
  }

  private scope(): Node {
    if (this.#scope == null) {
      throw new AssertionError({ message: "Internal error: current is null" });
    }

    return this.#scope;
  }

  private assertScope(node: Node): void {
    assert.equal(this.scope(), node);
  }

  private openScope(node: Node): void {
    this.#scope = node;
  }

  private closeScope(): void {
    if (this.scope().parent == null) {
      throw new AssertionError({ message: "Internal error: current.parent is null" });
    }

    this.#scope = this.scope().parent;
  }

  private createNode(type: NodeType, ...tokens: Token[]): Node {
    return this.scope().create(type, ...tokens);
  }

  private object(openToken: Token): Node {
    let node: Node;

    // special case for first (and only) object as root node
    if (this.#scope == null) {
      node = this.#root;
    } else {
      node = this.createNode(NodeType.Object, openToken);
    }

    this.openScope(node);

    for (const token of this.tokenizer) {
      if (token.isWhitespace) {
        continue;
      }

      if (token.isText) {
        this.objectProperty(token);
        continue;
      }

      if (token.isControl(TokenCode.RightCurlyBracket)) {
        this.assertScope(node);

        if (node !== this.#root) {
          this.closeScope();
        }

        node.tokens.push(token);

        break;
      }

      if (token.isComment) {
        this.assertScope(node);
        this.comment(token);

        continue;
      }

      throw new KeyValuesSyntaxError(
        `Unexpected token inside object: ${inspect(token.text)}`,
        this.tokenSource(token)
      );
    }

    return node;
  }

  private objectProperty(keyToken: Token): Node {
    const equalsToken = this.readControl(TokenCode.Equals);
    const node = this.createNode(NodeType.Property, keyToken, equalsToken);
    let nextToken = this.read();
    let flagToken: Token | undefined;

    this.openScope(node);

    if (nextToken.isText) {
      flagToken = nextToken;
      nextToken = this.read();

      if (!nextToken.isControl(TokenCode.Colon)) {
        throw new KeyValuesSyntaxError(
          `Unexpected token in object property value: ${inspect(nextToken.text)}`,
          this.tokenSource(nextToken)
        );
      }

      if (flagToken.text !== "resource" && flagToken.text !== "deferred_resource") {
        throw new KeyValuesSyntaxError(
          `Invalid flag ${flagToken.text}`,
          this.tokenSource(flagToken)
        );
      }

      nextToken = this.read();

      if (nextToken.type !== TokenType.String) {
        throw new KeyValuesSyntaxError(
          "Invalid flagged value, only single-line strings can be flagged",
          this.tokenSource(nextToken)
        );
      }

      this.createNode(NodeType.String, nextToken, flagToken);
    } else {
      this.parseToken(nextToken);
    }

    this.closeScope();

    return node;
  }

  private array(openToken: Token): Node {
    const node = this.createNode(NodeType.Array, openToken);

    this.openScope(node);

    for (const token of this.tokenizer) {
      if (token.isWhitespace || token.isControl(TokenCode.Comma)) {
        continue;
      }

      if (token.isControl(TokenCode.RightSquareBracket)) {
        this.assertScope(node);
        this.closeScope();

        node.tokens.push(token);

        break;
      }

      this.parseToken(token);
    }

    return node;
  }

  private number(token: Token): Node {
    return this.createNode(NodeType.Number, token);
  }

  private string(token: Token): Node {
    return this.createNode(NodeType.String, token);
  }

  private comment(token: Token): Node {
    return this.createNode(NodeType.Comment, token);
  }

  private keyword(token: Token): Node {
    switch (token.text) {
      case "true":
      case "false":
        return this.createNode(NodeType.Boolean, token);
      default:
        throw new KeyValuesSyntaxError(
          `Unknown keyword: ${inspect(token.text)}`,
          this.tokenSource(token)
        );
    }
  }
}
