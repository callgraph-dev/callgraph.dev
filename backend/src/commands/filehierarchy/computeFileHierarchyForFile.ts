import * as vscode from "vscode";
import {
  GraphBuilder,
  filterByPathFn,
  getPosition,
  stripFilePrefix,
} from "../../utils/graph";
import { Logger } from "../../utils/logger";
import { getReferences } from "../../utils/vscodecmd/getReferences";
import { getSymbols } from "../../utils/vscodecmd/getSymbols";

export async function computeFileHierarchyForFile(
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

    if (!filterByPathFn(file, options?.filterByPath)) {
      return;
    }

    gb.addNode(
      "file",
      file.fsPath,
      stripFilePrefix(file, options?.stripFilePrefix),
      0,
      0
    );

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

    for (const symbol of symbols) {
      if (token.isCancellationRequested) {
        return;
      }
      const callgraphSymbol = gb.addSymbol(symbol, file);

      let references;
      try {
        references = await getReferences(
          file,
          getPosition(symbol, file),
          token
        );
        if (!references) {
          logger.info(
            `No references found for ${symbol.name} in ${file.fsPath}`
          );
          continue;
        }
      } catch (error) {
        logger.info(
          `Error getting references for ${symbol.name} in ${file.fsPath}`
        );
        continue;
      }

      for (const reference of references) {
        if (token.isCancellationRequested) {
          return;
        }
        gb.addReference(reference, callgraphSymbol);

        // skip self-edges
        if (file.fsPath === reference.uri.fsPath) {
          continue;
        }

        // skip edges that don't pass the filter
        if (!filterByPathFn(reference.uri, options?.filterByPath)) {
          continue;
        }

        gb.addEdge(
          "file",
          reference.uri.fsPath,
          stripFilePrefix(reference.uri, options?.stripFilePrefix),
          0,
          0,
          "file",
          file.fsPath,
          stripFilePrefix(file, options?.stripFilePrefix),
          0,
          0
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
