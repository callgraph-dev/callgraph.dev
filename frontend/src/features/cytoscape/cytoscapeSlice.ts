import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import cytoscape, { NodeSingular, Singular } from "cytoscape";
// @ts-expect-error: Missing typedefinitions
import dagre from "cytoscape-dagre";

import getHeightAndWidth from "../../lib/getHeightAndWidth";
import { Edge, Node, Snippet } from "../../lib/graph";
import { isMetaOrCtrl } from "../../lib/isMetaOrCtrl";
import { AppDispatch, RootState } from "../../store";
import { setLoadingBarWidth } from "../cmdpal/cmdpalSlice";
import {
  hideContextMenu,
  showContextMenu,
} from "../contextmenu/contextMenuSlice";
import {
  internalSetPreselected,
  internalSetSelected,
  scrollFileIntoView,
} from "../fileexplorer/fileexplorerSlice";
import {
  addExpandedFolders,
  hideNode,
  removeExpandedFolders,
} from "../graph/graphSlice";
import { hideTooltip, showTooltip } from "../tooltip/tooltipSlice";
import { sendVSCodeMessage } from "../vscodeext/vscodeExtSlice";

export interface CytoscapeState {}

const initialState: CytoscapeState = {};

export const initializeCytoscape = createAsyncThunk(
  "cytoscape/initialize",
  async (
    payload: { nodes: Node[]; edges: Edge[]; expandedFolders: string[] },
    { dispatch },
  ) => {
    const { nodes, edges, expandedFolders } = payload;
    initCytoscape(nodes, edges, expandedFolders, dispatch as AppDispatch);
  },
);

export const cytoscapeTapStart = createAsyncThunk(
  "cytoscape/tapstart",
  async (
    payload: {
      targetIsCore: boolean;
      id?: string;
    },
    { dispatch },
  ) => {
    if (!document.hasFocus()) {
      dispatch(sendVSCodeMessage({ command: "focusWebview", cmdargs: {} }));
    }

    dispatch(hideContextMenu());
  },
);

export const cytoscapeTap = createAsyncThunk(
  "cytoscape/tap",
  async (
    payload: {
      targetIsCore: boolean;
      id?: string;
    },
    { dispatch, getState },
  ) => {
    const state = getState() as RootState;
    // @ts-expect-error - cy is a global variable
    const cy: cytoscape.Core = window.cy;

    cy.elements().selectify().unselect().unselectify();
    cy.elements().removeClass("neighbor-selected");
    cy.elements().removeClass("not-selected");

    if (payload.targetIsCore) {
      dispatch(internalSetSelected(null));
      return;
    }

    if (payload.id === undefined) {
      return;
    }

    const target: Singular = cy.$id(payload.id);
    target.selectify().select().unselectify();
    if (target.isNode()) {
      target.openNeighborhood().addClass("neighbor-selected");
      cy.elements().not(target.closedNeighborhood()).addClass("not-selected");
    }
    if (target.isNode()) {
      dispatch(scrollFileIntoView(payload.id));
      dispatch(internalSetPreselected(payload.id));
      dispatch(internalSetSelected(payload.id));
    }
    if (target.isEdge()) {
      dispatch(internalSetSelected(null));
    }

    if (isMetaOrCtrl(state) && target.isNode()) {
      dispatch(
        sendVSCodeMessage({
          command: "openFile",
          cmdargs: {
            filepath: target.data("filepath"),
            lineno: target.data("lineno"),
            colno: target.data("colno"),
          },
        }),
      );
    }
  },
);

const cytoscapeMouseover = createAsyncThunk(
  "cytoscape/mouseover",
  async (payload: { targetIsCore: boolean; id?: string }, { dispatch }) => {
    if (payload.targetIsCore) {
      return;
    }
    if (payload.id === undefined) {
      return;
    }

    // @ts-expect-error - cy is a global variable
    const cy: cytoscape.Core = window.cy;
    const target: Singular = cy.$id(payload.id);
    target.addClass("hover");
    if (target.isEdge()) {
      const snippets = target.data("snippets") as Snippet[];
      dispatch(
        showTooltip({
          type: "codeviewer",
          contents: snippets,
        }),
      );
    }
  },
);

const cytoscapeMouseout = createAsyncThunk(
  "cytoscape/mouseout",
  async (payload: { targetIsCore: boolean; id?: string }, { dispatch }) => {
    if (payload.targetIsCore) {
      return;
    }
    if (payload.id === undefined) {
      return;
    }

    // @ts-expect-error - cy is a global variable
    const cy: cytoscape.Core = window.cy;
    const target: Singular = cy.$id(payload.id);
    target.removeClass("hover");
    if (target.isEdge()) {
      dispatch(hideTooltip());
    }
  },
);

