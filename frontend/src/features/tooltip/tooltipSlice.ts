import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";

import { Snippet } from "../../shared/graph";

export interface TooltipState {
  hidden: boolean;
  details: ShowTooltipPayload;
}

const initialState: TooltipState = {
  hidden: true,
  details: {
    type: "plaintextviewer",
    contents: "",
  },
};

interface CodeviewTooltipPayload {
  type: "codeviewer";
  contents: Snippet[];
}

interface PlaintextTooltipPayload {
  type: "plaintextviewer";
  contents: string;
}

type ShowTooltipPayload = CodeviewTooltipPayload | PlaintextTooltipPayload;

export const tooltipSlice = createSlice({
  name: "tooltip",
  initialState,
  reducers: {
    showTooltip: (state, action: PayloadAction<ShowTooltipPayload>) => {
      const payload = action.payload;
      state.hidden = !hasContents(payload);
      state.details = payload;
    },
    hideTooltip: (state) => {
      state.hidden = true;
      state.details = {
        type: "plaintextviewer",
        contents: "",
      };
    },
  },
});

function hasContents(payload: ShowTooltipPayload): boolean {
  if (payload.type === "codeviewer") {
    return payload.contents.length > 0;
  } else if (payload.type === "plaintextviewer") {
    return payload.contents !== "";
  }
  // default to true
  return true;
}

export const { showTooltip, hideTooltip } = tooltipSlice.actions;

export default tooltipSlice.reducer;
