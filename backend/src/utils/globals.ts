import * as vscode from "vscode";

interface Globals {
  SHOULD_DRAW_CALLGRAPH_FOR_ACTIVE_FILE: boolean;
  ACTIVE_FILE_LISTENER: vscode.Disposable | null;
}

export const globals: Globals = {
  SHOULD_DRAW_CALLGRAPH_FOR_ACTIVE_FILE: false,
  ACTIVE_FILE_LISTENER: null,
};
