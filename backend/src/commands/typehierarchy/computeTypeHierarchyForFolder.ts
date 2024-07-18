import * as vscode from "vscode";
import { getFilesRecursively } from "../../utils/files";
import { getWorkspaceRoot, GraphBuilder } from "../../utils/graph";
import { Logger } from "../../utils/logger";
import { computeTypeHierarchyForFile } from "./computeTypeHierarchyForFile";

export async function computeTypeHierarchyForFolder(
  progress: vscode.Progress<{ message?: string; increment?: number }>,
  logger: Logger,
  folderPath: vscode.Uri,
  gb: GraphBuilder,
  token: vscode.CancellationToken,
  options?: {
    filterByPath?: vscode.Uri;
    totalFiles?: number;
  }
): Promise<void> {
  try {
    console.time(`computeTypeHierarchyForFolder: ${folderPath.fsPath}`);
    const workspaceRoot = getWorkspaceRoot(folderPath);
    const files = getFilesRecursively(folderPath.fsPath);

    for (const file of files) {
      if (token.isCancellationRequested) {
        return;
      }
      await computeTypeHierarchyForFile(
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
    console.timeEnd(`computeTypeHierarchyForFolder: ${folderPath.fsPath}`);
  }
}
