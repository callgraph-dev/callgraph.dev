import * as vscode from "vscode";
import { drawCallgraphForFile } from "./commands/drawCallgraphForFile";
import { drawCallgraphForFolder } from "./commands/drawCallgraphForFolder";
import { drawFileHierarchyForFolder } from "./commands/drawFileHierarchyForFolder";
import { drawTypeHierarchyForFile } from "./commands/drawTypeHierarchyForFile";
import { drawTypeHierarchyForFolder } from "./commands/drawTypeHierarchyForFolder";
import { expandCallgraphFromSymbol } from "./commands/expandCallgraphFromSymbol";
import { expandTypeHierarchyFromSymbol } from "./commands/expandTypeHierarchyFromSymbol";
import { toggleDrawCallgraphforActiveFile } from "./commands/toggleDrawCallgraphforActiveFile";
import { Logger } from "./utils/logger";

export async function activate(context: vscode.ExtensionContext) {
  console.log('"callgraph.dev" extension is now active!');

  // Create an output channel named 'My Extension Logs'
  const outputChannel = vscode.window.createOutputChannel("callgraph-dev");
  context.subscriptions.push(outputChannel);
  const logger = new Logger(outputChannel);

  // Commands must be registered in package.json#commands
  const commands: {
    [commandId: string]: (...args: any[]) => any;
  } = {
    "callgraph-dev.drawCallgraphForFile": drawCallgraphForFile(
      context.extensionUri,
      logger
    ),
    "callgraph-dev.drawTypeHierarchyForFile": drawTypeHierarchyForFile(
      context.extensionUri,
      logger
    ),
    "callgraph-dev.toggleDrawCallgraphforActiveFile": () =>
      toggleDrawCallgraphforActiveFile(context.extensionUri, logger),
    "callgraph-dev.drawCallgraphForFolder": drawCallgraphForFolder(
      context.extensionUri,
      logger
    ),
    "callgraph-dev.drawTypeHierarchyForFolder": drawTypeHierarchyForFolder(
      context.extensionUri,
      logger
    ),
    "callgraph-dev.expandTypeHierarchyFromSymbol":
      expandTypeHierarchyFromSymbol(context.extensionUri, logger),
    "callgraph-dev.expandCallgraphFromSymbol": expandCallgraphFromSymbol(
      context.extensionUri,
      logger
    ),
    "callgraph-dev.drawFileHierarchyForFolder": drawFileHierarchyForFolder(
    context.extensionUri,
      logger
    ),
  };

  Object.entries(commands).forEach(([commandId, fn]) => {
    const unregisterFn = vscode.commands.registerCommand(commandId, fn);
    context.subscriptions.push(unregisterFn);
  });

  // JUST FOR TESTING ONLY. REMOVE 'onStartupFinished' FROM package.json#activationEvents when done testing.
  // outputChannel.show();
  // await vscode.commands.executeCommand(
  //   "callgraph-dev.drawCallgraphForFile",
  //   vscode.Uri.file("/workspaces/Code/marshmallow/src/marshmallow/warnings.py")
  // );
}

// This method is called when your extension is deactivated
export function deactivate() {}
