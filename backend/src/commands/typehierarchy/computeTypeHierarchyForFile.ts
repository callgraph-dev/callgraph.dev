import * as vscode from "vscode";
import {
  GraphBuilder,
  filterByPathFn,
  getPosition,
  isTypeHierarchySymbol,
  stripFilePrefix,
} from "../../utils/graph";
import { Logger } from "../../utils/logger";
import { getSupertypes } from "../../utils/vscodecmd/getSupertypes";
import { getSymbols } from "../../utils/vscodecmd/getSymbols";

export async function computeTypeHierarchyForFile(
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
    console.time(`computeTypeHierarchyForFile: ${file.fsPath}`);
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

    // filter to only type hierarchy symbols
    symbols = symbols.filter((s) => isTypeHierarchySymbol(s));

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
      let supertypes;
      try {
        supertypes = await getSupertypes(
          file,
          getPosition(symbol, file),
          token
        );
        if (!supertypes) {
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

      for (const supertype of supertypes) {
        if (token.isCancellationRequested) {
          return;
        }

        // skip edges that don't pass the filter
        if (!filterByPathFn(file, options?.filterByPath)) {
          continue;
        }
        if (!filterByPathFn(supertype.uri, options?.filterByPath)) {
          continue;
        }

        gb.addEdge(
          "symbol",
          file.fsPath,
          symbol.name,
          getPosition(symbol, file).line,
          getPosition(symbol, file).character,
          "symbol",
          supertype.uri.fsPath,
          supertype.name,
          supertype.selectionRange.start.line,
          supertype.selectionRange.start.character
        );
      }
    }

    progress.report({
      message: stripFilePrefix(file, options?.stripFilePrefix),
      increment: 100 / totalFiles,
    });

    return;
  } finally {
    console.timeEnd(`computeTypeHierarchyForFile: ${file.fsPath}`);
  }
}