const cytoscapeCxtTapStart = createAsyncThunk(
  "cytoscape/cxttapstart",
  async (
    payload: { x: number; y: number; targetIsCore: boolean; id?: string },
    { dispatch },
  ) => {
    if (payload.targetIsCore) {
      dispatch(
        showContextMenu({
          position: { x: payload.x, y: payload.y },
          targetType: "core",
          isFolder: false,
        }),
      );
      return;
    }
    if (payload.id === undefined) {
      return;
    }

    // @ts-expect-error - cy is a global variable
    const cy: cytoscape.Core = window.cy;
    const target: Singular = cy.$id(payload.id);
    if (target.isNode()) {
      target.addClass("context-selected");
      dispatch(
        showContextMenu({
          position: { x: payload.x, y: payload.y },
          targetType: "node",
          isFolder: target.data("type") === "folder",
        }),
      );
    }
  },
);

export const cytoscapeCenter = createAsyncThunk(
  "cytoscape/center",
  async (payload: string) => {
    // @ts-expect-error - cy is a global variable
    const cy: cytoscape.Core = window.cy;
    const node: Singular = cy.$id(payload);
    // 0.8 is a magic number that seems to work well
    cy.zoom(0.8);
    cy.center(node);
  },
);

export const cytoscapeDraw = createAsyncThunk(
  "cytoscape/draw",
  async (payload: { nodes: Node[]; edges: Edge[] }) => {
    // @ts-expect-error - cy is a global variable
    const cy: cytoscape.Core = window.cy;

    cy.batch(() => {
      cy.elements().remove();
      cy.add(payload.nodes.map((n) => ({ data: n })));
      cy.add(payload.edges.map((e) => ({ data: e })));
    });
    cy.layout({ name: "dagre" }).run();
  },
);

export const cytoscapeRedraw = createAsyncThunk(
  "cytoscape/redraw",
  async (_payload: void) => {
    // @ts-expect-error - cy is a global variable
    const cy: cytoscape.Core = window.cy;
    cy.layout({ name: "dagre" }).run();
  },
);

export const cytoscapeHideNode = createAsyncThunk(
  "cytoscape/hideNode",
  async (_payload: void, { dispatch }) => {
    // @ts-expect-error - cy is a global variable
    const cy: cytoscape.Core = window.cy;
    const nodes = cy.$("node.context-selected");
    nodes.removeClass("context-selected");
    dispatch(hideNode(nodes.data("id")));
  },
);

export const cytoscapeExpandFolder = createAsyncThunk(
  "cytoscape/expandFolder",
  async (_payload: void, { dispatch }) => {
    // @ts-expect-error - cy is a global variable
    const cy: cytoscape.Core = window.cy;
    const nodes = cy.$("node.context-selected");
    nodes.removeClass("context-selected");

    // Preferably, we'd wait for this state to change and redraw the graph.
    // But that adds too much indirection. Instead, we manually concat the
    // new expanded folder to the existing state.
    dispatch(addExpandedFolders([nodes.data("displayName")]));
    console.log("expand folder called");
  },
);

export const cytoscapeExpandAllFolders = createAsyncThunk(
  "cytoscape/expandAllFolders",
  async (_payload: void, { dispatch, getState }) => {
    const state = getState() as RootState;
    const nodes = Object.values(state.graph.nodes);
    const folders = nodes.map((n) => getFolderName(n.displayName));
    dispatch(addExpandedFolders(folders));
  },
);

//cytoscapeCollapseAllFolders
export const cytoscapeCollapseAllFolders = createAsyncThunk(
  "cytoscape/collapseAllFolders",
  async (_payload: void, { dispatch, getState }) => {
    const state = getState() as RootState;
    const expandedFolders = state.graph.expandedFolders;
    dispatch(removeExpandedFolders(expandedFolders));
  },
);

export const cytoscapeCollapseFolder = createAsyncThunk(
  "cytoscape/collapseFolder",
  async (_payload: void, { dispatch }) => {
    // @ts-expect-error - cy is a global variable
    const cy: cytoscape.Core = window.cy;
    const nodes = cy.$("node.context-selected");
    nodes.removeClass("context-selected");

    // Preferably, we'd wait for this state to change and redraw the graph.
    // But that adds too much indirection. Instead, we manually concat the
    // new expanded folder to the existing state.
    const folderName = getFolderName(nodes.data("displayName"));
    dispatch(removeExpandedFolders([folderName]));
  },
);

