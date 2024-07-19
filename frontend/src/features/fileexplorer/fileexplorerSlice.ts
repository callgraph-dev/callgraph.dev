import type { PayloadAction } from "@reduxjs/toolkit";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { WritableDraft } from "immer";

import { Edge, Graph, Node } from "../../shared/graph";
import { RootState } from "../../store";
import { cytoscapeDraw, cytoscapeTap } from "../cytoscape/cytoscapeSlice";
import { checkGraphStatus, scheduleGraph } from "../graph/graphSlice";

export interface Directory {
  // Id is the full path of the directory
  id: string;
  name: string;
  directories: Record<string, Directory>;
  files: string[];
  depth: number;
}

// DirectoryState is extra information about a directory.
// Store this information outside of the rootDirectory. It changes more frequently.
export interface DirectoryState {
  isCollapsed: boolean;
}

export interface FileState {}

export interface FileexplorerState {
  // preselected is focused by arrow keys but not clicked
  preselected: string | null;
  selected: string | null;
  isolated: string | null;
  rootDirectory: Directory;
  directories: Record<string, DirectoryState>;
  files: Record<string, FileState>;
  status: "idle" | "loading" | "succeeded" | "failed";
}

const root = "root";

const initialState: FileexplorerState = {
  preselected: null,
  selected: null,
  isolated: null,
  rootDirectory: {
    id: root,
    name: root,
    directories: {},
    files: [],
    depth: 0,
  },
  directories: {
    root: {
      isCollapsed: false,
    },
  },
  files: {},
  status: "idle",
};

const isFile = (state: FileexplorerState, id: string): boolean => {
  return id in state.files;
};

export const selectFileOrDir = createAsyncThunk(
  "fileexplorer/selectFileOrDir",
  async (payload: string, { dispatch, getState }) => {
    const state = getState() as RootState;
    const filepath = payload;
    // Prefer mimic-ing 'tap' action if it was possible for this node.
    if (isFile(state.fileexplorer, filepath)) {
      dispatch(
        cytoscapeTap({
          targetIsCore: false,
          id: filepath,
        }),
      );
    } else {
      dispatch(internalSetPreselected(filepath));
      dispatch(internalSetSelected(filepath));
    }
  },
);

export const scrollFileIntoView = createAsyncThunk(
  "fileexplorer/scrollFileIntoView",
  async (payload: string, { dispatch }) => {
    const filepath = payload;
    dispatch(internalExpandAllDirectoriesTillFile(filepath));
    // This timeout should push this code the macrotask queue AFTER the render has happened.
    // This gives us time to expand the directories and make sure the file ref is in the DOM.
    setTimeout(() => {
      document
        .getElementById("file-tree")
        ?.querySelector(`[data-filepath="${filepath}"]`)
        ?.scrollIntoView({
          behavior: "instant",
          block: "nearest",
        });
    }, 0);
  },
);

// Convert the recursive directory structure into a linear list of directories and files.
const linearizeFilesAndDirs = (
  dir: Directory,
  directories: Record<string, DirectoryState>,
): string[] => {
  let result = [dir.id];
  if (directories[dir.id]?.isCollapsed) {
    return result;
  } else {
    for (const subDir of Object.values(dir.directories)) {
      result = result.concat(linearizeFilesAndDirs(subDir, directories));
    }
    return result.concat(dir.files);
  }
};

// Get next item in the linear list of directories and files.
const nextFileOrDir = (getState: () => unknown, id: string): string => {
  const state = getState() as FileexplorerState;

  const line = linearizeFilesAndDirs(state.rootDirectory, state.directories);
  const index = line.indexOf(id);
  return line[index + 1] || id;
};

// Get prev item in the linear list of directories and files.
const prevFileOrDir = (getState: () => unknown, id: string): string => {
  const state = getState() as FileexplorerState;

  const line = linearizeFilesAndDirs(state.rootDirectory, state.directories);
  const index = line.indexOf(id);
  return line[index - 1] || id;
};

