import * as vscode from "vscode";
import {
  GraphBuilder,
  filterByPathFn,
  getPosition,
  stripFilePrefix,
} from "../../utils/graph";
import { Logger } from "../../utils/logger";
import { getOutgoingCalls } from "../../utils/vscodecmd/getOutgoingCalls";
import { getSymbols } from "../../utils/vscodecmd/getSymbols";

export async function computeCallgraphForFile(
  progress: vscode.Progress<{ message?: string; increment?: number }>,
  logger: Logger,
  file: vscode.Uri,
  totalFiles: number,
  gb: GraphBuilder,
  token: vscode.CancellationToken,
  options?: {
    stripFilePrefix?: vscode.Uri;
    filterByPath?: vscode.Uri;
  }
): Promise<void> {
  try {
    console.time(`computeCallgraphForFile: ${file.fsPath}`);
    if (token.isCancellationRequested) {
      return;
    }

    let symbols;
    try {
      symbols = await getSymbols(file, token);
      if (!symbols || symbols.length === 0) {
        logger.info(`No symbols found for ${file}`);
        return;
      }
    } catch (error) {
      logger.info(`Error getting symbols in ${file}`);
      return;
    }

    // set nodes
    for (const symbol of symbols) {
      if (token.isCancellationRequested) {
        return;
      }

      gb.addNode(
        "symbol",
        file.fsPath,
        symbol.name,
        getPosition(symbol, file).line,
        getPosition(symbol, file).character
      );
    }

    // set edges
    for (const symbol of symbols) {
      if (token.isCancellationRequested) {
        return;
      }
      let outgoingCalls;
      try {
        outgoingCalls = await getOutgoingCalls(
          file,
          getPosition(symbol, file),
          token
        );
        if (!outgoingCalls) {
          logger.info(
            `No supertypes found for ${symbol.name} in ${file.fsPath}`
          );
          continue;
        }
      } catch (error) {
        logger.info(
          `Error getting supertypes for ${symbol.name} in ${file.fsPath}`
        );
        continue;
      }

      for (const outgoingCall of outgoingCalls) {
        if (token.isCancellationRequested) {
          return;
        }
        // skip edges that don't pass the filter
        if (!filterByPathFn(file, options?.filterByPath)) {
          continue;
        }
        if (!filterByPathFn(outgoingCall.to.uri, options?.filterByPath)) {
          continue;
        }

        gb.addEdge(
          "symbol",
          file.fsPath,
          symbol.name,
          getPosition(symbol, file).line,
          getPosition(symbol, file).character,
          "symbol",
          outgoingCall.to.uri.fsPath,
          outgoingCall.to.name,
          outgoingCall.to.range.start.line,
          outgoingCall.to.range.start.character
        );
      }
    }

    progress.report({
      message: stripFilePrefix(file, options?.stripFilePrefix),
      increment: 100 / totalFiles,
    });

    return;
  } finally {
    console.timeEnd(`computeCallgraphForFile: ${file.fsPath}`);
  }
}

function isCallItemSymbol(
  symbol: vscode.SymbolInformation | vscode.DocumentSymbol
): boolean {
  return (
    symbol.kind === vscode.SymbolKind.Function ||
    symbol.kind === vscode.SymbolKind.Method ||
    symbol.kind === vscode.SymbolKind.Constructor
  );
}
