import { PayloadAction, createSlice } from "@reduxjs/toolkit";

interface KeyboardState {
  isCtrl: boolean;
  isAlt: boolean;
  isShift: boolean;
  isMeta: boolean;
}

const initialState: KeyboardState = {
  isCtrl: false,
  isAlt: false,
  isShift: false,
  isMeta: false,
};

const keyboardSlice = createSlice({
  name: "keyboard",
  initialState,
  reducers: {
    setCtrl(state, action: PayloadAction<boolean>) {
      state.isCtrl = action.payload;
    },
    setAlt(state, action: PayloadAction<boolean>) {
      state.isAlt = action.payload;
    },
    setShift(state, action: PayloadAction<boolean>) {
      state.isShift = action.payload;
    },
    setMeta(state, action: PayloadAction<boolean>) {
      state.isMeta = action.payload;
    },
  },
});

export const { setAlt, setCtrl, setShift, setMeta } = keyboardSlice.actions;
export default keyboardSlice.reducer;
