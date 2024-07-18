import * as vscode from "vscode";
import { Logger } from "../utils/logger";
import { GraphBuilder } from "../utils/graph";
import { computeCallgraphForFolder } from "./callgraph/computeCallgraphForFolder";
import { drawGraph } from "../utils/panel/drawGraph";
import { UserFacingError } from "../utils/error";

export function drawCallgraphForFolder(
  extensionUri: vscode.Uri,
  logger: Logger
): (folderUri: vscode.Uri) => Promise<void> {
  return async (folderUri: vscode.Uri) => {
    logger.info(`Drawing call graph for folder: ${folderUri.fsPath}`);
    vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Drawing call graph",
        cancellable: true,
      },
      async (progress, token) => {
        try {
          const gb = new GraphBuilder();
          await computeCallgraphForFolder(
            progress,
            logger,
            folderUri,
            gb,
            token,
            {
              filterByPath: folderUri,
            }
          );
          const graph = gb.graph();
          drawGraph(logger, extensionUri, graph);
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