// Convert the state into a graph
const getGraphFromState = (getState: () => unknown): Graph => {
  const state = getState() as RootState;

  const allCollapsedDirectories = Object.entries(state.fileexplorer.directories)
    .filter(([_, state]) => state.isCollapsed)
    .map(([id, _]) => id)
    .sort((a, b) => b.length - a.length);

  // find all collapsed directory roots
  const collapsedDirectoryRoots = new Set<string>();
  for (const dir of allCollapsedDirectories) {
    let isCollapsedRoot = true;
    for (const root of collapsedDirectoryRoots) {
      if (dir.startsWith(root)) {
        isCollapsedRoot = false;
        break;
      }
    }
    if (isCollapsedRoot) {
      collapsedDirectoryRoots.add(dir);
    }
  }

  // Returns file id or the containing collapsed directory id.
  const findCollapsedRoot = (id: string): string => {
    // remove the last part
    const prefix = id.split("/").slice(0, -1).join("/");
    for (const dir of collapsedDirectoryRoots) {
      if (prefix.startsWith(dir)) {
        return dir;
      }
    }
    return id;
  };

  const newNodes: Record<string, Node> = Object.fromEntries(
    Object.values(state.graph.nodes)
      .map((node) => {
        return {
          ...node,
          id: findCollapsedRoot(node.id),
        };
      })
      .filter((node) => {
        if (state.fileexplorer.isolated === null) {
          return true;
        }
        return node.id.startsWith(state.fileexplorer.isolated);
      })
      .map((node) => [node.id, node]),
  );
  const newEdgesWithRepeats: Edge[] = Object.values(state.graph.edges)
    .map((edge) => {
      return {
        ...edge,
        ...{ source: findCollapsedRoot(edge.source) },
        ...{ target: findCollapsedRoot(edge.target) },
      };
    })
    .filter((edge) => edge.source !== edge.target)
    .filter((edge) => {
      return (
        newNodes[edge.source] !== undefined &&
        newNodes[edge.target] !== undefined
      );
    });

  const newEdges: Record<string, Edge> = {};
  for (const edge of newEdgesWithRepeats) {
    const key = `${edge.source}-${edge.target}`;
    if (newEdges[key] === undefined) {
      newEdges[key] = edge;
    } else {
      newEdges[key].weight += edge.weight;
    }
  }

  return { nodes: Object.values(newNodes), edges: Object.values(newEdges) };
};

// Kinda feels like this could live in cytoscape...
export const drawCurrentFileExplorerState = createAsyncThunk(
  "fileexplorer/drawCurrentFileExplorerState",
  async (payload: void, { dispatch, getState }) => {
    dispatch(cytoscapeDraw(getGraphFromState(getState)));
  },
);

export const collapseDirectory = createAsyncThunk(
  "fileexplorer/collapseDirectory",
  async (payload: string, { dispatch, getState }) => {
    const state = getState() as RootState;
    const id = payload;
    if (state.fileexplorer.isolated?.startsWith(id)) {
      dispatch(setIsolated(null));
    }
    dispatch(internalCollapseDirectory(id));
    dispatch(drawCurrentFileExplorerState());
  },
);

export const expandDirectory = createAsyncThunk(
  "fileexplorer/expandDirectory",
  async (payload: string, { dispatch }) => {
    const id = payload;
    dispatch(internalExpandDirectory(id));
    dispatch(drawCurrentFileExplorerState());
  },
);

export const setIsolated = createAsyncThunk(
  "fileexplorer/setIsolated",
  async (payload: string | null, { dispatch }) => {
    dispatch(internalSetIsolated(payload));
    dispatch(drawCurrentFileExplorerState());
  },
);

export const setPreselected = createAsyncThunk(
  "fileexplorer/setPreselected",
  async (payload: string, { dispatch }) => {
    const id = payload;
    dispatch(internalSetPreselected(id));
    dispatch(scrollFileIntoView(id));
  },
);

export const preselectNextFile = createAsyncThunk(
  "fileexplorer/preselectNextFile",
  async (payload: string, { dispatch, getState }) => {
    const state = getState() as RootState;
    const id = payload;
    const next = nextFileOrDir(() => state.fileexplorer, id);
    dispatch(setPreselected(next));
  },
);

export const preselectPrevFile = createAsyncThunk(
  "fileexplorer/preselectPrevFile",
  async (payload: string, { dispatch, getState }) => {
    const state = getState() as RootState;
    const id = payload;
    const next = prevFileOrDir(() => state.fileexplorer, id);
    dispatch(setPreselected(next));
  },
);

