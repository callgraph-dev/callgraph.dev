import * as vscode from "vscode";

export class Logger {
  private outputChannel: vscode.OutputChannel;

  constructor(outputChannel: vscode.OutputChannel) {
    this.outputChannel = outputChannel;
  }

  private log(level: string, message: string) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
    this.outputChannel.appendLine(
      `[${timestamp}] [${level.toUpperCase()}] ${message}`
    );
  }

  public info(message: string) {
    this.log("info", message);
  }

  public warn(message: string) {
    this.log("warn", message);
  }

  public error(message: string) {
    this.log("error", message);
  }
}
