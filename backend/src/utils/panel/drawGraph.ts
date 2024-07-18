import * as vscode from "vscode";
import { UserFacingError } from "../error";
import { Graph, SymbolsAndReferences } from "../graph";
import { Logger } from "../logger";
import { CallgraphWebviewPanel } from "./CallgraphWebviewPanel";

export function drawGraph(
  logger: Logger,
  extensionUri: vscode.Uri,
  graph: Graph,
  options?: {
    column?: vscode.ViewColumn;
    selectedFolder?: string;
    symbolsAndReferences?: SymbolsAndReferences;
  }
) {
  // [debug] log graph to output (eventually this will be posting it to panel!)
  // logger.info(JSON.stringify(graph));

  // 3. Open panel
  CallgraphWebviewPanel.createOrShow(extensionUri, logger, options);

  // 4. send graph as message to panel
  if (!CallgraphWebviewPanel.currentPanel) {
    throw new UserFacingError("Cannot draw graph. Missing tab.");
  }

  CallgraphWebviewPanel.currentPanel.postMessage({
    command: "drawGraph",
    payload: {
      graph,
      selectedFolder: options?.selectedFolder ?? null,
      symbolsAndReferences: options?.symbolsAndReferences ?? null,
    },
  });

  // 5. set language (this can move somewhere else)
  CallgraphWebviewPanel.currentPanel.postMessage({
    command: "setLanguage",
    payload: { language: "python" },
  });
}
