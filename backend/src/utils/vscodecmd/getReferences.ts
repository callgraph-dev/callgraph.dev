import * as vscode from "vscode";
import { retry } from "../retry";

export async function getReferences(
  uri: vscode.Uri,
  position: vscode.Position,
  token: vscode.CancellationToken
): Promise<vscode.Location[] | undefined> {
  try {
    console.time("getReferences");
    return retry<vscode.Location[] | undefined>(
      async () => {
        if (token.isCancellationRequested) {
          return undefined;
        }
        return vscode.commands.executeCommand(
          "vscode.executeReferenceProvider",
          uri,
          position
        );
      },
      { maxRetries: 2, delay: 100 }
    );
  } catch (error) {
    console.error(JSON.stringify(error));
  } finally {
    console.timeEnd("getReferences");
  }
}
