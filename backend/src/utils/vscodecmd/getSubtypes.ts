import * as vscode from "vscode";
import { retry } from "../retry";

export async function getSubtypes(
  uri: vscode.Uri,
  position: vscode.Position,
  token: vscode.CancellationToken
): Promise<vscode.TypeHierarchyItem[] | undefined> {
  try {
    console.time("getSubtypes");
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

    let allSubtypes: vscode.TypeHierarchyItem[] = [];
    for (let typeitem of typeitems) {
      if (token.isCancellationRequested) {
        return undefined;
      }
      const subtypes = await retry<vscode.TypeHierarchyItem[] | undefined>(
        async () => {
          if (token.isCancellationRequested) {
            return undefined;
          }
          return await vscode.commands.executeCommand(
            "vscode.provideSubtypes",
            typeitem
          );
        },
        { maxRetries: 2, delay: 100 }
      );
      if (subtypes !== undefined) {
        allSubtypes = allSubtypes.concat(subtypes);
      }
    }
    return allSubtypes;
  } catch (error) {
    console.error(JSON.stringify(error));
  } finally {
    console.timeEnd("getSubtypes");
  }
}
