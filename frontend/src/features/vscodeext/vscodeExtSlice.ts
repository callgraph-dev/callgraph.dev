import { PayloadAction, createSlice } from "@reduxjs/toolkit";

interface VscodeExtState {
  // Define state properties here
  command: string;
  cmdargs: object;
}

const initialState: VscodeExtState = {
  command: "",
  cmdargs: {},
};

const vscodeExtSlice = createSlice({
  name: "vscodeExt",
  initialState,
  reducers: {
    // Handled by src/utils/panel/CallgraphWebviewPanel.ts#onDidReceiveMessage
    sendVSCodeMessage(
      state,
      action: PayloadAction<{ command: string; cmdargs: object }>,
    ) {
      state.command = action.payload.command;
      state.cmdargs = action.payload.cmdargs;
    },
  },
});

export const { sendVSCodeMessage } = vscodeExtSlice.actions;
export default vscodeExtSlice.reducer;
