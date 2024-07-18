import * as vscode from "vscode";
import { retry } from "../retry";

export async function getSymbols(
  uri: vscode.Uri,
  token: vscode.CancellationToken
): Promise<(vscode.SymbolInformation | vscode.DocumentSymbol)[] | undefined> {
  try {
    console.time("getSymbols");
    return retry<
      (vscode.SymbolInformation | vscode.DocumentSymbol)[] | undefined
    >(
      async () => {
        if (token.isCancellationRequested) {
          return undefined;
        }
        return vscode.commands.executeCommand(
          "vscode.executeDocumentSymbolProvider",
          uri
        );
      },
      { maxRetries: 2, delay: 100 }
    );
  } catch (error) {
    console.error(JSON.stringify(error));
  } finally {
    console.timeEnd("getSymbols");
  }
}
