import * as vscode from "vscode";

export async function getFileLanguage(
  uri: vscode.Uri
): Promise<string | undefined> {
  try {
    console.time("getFileLanguage");
    const document = await vscode.workspace.openTextDocument(uri);
    return document.languageId;
  } catch (error) {
    console.error(JSON.stringify(error));
  } finally { console.timeEnd("getFileLanguage"); }
}
