import "core-js/modules/esnext.array.last-item";

import { Token } from "./tokenizer";

export enum NodeType {
  Object = "object",
  Property = "property",
  Array = "array",
  String = "string",
  Number = "number",
  Boolean = "boolean",
  Comment = "comment",
}

type NodeWithParent = Node & { parent: Node };

export class Node {
  static root(): Node {
    return new Node(NodeType.Object, undefined);
  }

  tokens: Token[];
  nodes: Node[];
  #toString?: string;

  constructor(public type: NodeType, public parent?: Node, ...tokens: Token[]) {
    this.tokens = tokens;
    this.nodes = [];
  }

  hasParent(): this is NodeWithParent {
    return this.parent != null;
  }

  get root(): Node {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let result: Node = this;

    while (result.parent) {
      result = result.parent;
    }

    return result;
  }

  get first(): Node | null {
    return this.nodes[0];
  }

  get last(): Node | null {
    return this.nodes.lastItem;
  }

  index(node: Node): number {
    return this.nodes.indexOf(node);
  }

  next(): Node | null {
    if (!this.hasParent()) return null;

    const index = this.parent.index(this);

    return this.parent.nodes[index + 1];
  }

  prev(): Node | null {
    if (!this.hasParent()) return null;

    const index = this.parent.index(this);

    return this.parent.nodes[index - 1];
  }

  create(type: NodeType, ...tokens: Token[]): Node {
    const node = new Node(type, this, ...tokens);

    this.push(node);

    return node;
  }

  push(child: Node): this {
    child.parent = this;

    this.nodes.push(child);

    return this;
  }

  unshift(child: Node): this {
    child.parent = this;

    this.nodes.unshift(child);

    return this;
  }

  append<T extends Node>(...children: T[]): this {
    for (const child of children) {
      this.push(child);
    }

    return this;
  }

  prepend<T extends Node>(...children: T[]): this {
    for (const child of children) {
      this.unshift(child);
    }

    return this;
  }

  toString(level = 0): string {
    if (this.#toString == null) {
      const indent = "  ".repeat(level);

      this.#toString = `${indent}(${this.type}`;

      if (this.nodes.length > 0) {
        this.#toString += "\n";

        for (const node of this.nodes) {
          this.#toString += `${node.toString(level + 1)}\n`;
        }

        this.#toString += `${indent})`;
      } else {
        this.#toString += ")";
      }
    }

    return this.#toString;
  }
}
