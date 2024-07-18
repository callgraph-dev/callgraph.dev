import * as vscode from "vscode";
import { Logger } from "../utils/logger";
import { GraphBuilder } from "../utils/graph";
import { computeTypeHierarchyForFolder } from "./typehierarchy/computeTypeHierarchyForFolder";
import { drawGraph } from "../utils/panel/drawGraph";
import { UserFacingError } from "../utils/error";

export function drawTypeHierarchyForFolder(
  extensionUri: vscode.Uri,
  logger: Logger
): (folderUri: vscode.Uri) => Promise<void> {
  return async (folderUri: vscode.Uri) => {
    logger.info(`Drawing type hierarchy for ${folderUri}`);
    vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Drawing type hierarchy",
        cancellable: true,
      },
      async (progress, token) => {
        try {
          const gb = new GraphBuilder();

          await computeTypeHierarchyForFolder(
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
