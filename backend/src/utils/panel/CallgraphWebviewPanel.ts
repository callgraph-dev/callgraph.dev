import * as vscode from "vscode";
import { getNonce } from "../getNonce";
import { Logger } from "../logger";
import { globals } from "../globals";

/**
 * Manages a singleton, serializable webview panel.
 *
 * Access the instance via CallgraphWebviewPanel.currentPanel
 */
export class CallgraphWebviewPanel {
  /**

   * Track the currently panel. Only allow a single panel to exist at a time.
   * TODO: Should be one panel for folder/file view.
   */
  public static currentPanel: CallgraphWebviewPanel | undefined;
  public static viewType = "callgraphWebview";

  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];

  public static createOrShow(
    extensionUri: vscode.Uri,
    logger: Logger,
    options?: {
      column?: vscode.ViewColumn;
    }
  ) {
    logger.info("CallgraphWebviewPanel.createOrShow");
    const activeColumn = vscode.window.activeTextEditor?.viewColumn;

    // If we already have a panel, skip creation.
    if (CallgraphWebviewPanel.currentPanel) {
      CallgraphWebviewPanel.currentPanel.reveal();
      return;
    }

    // Otherwise, create a new panel.
    const panel = vscode.window.createWebviewPanel(
      CallgraphWebviewPanel.viewType,
      "callgraph.dev: Draw callgraph",
      options?.column ?? activeColumn ?? vscode.ViewColumn.One,
      {
        retainContextWhenHidden: true, // Keep tab open (cannot easily deserialize graph state)
        enableScripts: true, // Enable javascript in the webview
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, "media")], // Restrict the webview to only loading content from our extension's `media` directory.
      }
    );

    CallgraphWebviewPanel.currentPanel = new CallgraphWebviewPanel(
      panel,
      extensionUri,
      logger
    );
  }

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    logger: Logger
  ) {
    this._panel = panel;
    this._extensionUri = extensionUri;

    // Set the webview's initial html content
    // this._update();
    this._panel.webview.html = this._getHtmlForWebview();

    // Listen for when the panel is disposed
    // This happens when the user closes the panel or when the panel is closed programmatically
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // Handle messages from the webview
    this._panel.webview.onDidReceiveMessage(
      handleOnDidReceiveMessage,
      null,
      this._disposables
    );
  }

  public viewColumn(): vscode.ViewColumn | undefined {
    return this._panel.viewColumn;
  }

  public postMessage(message: any) {
    this._panel.webview.postMessage(message);
  }

  public doRefactor() {
    // Send a message to the webview webview.
    // You can send any JSON serializable data.
    this._panel.webview.postMessage({ command: "refactor" });
  }

  public dispose() {
    CallgraphWebviewPanel.currentPanel = undefined;

    // Clean up our resources
    this._panel.dispose();

    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }

    if (globals.ACTIVE_FILE_LISTENER) {
      globals.ACTIVE_FILE_LISTENER.dispose();
    }
  }

  public reveal() {
    this._panel.reveal();
  }

  private _getHtmlForWebview() {
    const webview = this._panel.webview;
    // Local path to css styles
    const tailwindCssPath = vscode.Uri.joinPath(
      this._extensionUri,
      "media",
      "tailwind.css"
    );
    const reactBundleCssPath = vscode.Uri.joinPath(
      this._extensionUri,
      "media",
      "react-vscode-bundle.css"
    );
    const reactBundleJsPath = vscode.Uri.joinPath(
      this._extensionUri,
      "media",
      "react-vscode-bundle.js"
    );

    // Uri to load styles into webview
    const tailwindCssUri = webview.asWebviewUri(tailwindCssPath);
    const reactBundleCssUri = webview.asWebviewUri(reactBundleCssPath);
    const reactBundleJsUri = webview.asWebviewUri(reactBundleJsPath);

    // Use a nonce to only allow specific scripts to be run
    const nonce = getNonce();

    return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">

				<!--
					Use a content security policy to only allow loading images from https or from our extension directory,
					and only allow scripts that have a specific nonce.
        -->
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; img-src ${webview.cspSource} https:; script-src 'nonce-${nonce}';">

				<meta name="viewport" content="width=device-width, initial-scale=1.0">

        <link href="${tailwindCssUri}" rel="stylesheet">
        <link href="${reactBundleCssUri}" rel="stylesheet">
        <script nonce="${nonce}" src="${reactBundleJsUri}" defer></script>

				<title>callgraph.dev</title>
			</head>
      <body class="font-helvetica text-base overflow-hidden">
        <div id="react-root"></div>
        <!-- Cypress below react root. For DOM siblings that visually overlap, that latter DOM element should capture events -->
        <div id="cy" class="size-full absolute left-0 top-0 bg-zinc-50 z-10"></div>
      </body>      
			</html>`;
  }
}

// Filter symbols for callables
function filterCallables(
  symbols: (vscode.SymbolInformation | vscode.DocumentSymbol)[] | undefined
) {
  return symbols?.filter(
    (symbol) =>
      symbol.kind === vscode.SymbolKind.Function ||
      symbol.kind === vscode.SymbolKind.Method ||
      symbol.kind === vscode.SymbolKind.Constructor
  );
}

async function handleOnDidReceiveMessage(message: any) {
  console.log("Received message from client: ", message);
  if (!message.command) {
    console.log("No 'command' in message: ", message);
    return;
  }

  switch (message.command) {
    case "alert":
      vscode.window.showErrorMessage(message.text);
      return;
    case "focusWebview":
      CallgraphWebviewPanel.currentPanel?.reveal();
      return;
    case "openFile":
      const { filepath, lineno, colno } = message.cmdargs;
      if (
        filepath === undefined ||
        lineno === undefined ||
        colno === undefined
      ) {
        console.error(
          "openFile message missing cmdargs (filepath, lineno, colno): ",
          message
        );
        return;
      }

      try {
        const panelColumn = CallgraphWebviewPanel.currentPanel?.viewColumn();
        let column: vscode.ViewColumn;
        if (panelColumn === vscode.ViewColumn.One) {
          column = vscode.ViewColumn.Two;
        } else if (panelColumn && panelColumn > 1) {
          column = (panelColumn - 1) as vscode.ViewColumn;
        } else {
          column = vscode.ViewColumn.Active;
        }
        const document = await vscode.workspace.openTextDocument(
          vscode.Uri.file(filepath)
        );
        const editor = await vscode.window.showTextDocument(document, column);
        const position = new vscode.Position(lineno, colno - 1); // err, may not want to do this -1 here (and write the correct position)
        const range = new vscode.Range(position, position);
        editor.selection = new vscode.Selection(position, position);
        editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
      } catch (error) {
        console.error(`Error when execution openFile for ${filepath}:`, error);
      }
      return;
    default:
      console.error("Unknown message command: ", message.command);
  }
}
