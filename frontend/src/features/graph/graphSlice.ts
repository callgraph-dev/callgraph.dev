import { PayloadAction, createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import {
  CgReference,
  CgSymbol,
  Edge,
  Graph,
  Node,
  SymbolsAndReferences,
} from "../../lib/graph";

type ScheduleGraphStatusTypes =
  | "Unknown"
  | "Done"
  | "Cloning"
  | "Indexing"
  | "Error"
  | "Started";

// Keep in sync with client/src/features/codeviewer/CodeViewer.tsx
export type Language = "python" | "javascript" | "typescript";

interface DepgraphState {
  nodes: { [key: string]: Node };
  edges: { [key: string]: Edge };
  expandedFolders: string[];
  language: Language | null;
  symbols: { [key: string]: CgSymbol };
  references: { [key: string]: CgReference };
  status: "initial" | "idle" | "loading" | "failed";
  scheduleGraphStatus: ScheduleGraphStatusTypes;
  statusKey: string | null;
}

const initialState: DepgraphState = {
  nodes: {},
  edges: {},
  expandedFolders: [],
  language: null,
  symbols: {},
  references: {},
  status: "initial",
  scheduleGraphStatus: "Unknown",
  statusKey: null,
};

interface CheckGraphStatusResponse {
  status: ScheduleGraphStatusTypes;
  graph: Graph | null;
  language: string | null;
  // Folder clicked from vscode right-click context menu
  selectedFolder: string | null;
  symbolsAndReferences: SymbolsAndReferences | null;
}

export const checkGraphStatus = createAsyncThunk(
  "depgraph/checkGraphStatus",
  async (
    statusKey: string,
    // { dispatch },
  ): Promise<CheckGraphStatusResponse> => {
    // @ts-expect-error - injected by esbuild
    const serverUrl = process.env.SERVER_URL;
    const response = await fetch(`${serverUrl}/api/v1/depgraph/status/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ statusKey }),
    });
    const data: CheckGraphStatusResponse = await response.json();
    // if (data.status === "Done" && data.graph != null) {
    //   const graph = data.graph;
    //   dispatch(initializeCytoscape({ nodes: graph.nodes, edges: graph.edges }));
    // }
    return data;
  },
);

interface ScheduleGraphResponse {
  statusKey: string;
  language: Language;
}

export const scheduleGraph = createAsyncThunk(
  "depgraph/scheduleGraph",
  async (url: string): Promise<ScheduleGraphResponse> => {
    // @ts-expect-error - injected by esbuild
    const serverUrl = process.env.SERVER_URL;
    const response = await fetch(`${serverUrl}/api/v1/depgraph/schedule/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url }),
    });
    const data: ScheduleGraphResponse = await response.json();
    return data;
  },
);

const depgraphSlice = createSlice({
  name: "depgraph",
  initialState,
  reducers: {
    filterNodesByText: (state, action) => {
      const regex = new RegExp(action.payload);
      // @ts-expect-error - injected by us
      const cy = window.cy;
      const filteredNodes = cy.nodes().filter((node) => regex.test(node.id()));
      const filteredEdges = filteredNodes.connectedEdges();
      const keep = filteredNodes.union(filteredEdges).show();
      cy.elements().not(keep).remove();
      cy.layout({ name: "dagre" }).run();
    },
    redrawGraph: () => {
      // @ts-expect-error - injected by
      const cy = window.cy;
      cy.layout({ name: "dagre" }).run();
    },
    setGraphLanguage: (state, action: PayloadAction<Language>) => {
      state.language = action.payload;
    },
    addExpandedFolders: (state, action: PayloadAction<string[]>) => {
      state.expandedFolders = [
        ...new Set([...state.expandedFolders, ...action.payload]),
      ];
      state.expandedFolders.sort((a, b) => b.length - a.length);
    },
    removeExpandedFolders: (state, action: PayloadAction<string[]>) => {
      state.expandedFolders = state.expandedFolders.filter(
        (folder) => !action.payload.some((p) => folder.startsWith(p)),
      );
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(scheduleGraph.pending, (state) => {
        state.status = "loading";
        state.statusKey = null;
      })
      .addCase(scheduleGraph.rejected, (state) => {
        state.status = "failed";
        state.statusKey = null;
      })
      .addCase(
        scheduleGraph.fulfilled,
        (state, action: PayloadAction<ScheduleGraphResponse>) => {
          const payload = action.payload;
          // not a typo, the graph is still loading.
          state.status = "loading";
          state.statusKey = payload.statusKey;
          if (payload.language !== null) {
            state.language = payload.language;
          }
        },
      )
      .addCase(
        checkGraphStatus.fulfilled,
        (state, action: PayloadAction<CheckGraphStatusResponse>) => {
          const payload = action.payload;
          if (payload.status === "Done") {
            state.status = "idle";
            state.statusKey = null;
          }
          if (payload.status === "Error") {
            state.status = "failed";
            state.statusKey = null;
          }
          if (payload.graph !== null) {
            const graph = payload.graph;
            state.nodes = Object.fromEntries(
              graph.nodes.map((node) => [node.id, node]),
            );
            state.edges = Object.fromEntries(
              graph.edges.map((edge) => [edge.source + edge.target, edge]),
            );
          }
          if (payload.selectedFolder !== null) {
            state.expandedFolders.push(payload.selectedFolder);
            state.expandedFolders.sort((a, b) => b.length - a.length);
          }
          if (payload.symbolsAndReferences !== null) {
            state.symbols = Object.fromEntries(
              payload.symbolsAndReferences.symbols.map((symbol) => [
                symbol.id,
                symbol,
              ]),
            );
            state.references = Object.fromEntries(
              payload.symbolsAndReferences.references.map((reference) => [
                reference.id,
                reference,
              ]),
            );
          }
        },
        // NB: state.cmdpal.loadingBarState gets modified on this actions.
        // NB: state.fileexplorer.loadingBarState  modified on this actions.
      );
  },
});

// Action creators are generated for each case reducer function
export const {
  filterNodesByText,
  redrawGraph,
  setGraphLanguage,
  addExpandedFolders,
  removeExpandedFolders,
} = depgraphSlice.actions;

export default depgraphSlice.reducer;
