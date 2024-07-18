import * as vscode from "vscode";
import { retry } from "../retry";

export async function prepareCallHierarchy(
  uri: vscode.Uri,
  position: vscode.Position,
  token: vscode.CancellationToken
): Promise<vscode.CallHierarchyItem[] | undefined> {
  try {
    console.time("prepareCallHierarchy");
    const typeitems = await retry<vscode.CallHierarchyItem[] | undefined>(
      async () => {
        if (token.isCancellationRequested) {
          return undefined;
        }
        return await vscode.commands.executeCommand(
          "vscode.prepareCallHierarchy",
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
    console.timeEnd("prepareCallHierarchy");
  }
}
