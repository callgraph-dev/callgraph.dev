import * as vscode from "vscode";
import { Logger } from "../utils/logger";
import { GraphBuilder } from "../utils/graph";
import { drawGraph } from "../utils/panel/drawGraph";
import { UserFacingError } from "../utils/error";
import { computeCallgraphForFile } from "./callgraph/computeCallgraphForFile";
import { log } from "console";

export function drawCallgraphForFile(
  extensionUri: vscode.Uri,
  logger: Logger,
  options?: {
    column?: vscode.ViewColumn;
  }
): (file: vscode.Uri) => Promise<void> {
  return async (file: vscode.Uri) => {
    logger.info(`Drawing call graph for ${file.fsPath}`);
    vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Drawing call graph",
        cancellable: true,
      },
      async (progress, token) => {
        try {
          const gb = new GraphBuilder();
          await computeCallgraphForFile(progress, logger, file, 1, gb, token, {
            filterByPath: file,
          });
          const graph = gb.graph();
          drawGraph(logger, extensionUri, graph, options);
        } catch (error) {
          logger.error(`Unexpected error: ${error}`);
          if (error instanceof UserFacingError) {
            progress.report({ message: error.message });
          } else {
            progress.report({ message: "Unexpected error" });
          }
          // Display error for 2 sec
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }
    );
  };
}