function getFolderName(fileOrFolder: string): string {
  const withoutTrailingSlash = fileOrFolder.endsWith("/")
    ? fileOrFolder.slice(0, -1)
    : fileOrFolder;
  const parts = withoutTrailingSlash.split("/");
  if (parts.length === 1) {
    return fileOrFolder;
  }
  const folderName = parts.slice(0, -1).join("/");
  return `${folderName}/`;
}

// cytoscapeSummarizeAPI
export const cytoscapeSummarizeAPI = createAsyncThunk(
  "cytoscape/summarizeAPI",
  async (_payload: void, { getState }) => {
    // @ts-expect-error - cy is a global variable
    const cy: cytoscape.Core = window.cy;
    const nodes = cy.$("node.context-selected");
    nodes.removeClass("context-selected");

    interface SummaryAPI {
      [symbolName: string]: number;
    }

    const summaryAPI: SummaryAPI = {};

    const state = getState() as RootState;
    const symbols = new Set(
      Object.values(state.graph.symbols)
        .filter((symbol) => symbol.filepath.startsWith(nodes.data("filepath")))
        .map((symbol) => symbol.id),
    );
    for (const reference of Object.values(state.graph.references)) {
      const symbol = state.graph.symbols[reference.symbolId];
      if (symbols.has(symbol.id)) {
        if (reference.symbolId in summaryAPI) {
          summaryAPI[symbol.name] += 1;
        } else {
          summaryAPI[symbol.name] = 1;
        }
      }
    }
    console.log("summaryAPI", summaryAPI);
  },
);

// When node.type === 'file', we rollup all folders.
function rollupFolders(
  nodes: Node[],
  edges: Edge[],
  expandedFolders: string[],
): [Node[], Edge[]] {
  if (nodes.length === 0) {
    return [nodes, edges];
  }

  if (nodes[0].type !== "file") {
    return [nodes, edges];
  }

  const nodeById = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const nodeByKey: Map<string, Node> = new Map();
  const edgeByKey: Map<string, Edge> = new Map();

  function rollupDisplayName(name: string, expandedFolders: string[]) {
    for (const folder of expandedFolders) {
      if (name.startsWith(folder)) {
        // remove trailing '/' from folder if exists
        const folderName = folder.endsWith("/") ? folder.slice(0, -1) : folder;
        const numParts = folderName.split("/").length;
        return name
          .split("/")
          .slice(0, numParts + 1)
          .join("/");
      }
    }
    return name.split("/").slice(0, 2).join("/");
  }

  function rollupNode(node: Node): Node {
    const newDisplayName = rollupDisplayName(node.displayName, expandedFolders);
    const key = newDisplayName;
    if (nodeByKey.has(key)) {
      return nodeByKey.get(key)!;
    }

    const isFolder = node.displayName !== newDisplayName;

    const newNode: Node = {
      ...node,
      key: key,
      displayName: isFolder ? newDisplayName + "/" : newDisplayName,
      type: isFolder ? "folder" : node.type,
    };
    nodeByKey.set(key, newNode);
    return newNode;
  }

  const newNodes = nodes.map(rollupNode);

  function rollupEdge(edge: Edge): Edge {
    const sourceNode = rollupNode(nodeById[edge.source]);
    const targetNode = rollupNode(nodeById[edge.target]);
    const key = `${sourceNode.key} -> ${targetNode.key}`;
    if (edgeByKey.has(key)) {
      const newEdge = edgeByKey.get(key)!;
      newEdge.weight += 1;
      edgeByKey.set(key, newEdge);
      return newEdge;
    }
    if (sourceNode === undefined || targetNode === undefined) {
      throw new Error("source or target node not found");
    }
    const newEdge = {
      ...edge,
      key: key,
      source: sourceNode.id,
      target: targetNode.id,
    };
    edgeByKey.set(key, newEdge);
    return newEdge;
  }

  const newEdges = edges.map(rollupEdge);
  console.log("newNodes", newNodes);
  console.log("newEdges", newEdges);
  return [newNodes, newEdges];
}

