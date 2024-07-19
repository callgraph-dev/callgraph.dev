import * as vscode from "vscode";

/**
 * Type definitions -- keep in sync with client/src/lib/graph.ts
 */

export interface Node {
  id: string;
  key: string;
  type: "file" | "folder" | "symbol";
  displayName: string;
  filepath: string;
  lineno: number;
  colno: number;
  hidden: boolean;
}

export interface Snippet {
  lineno: number | null;
  text: string;
  displayName: string;
}

export interface Edge {
  id: string;
  key: string;
  source: string;
  target: string;
  weight: number;
  snippets: Snippet[];
}

export interface Graph {
  nodes: Node[];
  edges: Edge[];
}

// Flattened version of vscode.SymbolInformation/vscode.DocumentSymbol
export interface CgSymbol {
  id: string;
  key: string;
  name: string;
  filepath: string;
  lineno: number;
  colno: number;
  kind: string;
}

// Flattened version of vscode.Location
export interface CgReference {
  id: string;
  key: string;
  symbolId: string;
  filepath: string;
  lineno: number;
  colno: number;
}

export interface SymbolsAndReferences {
  symbols: CgSymbol[];
  references: CgReference[];
}

/**
 * Helpers
 */

// QUEASTION: Can we replace getPosition with getLocation?
export function getPosition(
  symbol: vscode.SymbolInformation | vscode.DocumentSymbol,
  file: vscode.Uri
): vscode.Position {
  return getLocation(symbol, file).range.start;
}

// WARNING: The runtime type of SymbolInformation seems to have 'selectionRange'. At least in pylance.
//          Previously, used to find the text with `indexOf`. May have to fallback to that for other LSPs.
export function getLocation(
  symbol: vscode.SymbolInformation | vscode.DocumentSymbol,
  file: vscode.Uri
): vscode.Location {
  if ("selectionRange" in symbol) {
    return new vscode.Location(file, symbol.selectionRange);
  } else {
    return symbol.location;
  }
}

// getSymbolKind returns a string representation of the vscode.SymbolKind.
export function getSymbolKind(
  symbol: vscode.SymbolInformation | vscode.DocumentSymbol
): string {
  const mapping = {
    0: "File",
    1: "Module",
    2: "Namespace",
    3: "Package",
    4: "Class",
    5: "Method",
    6: "Property",
    7: "Field",
    8: "Constructor",
    9: "Enum",
    10: "Interface",
    11: "Function",
    12: "Variable",
    13: "Constant",
    14: "String",
    15: "Number",
    16: "Boolean",
    17: "Array",
    18: "Object",
    19: "Key",
    20: "Null",
    21: "EnumMember",
    22: "Struct",
    23: "Event",
    24: "Operator",
    25: "TypeParameter",
  };
  return mapping[symbol.kind];
}

export function getWorkspaceRoot(uri: vscode.Uri): vscode.Uri {
  const root = vscode.workspace.getWorkspaceFolder(uri);
  if (!root) {
    throw new Error("No workspace root found for " + uri.fsPath);
  }
  return root.uri;
}

export function stripFilePrefix(
  uri: vscode.Uri,
  workspaceRoot?: vscode.Uri
): string {
  if (!workspaceRoot) {
    return uri.fsPath;
  }

  if (uri.fsPath.startsWith(workspaceRoot.fsPath)) {
    let relativePath = uri.fsPath.slice(workspaceRoot.fsPath.length);
    if (relativePath.startsWith("/")) {
      relativePath = relativePath.slice(1);
    }
    return relativePath;
  }
  return uri.fsPath;
}

export function filterByPathFn(
  uri: vscode.Uri,
  filterByPath?: vscode.Uri
): boolean {
  if (!filterByPath) {
    return true;
  }
  return uri.fsPath.startsWith(filterByPath.fsPath);
}

export function isTypeHierarchySymbol(
  s: vscode.SymbolInformation | vscode.DocumentSymbol
): boolean {
  return (
    s.kind === vscode.SymbolKind.Class ||
    s.kind === vscode.SymbolKind.Interface ||
    s.kind === vscode.SymbolKind.TypeParameter
  );
}

function locationKey(location: vscode.Location): string {
  return location.uri.fsPath + "##" + location.range.start.line;
}

/** Expands all document symbol children and returns map of locationKey to symbol */
function expandSymbols(
  fileUri: vscode.Uri,
  symbols: (vscode.SymbolInformation | vscode.DocumentSymbol)[]
): { [key: string]: vscode.SymbolInformation | vscode.DocumentSymbol } {
  const mapping: {
    [key: string]: vscode.SymbolInformation | vscode.DocumentSymbol;
  } = {};
  for (const symbol of symbols) {
    if ("children" in symbol) {
      mapping[locationKey(new vscode.Location(fileUri, symbol.range))] = symbol;
      if (symbol.children.length > 0) {
        Object.assign(mapping, expandSymbols(fileUri, symbol.children));
      }
    } else {
      mapping[locationKey(symbol.location)] = symbol;
    }
  }
  return mapping;
}

