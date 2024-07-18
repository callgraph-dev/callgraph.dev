import * as vscode from "vscode";
import { retry } from "../retry";

export async function getIncomingCalls(
  uri: vscode.Uri,
  position: vscode.Position,
  token: vscode.CancellationToken
): Promise<vscode.CallHierarchyIncomingCall[] | undefined> {
  try {
    console.time("getIncomingCalls");
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

    let allOutgoingCalls: vscode.CallHierarchyIncomingCall[] = [];
    for (let callitem of callitems) {
      if (token.isCancellationRequested) {
        return undefined;
      }
      const outgoingCalls = await retry<
        vscode.CallHierarchyIncomingCall[] | undefined
      >(
        async () => {
          if (token.isCancellationRequested) {
            return undefined;
          }
          return await vscode.commands.executeCommand(
            "vscode.provideIncomingCalls",
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
    console.timeEnd("getIncomingCalls");
  }
}
