/**
 * Type definitions -- keep in sync with vscodeext/callgraph-dev/src/utils/graph.ts
 */

export interface Node {
  id: string;
  key: string;
  type: "file" | "folder" | "symbol";
  displayName: string;
  filepath: string;
  lineno: number;
  colno: number;
}

export interface Snippet {
  lineno: number | null;
  text: string;
  displayName: string;
}

export interface Edge {
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
