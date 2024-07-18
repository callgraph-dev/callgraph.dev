import * as vscode from "vscode";
import { getFilesRecursively } from "../../utils/files";
import { getWorkspaceRoot, GraphBuilder } from "../../utils/graph";
import { Logger } from "../../utils/logger";
import { computeCallgraphForFile } from "./computeCallgraphForFile";

// Draws a callgraph limiting symbols to folder + subdirectories.
export async function computeCallgraphForFolder(
  progress: vscode.Progress<{ message?: string; increment?: number }>,
  logger: Logger,
  folderPath: vscode.Uri,
  gb: GraphBuilder,
  token: vscode.CancellationToken,
  options?: {
    filterByPath?: vscode.Uri;
  }
): Promise<void> {
  try {
    console.time(`computeCallgraphForFolder: ${folderPath.fsPath}`);
    const workspaceRoot = getWorkspaceRoot(folderPath);
    logger.info(`workspaceRoot: ${workspaceRoot.fsPath}`);

    const files = getFilesRecursively(folderPath.fsPath);

    for (const file of files) {
      if (token.isCancellationRequested) {
        return;
      }
      await computeCallgraphForFile(
        progress,
        logger,
        vscode.Uri.joinPath(vscode.Uri.file(folderPath.fsPath), file),
        files.length,
        gb,
        token,
        {
          stripFilePrefix: workspaceRoot,
          filterByPath: options?.filterByPath,
        }
      );
    }
  } finally {
    console.timeEnd(`computeCallgraphForFolder: ${folderPath.fsPath}`);
  }
}