function initCytoscape(
  rawNodes: Node[],
  rawEdges: Edge[],
  expandedFolders: string[],
  dispatch: AppDispatch,
) {
  cytoscape.use(dagre);

  const [nodes, edges] = rollupFolders(rawNodes, rawEdges, expandedFolders);

  const cy = cytoscape({
    container: document.getElementById("cy"),

    // boxSelectionEnabled: false,
    // autounselectify: true,

    layout: {
      name: "dagre",
      ready: function () {
        dispatch(setLoadingBarWidth("w-5/6"));
      },
      stop: function () {
        dispatch(setLoadingBarWidth("w-full"));
      },
    },

    style: [
      {
        selector: "node",
        style: {
          shape: "round-rectangle",
          content: "data(displayName)",
          label: "data(displayName)",
          width: (node: NodeSingular) => getHeightAndWidth(node).width,
          height: (node) => getHeightAndWidth(node).height,
          "border-style": (node) =>
            node.data("type") === "folder" ? "dashed" : "solid",
          "border-color": "#11479e",
          "border-width": "2px",
          "background-color": (node) =>
            node.data("type") === "folder" ? "#f4f4f4" : "#fff",
          "text-opacity": 0.7,
          "text-valign": "center",
          "text-halign": "center",
          "text-wrap": "wrap", // Enable text wrapping
          "text-max-width": "80px", // Adjust maximum text width to ensure text wraps within the box
          "padding-top": "10px",
          "padding-left": "10px",
          "font-size": "14px",
        },
      },
      {
        selector: "node:selected",
        style: {
          "border-color": "#cc7a00",
          "border-width": "5px",
          "text-opacity": 1,
        },
      },
      {
        selector: "node.hover",
        style: {
          "background-opacity": 0.7,
          "border-opacity": 0.7,
        },
      },
      {
        selector: "node.neighbor-selected",
        style: {
          "border-color": "#cc7a00",
        },
      },
      {
        selector: "node.not-selected",
        style: {
          opacity: 0.2,
        },
      },
      {
        selector: "node.hidden",
        style: {
          display: "none",
        },
      },
      {
        selector: "node.context-selected",
        style: {},
      },
      {
        selector: "edge",
        style: {
          "curve-style": "bezier",
          width: 4,
          "target-arrow-shape": "triangle",
          "line-color": "#9dbaea",
          "target-arrow-color": "#9dbaea",
          opacity: 0.2,
        },
      },
      {
        selector: "edge:selected",
        style: {
          "line-color": "#cc7a00",
          "target-arrow-color": "#cc7a00",
          opacity: 0.2,
        },
      },
      {
        selector: "edge.hover",
        style: {
          opacity: 0.8,
        },
      },
      {
        selector: "edge.neighbor-selected",
        style: {
          "line-color": "#cc7a00",
          "target-arrow-color": "#cc7a00",
        },
      },
      {
        selector: "edge.not-selected",
        style: {
          "line-opacity": 0.2,
        },
      },
      {
        selector: "edge.hidden",
        style: {
          display: "none",
        },
      },
    ],

    elements: {
      nodes: nodes.map((n) => {
        return { data: n };
      }),
      edges: edges.map((e) => {
        return { data: e };
      }),
    },
  });
  // @ts-expect-error - cy is a global variable
  window.cy = cy;

  cy.nodes()
    .filter((node) => node.data("hidden") === true)
    .addClass("hidden");

  cy.on("tapstart", function (evt) {
    dispatch(
      cytoscapeTapStart({
        targetIsCore: evt.target === cy,
        id: evt.target?.id && evt.target.id(),
      }),
    );
  });

  cy.on("tap", function (evt) {
    dispatch(
      cytoscapeTap({
        targetIsCore: evt.target === cy,
        id: evt.target?.id && evt.target.id(),
      }),
    );
  });

  cy.on("mouseover", function (evt) {
    dispatch(
      cytoscapeMouseover({
        targetIsCore: evt.target === cy,
        id: evt.target?.id && evt.target.id(),
      }),
    );
  });

  cy.on("mouseout", function (evt) {
    dispatch(
      cytoscapeMouseout({
        targetIsCore: evt.target === cy,
        id: evt.target?.id && evt.target.id(),
      }),
    );
  });

  cy.on("cxttapstart", function (evt) {
    dispatch(
      cytoscapeCxtTapStart({
        x: evt.renderedPosition.x,
        y: evt.renderedPosition.y,
        targetIsCore: evt.target === cy,
        id: evt.target?.id && evt.target.id(),
      }),
    );
  });

  // return cy;
}

export const cytoscapeSlice = createSlice({
  name: "cytoscape",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder;
    // .addCase(initializeCytoscape.fulfilled, (state, action) => {})
    // .addCase(initializeCytoscape.pending, (state, action) => {})
    // .addCase(initializeCytoscape.rejected, (state, action) => {});
  },
});

// Action creators are generated for each case reducer function
// export const {} = cytoscapeSlice.actions;

export default cytoscapeSlice.reducer;
