import * as vscode from "vscode";
import { GraphBuilder, filterByPathFn } from "../../utils/graph";
import { Logger } from "../../utils/logger";
import { getIncomingCalls } from "../../utils/vscodecmd/getIncomingCalls";
import { getOutgoingCalls } from "../../utils/vscodecmd/getOutgoingCalls";
import { prepareCallHierarchy } from "../../utils/vscodecmd/getPrepareCallHierarchy";

export async function computeCallgraphForSymbol(
  progress: vscode.Progress<{ message?: string; increment?: number }>,
  logger: Logger,
  file: vscode.Uri,
  position: vscode.Position,
  gb: GraphBuilder,
  token: vscode.CancellationToken,
  options?: {
    filterByPath?: vscode.Uri;
  }
): Promise<void> {
  try {
    console.time(
      `computeCallgraphForSymbol: ${file.fsPath}:${position.line}:${position.character}`
    );

    await _recursivelyComputeOutgoingCallsForSymbol(
      progress,
      logger,
      gb,
      file,
      position,
      new Set(),
      token,
      options
    );
    await _recursivelyComputeIncomingCallsForSymbol(
      progress,
      logger,
      gb,
      file,
      position,
      new Set(),
      token,
      options
    );
    return;
  } finally {
    console.timeEnd(
      `computeCallgraphForSymbol: ${file.fsPath}:${position.line}:${position.character}`
    );
  }
}

async function _recursivelyComputeIncomingCallsForSymbol(
  progress: vscode.Progress<{ message?: string; increment?: number }>,
  logger: Logger,
  gb: GraphBuilder,
  file: vscode.Uri,
  position: vscode.Position,
  visited: Set<string>,
  token: vscode.CancellationToken,
  options?: {
    filterByPath?: vscode.Uri;
  }
): Promise<void> {
  if (token.isCancellationRequested) {
    return;
  }

  // get name of symbol at `file:position`
  let callHierarchyItems;
  try {
    callHierarchyItems = await prepareCallHierarchy(file, position, token);
    if (!callHierarchyItems || callHierarchyItems.length === 0) {
      logger.info(`No call hierarchy found for ${file}:${position}`);
      return;
    }
  } catch (error) {
    logger.error(`Error getting call hierarchy in ${file}:${position}`);
    return;
  }

  // define nodes
  if (callHierarchyItems.length > 1) {
    logger.info(
      `Multiple call hierarchy items found for ${file}:${position}. Just using the first one.`
    );
  }
  const node = callHierarchyItems[0];
  progress.report({ message: node.name });
  visited.add(JSON.stringify({ file, position }));

  // calculate incoming calls
  let incomingCalls;
  try {
    incomingCalls = await getIncomingCalls(file, position, token);
    if (!incomingCalls) {
      logger.info(
        `No incoming calls found for ${node.name} at ${file}:${position}.`
      );
    }
  } catch (error) {
    logger.info(
      `Error getting incoming calls for ${node.name} at ${file}:${position}.`
    );
    return;
  }

  // construct subtype graph (all inbound edges)
  for (const incoming of incomingCalls || []) {
    if (token.isCancellationRequested) {
      return;
    }

    // skip edges that don't pass the filter
    if (!filterByPathFn(incoming.from.uri, options?.filterByPath)) {
      continue;
    }

    gb.addEdge(
      "symbol",
      incoming.from.uri.fsPath,
      incoming.from.name,
      incoming.from.range.start.line,
      incoming.from.range.start.character,
      "symbol",
      node.uri.fsPath,
      node.name,
      node.selectionRange.start.line,
      node.selectionRange.start.character
    );
    const file = incoming.from.uri;
    const position = incoming.from.selectionRange.start;

    // only recurse if we haven't seen the next node (handles recursive functions)
    if (!visited.has(JSON.stringify({ file, position }))) {
      await _recursivelyComputeIncomingCallsForSymbol(
        progress,
        logger,
        gb,
        file,
        position,
        visited,
        token,
        options
      );
    }
  }

  return;
}

async function _recursivelyComputeOutgoingCallsForSymbol(
  progress: vscode.Progress<{ message?: string; increment?: number }>,
  logger: Logger,
  gb: GraphBuilder,
  file: vscode.Uri,
  position: vscode.Position,
  visited: Set<string>,
  token: vscode.CancellationToken,
  options?: {
    filterByPath?: vscode.Uri;
  }
): Promise<void> {
  if (token.isCancellationRequested) {
    return;
  }

  // get name of symbol at `file:position`
  let callHierarchyItems;
  try {
    callHierarchyItems = await prepareCallHierarchy(file, position, token);
    if (!callHierarchyItems || callHierarchyItems.length === 0) {
      logger.info(`No type hierarchy found for ${file}:${position}`);
      return;
    }
  } catch (error) {
    logger.info(`Error getting type hierarchy in ${file}:${position}`);
    return;
  }

  // define nodes
  if (callHierarchyItems.length > 1) {
    logger.info(
      `Multiple type hierarchy items found for ${file}:${position}. Just using the first one.`
    );
  }
  const node = callHierarchyItems[0];
  progress.report({ message: node.name });
  visited.add(JSON.stringify({ file, position }));

  // calculate outgoing calls
  let outgoingCalls;
  try {
    outgoingCalls = await getOutgoingCalls(file, position, token);
    if (!outgoingCalls) {
      logger.info(
        `No outgoing calls found for ${node.name} at ${file}:${position}.`
      );
    }
  } catch (error) {
    logger.error(
      `Error getting outgoing calls for ${node.name} at ${file}:${position}.`
    );
    return;
  }

  // construct outgoing callgraph (all outbound edges)
  for (const outgoing of outgoingCalls || []) {
    if (token.isCancellationRequested) {
      return;
    }

    // skip edges that don't pass the filter
    if (!filterByPathFn(outgoing.to.uri, options?.filterByPath)) {
      continue;
    }

    gb.addEdge(
      "symbol",
      node.uri.fsPath,
      node.name,
      node.selectionRange.start.line,
      node.selectionRange.start.character,
      "symbol",
      outgoing.to.uri.fsPath,
      outgoing.to.name,
      outgoing.to.selectionRange.start.line,
      outgoing.to.selectionRange.start.character
    );
    const file = outgoing.to.uri;
    const position = outgoing.to.selectionRange.start;

    // only recurse if we haven't seen the next node (handles recursive functions)
    if (!visited.has(JSON.stringify({ file, position }))) {
      await _recursivelyComputeOutgoingCallsForSymbol(
        progress,
        logger,
        gb,
        file,
        position,
        visited,
        token,
        options
      );
    }
  }

  return;
}
