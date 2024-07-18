import * as vscode from "vscode";
import { getFilesRecursively } from "../../utils/files";
import { GraphBuilder, getWorkspaceRoot } from "../../utils/graph";
import { Logger } from "../../utils/logger";
import { computeFileHierarchyForFile } from "./computeFileHierarchyForFile";

export async function computeFileHierarchyForFolder(
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
    console.time(`computeFileHierarchyForFolder: ${folderPath.fsPath}`);
    const workspaceRoot = getWorkspaceRoot(folderPath);
    const files = getFilesRecursively(folderPath.fsPath);

    for (const file of files) {
      if (token.isCancellationRequested) {
        return;
      }
      await computeFileHierarchyForFile(
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
    console.timeEnd(`computeFileHierarchyForFolder: ${folderPath.fsPath}`);
  }
}
