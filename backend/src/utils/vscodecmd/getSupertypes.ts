import * as vscode from "vscode";
import { retry } from "../retry";

export async function getSupertypes(
  uri: vscode.Uri,
  position: vscode.Position,
  token: vscode.CancellationToken
): Promise<vscode.TypeHierarchyItem[] | undefined> {
  try {
    console.time("getSupertypes");
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

    let supertypes: vscode.TypeHierarchyItem[] = [];
    for (let typeitem of typeitems) {
      if (token.isCancellationRequested) {
        return undefined;
      }
      const supertype = await retry<vscode.TypeHierarchyItem[] | undefined>(
        async () => {
          if (token.isCancellationRequested) {
            return undefined;
          }
          return await vscode.commands.executeCommand(
            "vscode.provideSupertypes",
            typeitem
          );
        },
        { maxRetries: 2, delay: 100 }
      );
      if (supertype !== undefined) {
        supertypes = supertypes.concat(supertype);
      }
    }
    return supertypes;
  } catch (error) {
    console.error(JSON.stringify(error));
  } finally {
    console.timeEnd("getSupertypes");
  }
}
