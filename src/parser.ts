import { inspect } from "util";

import {
  ArrayNode,
  BooleanNode,
  CommentNode,
  Node,
  NumberNode,
  ObjectNode,
  PropertyNode,
  RootNode,
  StringNode,
} from "./ast";
import { StringFlag } from "./const";
import { KeyValuesSyntaxError } from "./errors";
import { Source, SourcePosition } from "./source";
import {
  ArrayOpenToken,
  BooleanToken,
  CommentToken,
  ControlToken,
  KeywordToken,
  MultilineCommentToken,
  MultilineStringToken,
  NumberToken,
  ObjectOpenToken,
  StringToken,
  TextToken,
  Token,
  TokenCode,
  Tokenizer,
} from "./token";

const STRING_FLAG_VALUES: string[] = Object.values(StringFlag);

interface ReadOptions {
  ws?: boolean;
  eof?: boolean;
}

/**
 * Parser is responsible for parsing a {@link Source} and generating a {@link Node} tree.
 */
export class Parser {
  tokenizer: Tokenizer;
  #root: RootNode;
  #scope: Node;

  /**
   * @param src input source
   */
  constructor(public src: Source) {
    this.tokenizer = new Tokenizer(this.src);
    this.#root = new RootNode();
    this.#scope = this.#root;
  }

  /** Returns the raw kv3 header string. */
  get header(): string {
    return this.tokenizer.header;
  }

  /** Parses the source and returns an AST root node. */
  parse(): RootNode {
    const token = this.read();

    if (!token.isObjectOpen()) {
      throw this.syntaxError(token);
    }

    this.object(token);
    this.readEOF();

    return this.#root;
  }

  private syntaxError(token: Token, message?: string): KeyValuesSyntaxError {
    message ||= `Unexpected token ${token}`;

    return new KeyValuesSyntaxError(message, this.tokenSource(token));
  }

