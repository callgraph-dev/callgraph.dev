import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";

import { OptionGroupProps } from "./ContextMenu";

interface Position {
  x: number;
  y: number;
}

interface ShowContextMenuPayload {
  position: Position;
  targetType: "core" | "node";
  isFolder: boolean;
}

export interface contextMenuState {
  position: Position | null;
  optionGroups: OptionGroupProps[];
}

const initialState: contextMenuState = {
  position: null,
  optionGroups: [],
};

export const contextMenuSlice = createSlice({
  name: "contextMenu",
  initialState,
  reducers: {
    showContextMenu: (state, action: PayloadAction<ShowContextMenuPayload>) => {
      const { position, targetType, isFolder } = action.payload;
      state.position = position;
      if (targetType === "core") {
        state.optionGroups = [
          {
            label: "Graph",
            options: [{ label: "Reveal all hidden nodes" }],
          },
          {
            label: "Folder",
            options: [
              { label: "Collapse all folders" },
              { label: "Expand all folders" },
            ],
          },
        ];
      } else if (targetType === "node") {
        state.optionGroups = [
          {
            label: "Graph",
            options: [{ label: "Hide node" }],
          },
          {
            label: "Folder",
            options: [
              { label: "Collapse enclosing folder" },
              ...(isFolder ? [{ label: "Expand folder" }] : []),
              ...(isFolder ? [{ label: "Summarize API" }] : []),
            ],
          },
        ];
      } else {
        console.error("Unknown target type");
      }
    },
    hideContextMenu: (state) => {
      state.position = null;
    },
    setOptionGroups: (state, action: PayloadAction<OptionGroupProps[]>) => {
      state.optionGroups = action.payload;
    },
  },
});

// Action creators are generated for each case reducer function
export const { showContextMenu, hideContextMenu, setOptionGroups } =
  contextMenuSlice.actions;

export default contextMenuSlice.reducer;
