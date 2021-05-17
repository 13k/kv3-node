import "core-js/modules/esnext.array.last-item";

import { KeyValuesError } from "../errors";
import { Token } from "../token/token";

/** ChildNode represents a {@link Node} with non-null `parent` property. */
export interface ChildNode extends Node {
  parent: Node;
}

/** Node is the abstract base node class. */
export abstract class Node {
  tokens: Token[];
  nodes: Node[];

  constructor(public parent?: Node) {
    this.tokens = [];
    this.nodes = [];
  }

  get type(): string {
    return this.constructor.name;
  }

  error(message: string): KeyValuesError {
    return new KeyValuesError(`${this.type}: ${message}`);
  }

  appendTokens(...tokens: Token[]): this {
    this.tokens.push(...tokens);

    return this;
  }

  get firstToken(): Token | null {
    return this.tokens[0];
  }

  get lastToken(): Token | null {
    return this.tokens.lastItem;
  }

  hasParent(): this is ChildNode {
    return this.parent != null;
  }

  get isRoot(): boolean {
    return !this.hasParent();
  }

  get root(): Node {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let result: Node = this;

    while (result.hasParent()) {
      result = result.parent;
    }

    return result;
  }

  /**
   * Returns the first child node.
   *
   * @returns Returns `null` if the children list is empty.
   */
  get first(): Node | null {
    return this.nodes[0] ?? null;
  }

  /**
   * Returns the last child node.
   *
   * @returns Returns `null` if the children list is empty.
   */
  get last(): Node | null {
    return this.nodes.lastItem ?? null;
  }

  /**
   * Returns the index of a given child node in this node's children list.
   *
   * @returns Returns `-1` if the child node is not found.
   */
  index(child: Node): number {
    return this.nodes.indexOf(child);
  }

  /**
   * Returns the previous sibling of this node.
   *
   * @returns Returns `null` if this node has no parent or if this node has no previous sibling.
   */
  get prev(): Node | null {
    if (!this.hasParent()) return null;

    const index = this.parent.index(this);

    return this.parent.nodes[index - 1];
  }

  /**
   * Returns the next sibling of this node.
   *
   * @returns Returns `null` if this node has no parent or if this node has no next sibling.
   */
  get next(): Node | null {
    if (!this.hasParent()) return null;

    const index = this.parent.index(this);

    return this.parent.nodes[index + 1] ?? null;
  }

  /** Prepends child nodes to the beggining this node's children list. */
  prepend<T extends Node>(...children: T[]): this {
    for (const child of children) {
      child.parent = this;

      this.nodes.unshift(child);
    }

    return this;
  }

  /** Appends child nodes to the end of this node's children list. */
  append<T extends Node>(...children: T[]): this {
    for (const child of children) {
      child.parent = this;

      this.nodes.push(child);
    }

    return this;
  }
}
