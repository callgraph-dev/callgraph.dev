import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import { Graph, SymbolsAndReferences } from "../../shared/graph";
import { Language } from "../../shared/types";
import { AppDispatch, RootState } from "../../store";
import { checkGraphStatus, setGraphLanguage } from "../graph/graphSlice";

interface VsCodeApi {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  postMessage(message: any): void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getState<T = any>(): T;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setState<T = any>(state: T): void;
}

let vscode: VsCodeApi;
// @ts-expect-error - injected by vscode webview
if (window.acquireVsCodeApi) {
  // @ts-expect-error - injected by vscode webview
  vscode = acquireVsCodeApi();
}

const VscodeExt: React.FC = () => {
  const dispatch: AppDispatch = useDispatch(); // Add this line to get the dispatch function

  // This is a top-level component and should only re-render when the tab lost focus.
  useEffect(() => {
    const handleMessageFn = handleMessageFromVscodeWithDispatch(dispatch);
    window.addEventListener("message", handleMessageFn);
    return () => window.removeEventListener("message", handleMessageFn);
  });

  // This is a top-level component and should only re-render when the tab lost focus.
  useEffect(() => {
    const state = vscode.getState();
    if (state && "graph" in state) {
      dispatch({
        type: checkGraphStatus.fulfilled.type,
        payload: {
          statusKey: "Done",
          language: null,
          graph: state.graph,
        },
      });
    }
  });

  return <VscodeExtSendMessage />;
};

// This component subscribes to the store and is expected to re-render.
export const VscodeExtSendMessage: React.FC = () => {
  const command = useSelector((state: RootState) => state.vscodeext.command);
  const cmdargs = useSelector((state: RootState) => state.vscodeext.cmdargs);

  useEffect(() => {
    if (!command) return;
    console.debug(`sending message from client -> vscode`, command, cmdargs);
    vscode.postMessage({ command, cmdargs });
  }, [command, cmdargs]);

  return <></>;
};

export default VscodeExt;

const handleMessageFromVscodeWithDispatch =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (dispatch: AppDispatch) => (event: any) => {
    console.debug(
      "Recieved message from vscode -> client: ",
      event,
      event?.data,
    );
    const message = event.data;

    // Keep in sync with vscodeext/callgraph-dev/src/commands/drawCallgraphForFolder.ts
    if (message.command === "drawGraph") {
      const graph = message.payload.graph as Graph;
      const selectedFolder = message.payload.selectedFolder as string | null;
      const symbolsAndReferences = message.payload
        .symbolsAndReferences as SymbolsAndReferences | null;

      console.debug("Got graph", graph);
      dispatch({
        type: checkGraphStatus.fulfilled.type,
        payload: {
          statusKey: "Done",
          language: null,
          graph: graph,
          selectedFolder,
          symbolsAndReferences,
        },
      });
      vscode.setState({ graph });
    } else if (message.command === "setLanguage") {
      dispatch(setGraphLanguage(message.payload.language as Language));
    }
  };
