import * as vscode from "vscode";
import { UserFacingError } from "../utils/error";
import { getWorkspaceRoot, GraphBuilder } from "../utils/graph";
import { Logger } from "../utils/logger";
import { drawGraph } from "../utils/panel/drawGraph";
import { computeCallgraphForSymbol } from "./callgraph/computeCallgraphForSymbol";

export function expandCallgraphFromSymbol(
  extensionUri: vscode.Uri,
  logger: Logger
): (file: vscode.Uri) => Promise<void> {
  return async (file: vscode.Uri) => {
    vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Drawing call graph",
        cancellable: true,
      },
      async (progress, token) => {
        try {
          const position = await vscode.window.activeTextEditor?.selection
            .active;
          if (!position) {
            throw new UserFacingError(
              "Could not find symbol at cursor position."
            );
          }
          const gb = new GraphBuilder();
          await computeCallgraphForSymbol(
            progress,
            logger,
            file,
            position,
            gb,
            token,
            {
              filterByPath: getWorkspaceRoot(file),
            }
          );
          const graph = gb.graph();
          drawGraph(logger, extensionUri, graph);
        } catch (error) {
          logger.error(`Unexpected error: ${JSON.stringify(error)}`);
          if (error instanceof UserFacingError) {
            progress.report({ message: error.message });
          } else {
            progress.report({ message: "Unexpected error" });
          }
        }
      }
    );
  };
}