  private isRootScope(): boolean {
    return this.#scope.isRoot;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private assertScopeClass<T extends Node>(ctor: new (...args: any[]) => T): T {
    if (!(this.#scope instanceof ctor)) {
      throw new Error(
        `Internal error: expected scope to be any ${ctor.name}, but is ${this.#scope.type}`
      );
    }

    return this.#scope;
  }

  private assertScopeNode(node: Node): void {
    if (this.#scope !== node) {
      throw new Error(
        `Internal error: expected scope to be ${node.type}, but is ${this.#scope.type}`
      );
    }
  }

  private openScope<T extends Node>(node: T): T {
    this.#scope = node;

    return node;
  }

  private closeScope(): void {
    if (!this.#scope.hasParent()) {
      throw new Error("Internal error: scope parent is null");
    }

    this.#scope = this.#scope.parent;
  }

  private scopePush<T extends Node>(node: T): T {
    this.#scope.append(node);

    return node;
  }

  private _read(): Token {
    const next = this.tokenizer.next();

    if (next.done !== false) {
      throw new Error("Internal error: unexpected end of tokens stream");
    }

    return next.value;
  }

  private read({ ws, eof }: ReadOptions = {}): Token {
    let token = this._read();

    if (!ws) {
      while (token.isWhitespace()) {
        token = this._read();
      }
    }

    if (token.isEOF() && !eof) {
      throw this.syntaxError(token, "Unexpected end of file");
    }

    return token;
  }

  private readEOF(): void {
    const token = this.read({ eof: true });

    if (!token.isEOF()) {
      throw this.syntaxError(token, `Expected end of file, got ${token}`);
    }
  }

  private readControl<T extends TokenCode>(
    code: T,
    options: ReadOptions = {}
  ): ControlToken & { code: T } {
    const token = this.read(options);

    if (!token.isControlCode(code)) {
      throw this.syntaxError(
        token,
        `Unexpected token ${token}, expected ${inspect(String.fromCharCode(code))}`
      );
    }

    return token;
  }

  private tokenSource(token: Token): SourcePosition {
    const position = this.src.positionAt(token.start);

    if (position == null) {
      throw new Error(`Internal error: could not find position for token ${token}`);
    }

    return { source: this.src, position };
  }

  private parseToken(token: Token): Node {
    if (token.isControl()) {
      if (token.isObjectOpen()) {
        return this.object(token);
      } else if (token.isArrayOpen()) {
        return this.array(token);
      }

      throw this.syntaxError(token);
    }

    if (token.isKeyword()) {
      return this.keyword(token);
    }

    if (token.isNumber()) {
      return this.number(token);
    }

    if (token.isString() || token.isMultilineString()) {
      return this.string(token);
    }

    if (token.isComment() || token.isMultilineComment()) {
      return this.comment(token);
    }

    throw this.syntaxError(token);
  }

  private object(openToken: ObjectOpenToken): ObjectNode {
    let node: ObjectNode;

    // special case for first (and only) object as root node
    if (this.isRootScope()) {
      node = this.#root;
    } else {
      node = new ObjectNode(this.#scope);

      this.scopePush(node);
      this.openScope(node);
    }

    node.appendTokens(openToken);

    for (const token of this.tokenizer) {
      if (token.isObjectClose()) {
        this.assertScopeNode(node);

        if (!this.isRootScope()) {
          this.closeScope();
        }

        node.appendTokens(token);
        break;
      }

      if (token.isWhitespace()) {
        continue;
      }

      if (token.isText()) {
        this.objectProperty(token);
        continue;
      }

      if (token.isComment() || token.isMultilineComment()) {
        this.assertScopeNode(node);
        this.comment(token);
        continue;
      }

      throw this.syntaxError(token, `Unexpected token inside object: ${token}`);
    }

    return node;
  }

  private objectProperty(nameToken: TextToken): PropertyNode {
    const equalsToken = this.readControl(TokenCode.Equals);
    const scope = this.assertScopeClass(ObjectNode);
    const node = new PropertyNode(scope, nameToken).appendTokens(equalsToken);

    this.scopePush(node);
    this.openScope(node);

    let nextToken = this.read();

    if (nextToken.isText()) {
      const flagToken = nextToken;

      nextToken = this.read();

      if (!nextToken.isControlCode(TokenCode.Colon)) {
        throw this.syntaxError(
          nextToken,
          `Unexpected token in object property value: ${nextToken}`
        );
      }

      if (!STRING_FLAG_VALUES.includes(flagToken.text)) {
        throw this.syntaxError(flagToken, `Invalid flag ${inspect(flagToken.text)}`);
      }

      nextToken = this.read();

      if (!nextToken.isString()) {
        throw this.syntaxError(
          nextToken,
          "Invalid flagged value, only single-line strings can be flagged"
        );
      }

      this.string(nextToken, flagToken);
    } else {
      this.parseToken(nextToken);
    }

    this.closeScope();

    return node;
  }

  private array(openToken: ArrayOpenToken): ArrayNode {
    const node = new ArrayNode(this.#scope).appendTokens(openToken);

    this.scopePush(node);
    this.openScope(node);

    for (const token of this.tokenizer) {
      if (token.isArrayClose()) {
        this.assertScopeNode(node);
        this.closeScope();

        node.appendTokens(token);

        break;
      }

      if (token.isWhitespace() || token.isArrayElemSep()) {
        continue;
      }

      this.parseToken(token);
    }

    return node;
  }

  private keyword(token: KeywordToken): BooleanNode {
    if (token.isBoolean()) {
      return this.boolean(token);
    }

    throw this.syntaxError(token, `Unknown keyword ${inspect(token.text)}`);
  }

  private boolean(token: BooleanToken): BooleanNode {
    const node = new BooleanNode(this.#scope, token);

    return this.scopePush(node);
  }

  private number(token: NumberToken): NumberNode {
    const node = new NumberNode(this.#scope, token);

    return this.scopePush(node);
  }

  private string(token: StringToken | MultilineStringToken, flagToken?: TextToken): StringNode {
    const node = new StringNode(this.#scope, token, flagToken);

    return this.scopePush(node);
  }

  private comment(token: CommentToken | MultilineCommentToken): CommentNode {
    const node = new CommentNode(this.#scope, token);

    return this.scopePush(node);
  }
}
