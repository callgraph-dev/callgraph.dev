import * as vscode from "vscode";
import { UserFacingError } from "../utils/error";
import {
  GraphBuilder,
  getWorkspaceRoot,
  stripFilePrefix,
} from "../utils/graph";
import { Logger } from "../utils/logger";
import { drawGraph } from "../utils/panel/drawGraph";
import { computeFileHierarchyForFolder } from "./filehierarchy/computeFileHierarchyForFolder";

export function drawFileHierarchyForFolder(
  extensionUri: vscode.Uri,
  logger: Logger
): (folderUri: vscode.Uri) => Promise<void> {
  return async (folderUri: vscode.Uri) => {
    logger.info(`Drawing file hierarchy for ${folderUri}`);
    vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Drawing file hierarchy",
        cancellable: true,
      },
      async (progress, token) => {
        try {
          const gb = new GraphBuilder();

          await computeFileHierarchyForFolder(
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
          drawGraph(logger, extensionUri, graph, {
            selectedFolder:
              stripFilePrefix(folderUri, getWorkspaceRoot(folderUri)) + "/",
            symbolsAndReferences: gb.symbolsAndReferences(),
          });
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
