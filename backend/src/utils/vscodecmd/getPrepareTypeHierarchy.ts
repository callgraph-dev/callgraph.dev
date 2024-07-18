import * as vscode from "vscode";
import { retry } from "../retry";

export async function getPrepareTypeHierarchy(
  uri: vscode.Uri,
  position: vscode.Position,
  token: vscode.CancellationToken
): Promise<vscode.TypeHierarchyItem[] | undefined> {
  try {
    console.time("getPrepareTypeHierarchy");
    const typeitems = await retry<vscode.TypeHierarchyItem[] | undefined>(
      async () => {
        if (token.isCancellationRequested) {
          return undefined;
        }
        return await vscode.commands.executeCommand(
          "vscode.prepareTypeHierarchy",
          uri,
          position
        );
      },
      { maxRetries: 2, delay: 100 }
    );

    if (typeitems === undefined) {
      return undefined;
    }

    return typeitems;
  } catch (error) {
    console.error(JSON.stringify(error));
  } finally {
    console.timeEnd("getPrepareTypeHierarchy");
  }
}
