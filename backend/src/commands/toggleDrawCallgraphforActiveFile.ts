import * as vscode from "vscode";
import { Logger } from "../utils/logger";
import { drawCallgraphForFile } from "./drawCallgraphForFile";
import { globals } from "../utils/globals";

export function toggleDrawCallgraphforActiveFile(
  extensionUri: vscode.Uri,
  logger: Logger
) {
  logger.info(
    `Toggling draw callgraph for active file to ${!globals.SHOULD_DRAW_CALLGRAPH_FOR_ACTIVE_FILE}`
  );
  globals.SHOULD_DRAW_CALLGRAPH_FOR_ACTIVE_FILE =
    !globals.SHOULD_DRAW_CALLGRAPH_FOR_ACTIVE_FILE;

  if (!globals.SHOULD_DRAW_CALLGRAPH_FOR_ACTIVE_FILE) {
    if (globals.ACTIVE_FILE_LISTENER) {
      globals.ACTIVE_FILE_LISTENER.dispose();
      globals.ACTIVE_FILE_LISTENER = null;
    }
    return;
  }

  if (globals.SHOULD_DRAW_CALLGRAPH_FOR_ACTIVE_FILE) {
    const activeFile = vscode.window.activeTextEditor?.document.uri;
    if (activeFile) {
      drawCallgraphForFile(extensionUri, logger, {
        column: (vscode.window.activeTextEditor?.viewColumn ?? 0) + 1,
      })(activeFile);
    }

    globals.ACTIVE_FILE_LISTENER = vscode.window.onDidChangeActiveTextEditor(
      (editor) => {
        const activeFile = editor?.document.uri;
        if (activeFile) {
          drawCallgraphForFile(extensionUri, logger, {
            column: (vscode.window.activeTextEditor?.viewColumn ?? 0) + 1,
          })(activeFile);
        }
      }
    );
    return;
  }
}
