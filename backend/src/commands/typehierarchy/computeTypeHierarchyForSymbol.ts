import * as vscode from "vscode";
import { GraphBuilder, filterByPathFn } from "../../utils/graph";
import { Logger } from "../../utils/logger";
import { getPrepareTypeHierarchy } from "../../utils/vscodecmd/getPrepareTypeHierarchy";
import { getSubtypes } from "../../utils/vscodecmd/getSubtypes";
import { getSupertypes } from "../../utils/vscodecmd/getSupertypes";

export async function computeTypeHierarchyFromSymbol(
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
      `computeTypeHierarchyFromSymbol: ${file.fsPath}:${position.line}:${position.character}`
    );

    await _recursivelyComputeSupertypesForSymbol(
      progress,
      logger,
      gb,
      file,
      position,
      token,
      options
    );
    await _recursivelyComputeSubtypesForSymbol(
      progress,
      logger,
      gb,
      file,
      position,
      token,
      options
    );
    return;
  } finally {
    console.timeEnd(
      `computeTypeHierarchyFromSymbol: ${file.fsPath}:${position.line}:${position.character}`
    );
  }
}

async function _recursivelyComputeSubtypesForSymbol(
  progress: vscode.Progress<{ message?: string; increment?: number }>,
  logger: Logger,
  gb: GraphBuilder,
  file: vscode.Uri,
  position: vscode.Position,
  token: vscode.CancellationToken,
  options?: {
    filterByPath?: vscode.Uri;
  }
): Promise<void> {
  if (token.isCancellationRequested) {
    return;
  }

  // get name of symbol at `file:position`
  let typeHierarchyItems;
  try {
    typeHierarchyItems = await getPrepareTypeHierarchy(file, position, token);
    if (!typeHierarchyItems || typeHierarchyItems.length === 0) {
      logger.info(`No type hierarchy found for ${file}:${position}`);
      return;
    }
  } catch (error) {
    logger.error(`Error getting type hierarchy in ${file}:${position}`);
    return;
  }

  // define nodes
  if (typeHierarchyItems.length > 1) {
    logger.info(
      `Multiple type hierarchy items found for ${file}:${position}. Just using the first one.`
    );
  }
  const node = typeHierarchyItems[0];
  progress.report({ message: node.name });

  // calculate subtypes
  let subtypes;
  try {
    subtypes = await getSubtypes(file, position, token);
    if (!subtypes) {
      logger.info(`No subtypes found for ${node.name} at ${file}:${position}.`);
    }
  } catch (error) {
    logger.error(
      `Error getting subtypes for ${node.name} at ${file}:${position}.`
    );
    return;
  }

  // construct subtype graph (all inbound edges)
  for (const subtype of subtypes || []) {
    if (token.isCancellationRequested) {
      return;
    }

    // skip edges that don't pass the filter
    if (!filterByPathFn(subtype.uri, options?.filterByPath)) {
      continue;
    }
    gb.addEdge(
      "symbol",
      subtype.uri.fsPath,
      subtype.name,
      subtype.selectionRange.start.line,
      subtype.selectionRange.start.character,
      "symbol",
      node.uri.fsPath,
      node.name,
      node.selectionRange.start.line,
      node.selectionRange.start.character
    );
    await _recursivelyComputeSubtypesForSymbol(
      progress,
      logger,
      gb,
      subtype.uri,
      subtype.selectionRange.start,
      token,
      options
    );
  }

  return;
}

async function _recursivelyComputeSupertypesForSymbol(
  progress: vscode.Progress<{ message?: string; increment?: number }>,
  logger: Logger,
  gb: GraphBuilder,
  file: vscode.Uri,
  position: vscode.Position,
  token: vscode.CancellationToken,
  options?: {
    filterByPath?: vscode.Uri;
  }
): Promise<void> {
  if (token.isCancellationRequested) {
    return;
  }

  // get name of symbol at `file:position`
  let typeHierarchyItems;
  try {
    typeHierarchyItems = await getPrepareTypeHierarchy(file, position, token);
    if (!typeHierarchyItems || typeHierarchyItems.length === 0) {
      logger.info(`No type hierarchy found for ${file}:${position}`);
      return;
    }
  } catch (error) {
    logger.error(`Error getting type hierarchy in ${file}:${position}`);
    return;
  }

  // define nodes
  if (typeHierarchyItems.length > 1) {
    logger.info(
      `Multiple type hierarchy items found for ${file}. Just using the first one.`
    );
  }
  const node = typeHierarchyItems[0];
  progress.report({ message: node.name });

  // calculate supertypes
  let supertypes;
  try {
    supertypes = await getSupertypes(file, position, token);
    if (!supertypes) {
      logger.info(
        `No supertypes found for ${node.name} at ${file}:${position}.`
      );
    }
  } catch (error) {
    logger.error(
      `Error getting subtypes for ${node.name} at ${file}:${position}.`
    );
    return;
  }

  // construct supertype graph (all outbound edges)
  for (const supertype of supertypes || []) {
    if (token.isCancellationRequested) {
      return;
    }

    // skip edges that don't pass the filter
    if (!filterByPathFn(supertype.uri, options?.filterByPath)) {
      continue;
    }

    gb.addEdge(
      "symbol",
      node.uri.fsPath,
      node.name,
      node.selectionRange.start.line,
      node.selectionRange.start.character,
      "symbol",
      supertype.uri.fsPath,
      supertype.name,
      supertype.selectionRange.start.line,
      supertype.selectionRange.start.character
    );
    await _recursivelyComputeSupertypesForSymbol(
      progress,
      logger,
      gb,
      supertype.uri,
      supertype.selectionRange.start,
      token,
      options
    );
  }

  return;
}
