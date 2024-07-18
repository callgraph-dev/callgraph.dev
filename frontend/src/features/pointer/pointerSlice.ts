import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface PointerState {
  x: number;
  y: number;
}

export interface UpdatePointer {
  x: number;
  y: number;
}

const initialState: PointerState = {
  x: 0,
  y: 0,
};

export const pointerSlice = createSlice({
  name: "pointer",
  initialState,
  reducers: {
    updatePointer: (state, action: PayloadAction<UpdatePointer>) => {
      state.x = action.payload.x;
      state.y = action.payload.y;
    },
  },
});

export const { updatePointer } = pointerSlice.actions;

export default pointerSlice.reducer;
