import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

import { checkGraphStatus, scheduleGraph } from "../graph/graphSlice";

export interface CmdpalState {
  isFocused: boolean;
  // 1. Made Network request
  // 2. Started Cloning (server-side event)
  // 3. Finished Cloning (server-side event)
  // 4. Finished Indexing (server-side event)
  // 5. Finished send back graph
  // 6. Finished dagre layout
  loadingBarWidth: "w-1/6" | "w-2/6" | "w-3/6" | "w-4/6" | "w-5/6" | "w-full";
}

const initialState: CmdpalState = {
  isFocused: false,
  loadingBarWidth: "w-full",
};

export const cmdpalSlice = createSlice({
  name: "cmdpal",
  initialState,
  reducers: {
    focusCommandPalette: (state) => {
      state.isFocused = true;
    },
    blurCommandPalette: (state) => {
      state.isFocused = false;
    },
    setLoadingBarWidth(
      state,
      action: PayloadAction<CmdpalState["loadingBarWidth"]>,
    ) {
      state.loadingBarWidth = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(scheduleGraph.pending, (state, _action) => {
      state.loadingBarWidth = "w-1/6";
    });
    builder.addCase(scheduleGraph.rejected, (state, _action) => {
      state.loadingBarWidth = "w-full";
    });
    builder.addCase(checkGraphStatus.fulfilled, (state, action) => {
      const payload = action.payload;
      if (payload.status === "Started") {
        state.loadingBarWidth = "w-2/6";
      } else if (payload.status === "Cloning") {
        state.loadingBarWidth = "w-3/6";
      } else if (payload.status === "Indexing") {
        state.loadingBarWidth = "w-4/6";
      }
      // NB: initializeCytoscape handles setting loadingBarWidth to w-5/6 and w-full (avoids race condition between 'done' and initializeCytoscape)
    });
  },
});

// Action creators are generated for each case reducer function
export const { focusCommandPalette, blurCommandPalette, setLoadingBarWidth } =
  cmdpalSlice.actions;

export default cmdpalSlice.reducer;
