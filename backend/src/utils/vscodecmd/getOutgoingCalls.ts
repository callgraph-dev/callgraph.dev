import * as vscode from "vscode";
import { retry } from "../retry";

export async function getOutgoingCalls(
  uri: vscode.Uri,
  position: vscode.Position,
  token: vscode.CancellationToken
): Promise<vscode.CallHierarchyOutgoingCall[] | undefined> {
  try {
    console.time("getOutgoingCalls");
    const callitems = await retry<vscode.CallHierarchyItem[] | undefined>(
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

    if (callitems === undefined) {
      return undefined;
    }

    let allOutgoingCalls: vscode.CallHierarchyOutgoingCall[] = [];
    for (let callitem of callitems) {
      if (token.isCancellationRequested) {
        return undefined;
      }
      const outgoingCalls = await retry<
        vscode.CallHierarchyOutgoingCall[] | undefined
      >(
        async () => {
          if (token.isCancellationRequested) {
            return undefined;
          }
          return await vscode.commands.executeCommand(
            "vscode.provideOutgoingCalls",
            callitem
          );
        },
        { maxRetries: 2, delay: 100 }
      );
      if (outgoingCalls !== undefined) {
        allOutgoingCalls = allOutgoingCalls.concat(outgoingCalls);
      }
    }
    return allOutgoingCalls;
  } catch (error) {
    console.error(JSON.stringify(error));
  } finally {
    console.timeEnd("getOutgoingCalls");
  }
}