export function merge(graph1: Graph, graph2: Graph): Graph {
  const nodes: Map<string, Node> = new Map();
  const edges: Map<string, Edge> = new Map();
  for (const node of graph1.nodes) {
    nodes.set(node.id, node);
  }
  for (const node of graph2.nodes) {
    nodes.set(node.id, node);
  }

  for (const edge of graph1.edges) {
    edges.set(edge.id, edge);
  }
  for (const edge of graph2.edges) {
    const existingEdge = edges.get(edge.id);
    if (existingEdge) {
      existingEdge.weight += 1;
    } else {
      edges.set(edge.id, edge);
    }
  }

  return {
    nodes: Array.from(nodes.values()),
    edges: Array.from(edges.values()),
  };
}

export class GraphBuilder {
  private symbolsByKey: Map<string, CgSymbol> = new Map();
  private referencesByKey: Map<string, CgReference> = new Map();
  private nodesByKey: Map<string, Node> = new Map();
  private edgesByKey: Map<string, Edge> = new Map();

  addNode(
    type: "file" | "symbol",
    filepath: string,
    displayName: string,
    lineno: number,
    colno: number
  ): Node {
    const key = `${filepath}|${displayName}`;
    if (this.nodesByKey.has(key)) {
      return this.nodesByKey.get(key)!;
    }
    const node: Node = {
      id: generateRandomId(12),
      key: key,
      type: type,
      filepath: filepath,
      displayName: displayName,
      lineno: lineno,
      colno: colno,
      hidden: false,
    };
    if (!this.nodesByKey.has(node.key)) {
      this.nodesByKey.set(node.key, node);
    }
    return node;
  }

  addEdge(
    srcType: "file" | "symbol",
    srcFileUri: string,
    srcDisplayName: string,
    srcLineno: number,
    srcColno: number,
    dstType: "file" | "symbol",
    dstFileUri: string,
    dstDisplayName: string,
    dstLineno: number,
    dstColno: number
  ): Edge {
    const src = this.addNode(
      srcType,
      srcFileUri,
      srcDisplayName,
      srcLineno,
      srcColno
    );
    const dst = this.addNode(
      dstType,
      dstFileUri,
      dstDisplayName,
      dstLineno,
      dstColno
    );
    const key = `${src.key}||${dst.key}`;
    if (this.edgesByKey.has(key)) {
      return this.edgesByKey.get(key)!;
    }
    const edge: Edge = {
      id: generateRandomId(12),
      key: key,
      source: src.id,
      target: dst.id,
      weight: 1,
      snippets: [],
    };
    if (!this.edgesByKey.has(edge.key)) {
      this.edgesByKey.set(edge.key, edge);
    }
    return edge;
  }

  graph(): Graph {
    this.verify();
    const nodes: Node[] = Array.from(this.nodesByKey.values());
    const edges: Edge[] = Array.from(this.edgesByKey.values());
    return { nodes, edges };
  }

  // asserts that all sources + targets exist as nodes
  verify(): void {
    for (const edge of this.edgesByKey.values()) {
      const [src, dst] = edge.key.split("||");
      const source = this.nodesByKey.get(src);
      const target = this.nodesByKey.get(dst);
      if (!source || !target) {
        throw new Error(
          `Edge ${edge.key} references non-existent nodes ${edge.source} and ${edge.target}`
        );
      }
    }
  }

  addSymbol(
    rawSymbol: vscode.SymbolInformation | vscode.DocumentSymbol,
    file: vscode.Uri
  ): CgSymbol {
    const position = getPosition(rawSymbol, file);
    const symbol: CgSymbol = {
      id: generateRandomId(12),
      key: `${file.fsPath}|${rawSymbol.name}`,
      name: rawSymbol.name,
      filepath: file.fsPath,
      lineno: position.line,
      colno: position.character,
      kind: getSymbolKind(rawSymbol),
    };
    if (!this.symbolsByKey.has(symbol.key)) {
      this.symbolsByKey.set(symbol.key, symbol);
    }
    return symbol;
  }

  addReference(rawReference: vscode.Location, symbol: CgSymbol): CgReference {
    const reference: CgReference = {
      id: generateRandomId(12),
      key: `${rawReference.uri.fsPath}|${rawReference.range.start.line}`,
      symbolId: symbol.id,
      filepath: rawReference.uri.fsPath,
      lineno: rawReference.range.start.line,
      colno: rawReference.range.start.character,
    };
    if (!this.referencesByKey.has(reference.key)) {
      this.referencesByKey.set(reference.key, reference);
    }
    return reference;
  }

  symbolsAndReferences(): SymbolsAndReferences {
    return {
      symbols: Array.from(this.symbolsByKey.values()),
      references: Array.from(this.referencesByKey.values()),
    };
  }
}

function generateRandomId(length: number): string {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}