export const preselectPrevDirOrCollapse = createAsyncThunk(
  "fileexplorer/preselectPrevDirOrCollapse",
  async (payload: string, { dispatch, getState }) => {
    const state = getState() as RootState;
    const id = payload;
    if (state.fileexplorer.directories[id]?.isCollapsed === false) {
      dispatch(collapseDirectory(id));
    } else {
      const parent = id.split("/").slice(0, -1).join("/");
      dispatch(setPreselected(parent));
    }
  },
);

export const preselectNextDirOrExpand = createAsyncThunk(
  "fileexplorer/preselectNextDirOrExpand",
  async (payload: string, { dispatch, getState }) => {
    const state = getState() as RootState;
    const id = payload;
    if (state.fileexplorer.directories[id]?.isCollapsed === true) {
      dispatch(expandDirectory(id));
    } else if (state.fileexplorer.directories[id] !== undefined) {
      dispatch(preselectNextFile(id));
    } else {
      // Do nothing. Stop at the file.
    }
  },
);

export const fileexplorerSlice = createSlice({
  name: "fileexplorer",
  initialState,
  reducers: {
    // Internal actions have no side effects
    internalSetPreselected: (state, action: PayloadAction<string>) => {
      state.preselected = action.payload;
    },
    internalSetSelected: (state, action: PayloadAction<string | null>) => {
      state.selected = action.payload;
    },
    internalSetIsolated: (state, action: PayloadAction<string | null>) => {
      const id = action.payload;
      state.isolated = id;
    },
    internalCollapseDirectory: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      state.directories[id].isCollapsed = true;
    },
    internalExpandDirectory: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      state.directories[id].isCollapsed = false;
    },
    internalExpandAllDirectoriesTillFile: (
      state,
      action: PayloadAction<string>,
    ) => {
      const nodeId = action.payload;

      const parts = nodeId.split("/");
      // Ignore the file itself
      parts.pop();
      // Expand all directories till the file
      state.directories[root].isCollapsed = false;
      for (let i = 0; i < parts.length; i++) {
        const id = parts.slice(0, i + 1).join("/");
        state.directories[id].isCollapsed = false;
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(scheduleGraph.pending, (state, _action) => {
      state.status = "loading";
    });
    builder.addCase(scheduleGraph.rejected, (state, _action) => {
      state.status = "failed";
    });
    builder.addCase(checkGraphStatus.fulfilled, (state, action) => {
      const payload = action.payload;
      if (payload.status !== "Done") {
        return;
      }
      state.status = "succeeded";
      const graph = payload.graph!;

      const nodes = Object.fromEntries(
        graph.nodes.map((node) => [node.id, node]),
      );

      // Hydrate the root directory from the nodes.
      // Also adds the DirectoryState to the state.
      const hydrateRootDirectory = (
        state: WritableDraft<FileexplorerState>,
      ): Directory => {
        const filesystem: Directory = {
          id: root,
          name: root,
          directories: {},
          files: [],
          depth: 0,
        };
        for (const node of Object.keys(nodes)) {
          const parts = node.split("/");
          let fs = filesystem;
          for (let i = 0; i < parts.length; i++) {
            if (i === parts.length - 1) {
              fs.files.push(node);
              state.files[node] = {};
            } else {
              if (fs.directories[parts[i]] === undefined) {
                const id = parts.slice(0, i + 1).join("/");
                const next: Directory = {
                  id: id,
                  name: parts[i],
                  directories: {},
                  files: [],
                  depth: i + 1,
                };
                fs.directories[parts[i]] = next;
                state.directories[id] = {
                  isCollapsed: false,
                };
              }
              fs = fs.directories[parts[i]];
            }
          }
        }
        return filesystem;
      };

      state.rootDirectory = hydrateRootDirectory(state);
    });
  },
});

// Action creators are generated for each case reducer function
export const {
  internalSetPreselected,
  internalSetSelected,
  internalSetIsolated,
  internalCollapseDirectory,
  internalExpandDirectory,
  internalExpandAllDirectoriesTillFile,
} = fileexplorerSlice.actions;

export default fileexplorerSlice.reducer;
