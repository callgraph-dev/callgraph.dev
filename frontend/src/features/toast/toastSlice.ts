/**
 * Toasts are mostly managed on their own via the react-toastify library.
 *
 * IDs are stored here for additional manipulation, but an ID in the store does
 * NOT mean that the toast is still active/displayed.
 */

import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { toast, TypeOptions } from "react-toastify";

export interface Toast {
  id: string;
}

export interface ToastState {
  toasts: {
    [id: string]: Toast;
  };
}

const initialState: ToastState = {
  toasts: {},
};

interface CreateToastProps {
  text: string;
  type: TypeOptions;
  id?: string;
}

export const createToast = createAsyncThunk(
  "toast/createToast",
  async (payload: CreateToastProps, { dispatch }) => {
    const id =
      payload.id ?? "" + (Date.now() + Math.floor(Math.random() * 100000));
    toast(payload.text, {
      toastId: id,
      type: payload.type,
      onOpen: () => {
        dispatch(addToastId(id));
      },
      onClose: () => {
        dispatch(removeToastId(id));
      },
    });
  },
);

const toastSlice = createSlice({
  name: "toasts",
  initialState,
  reducers: {
    addToastId: (state, action: PayloadAction<string>) => {
      state.toasts[action.payload] = { id: action.payload };
    },
    removeToastId: (state, action: PayloadAction<string>) => {
      delete state.toasts[action.payload];
    },
  },
});

export const { addToastId, removeToastId } = toastSlice.actions;

export default toastSlice.reducer;
