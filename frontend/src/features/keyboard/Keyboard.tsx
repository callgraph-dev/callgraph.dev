import React, { useEffect } from "react";
import { useDispatch } from "react-redux";

import type { AppDispatch } from "../../store";

import { setAlt, setCtrl, setMeta, setShift } from "./keyboardSlice";
import { ShiftAltCtrlButtons } from "./ShiftAltCtrlButtons";

const handleKeydownWithDispatch =
  (dispatch: AppDispatch) => (event: KeyboardEvent) => {
    if (event.ctrlKey) {
      dispatch(setCtrl(true));
    }
    if (event.altKey) {
      dispatch(setAlt(true));
    }
    if (event.shiftKey) {
      dispatch(setShift(true));
    }
    if (event.metaKey) {
      dispatch(setMeta(true));
    }
  };

const handleKeyupWithDispatch =
  (dispatch: AppDispatch) => (event: KeyboardEvent) => {
    if (!event.ctrlKey) {
      dispatch(setCtrl(false));
    }
    if (!event.altKey) {
      dispatch(setAlt(false));
    }
    if (!event.shiftKey) {
      dispatch(setShift(false));
    }
    if (!event.metaKey) {
      dispatch(setMeta(false));
    }
  };

const handleWindowBlurWithDispatch = (dispatch: AppDispatch) => () => {
  dispatch(setCtrl(false));
  dispatch(setAlt(false));
  dispatch(setShift(false));
  dispatch(setMeta(false));
};

const Keyboard: React.FC = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const handleKeydown = handleKeydownWithDispatch(dispatch);
    const handleKeyup = handleKeyupWithDispatch(dispatch);
    document.addEventListener("keydown", handleKeydown);
    document.addEventListener("keyup", handleKeyup);
    window.addEventListener("blur", handleWindowBlurWithDispatch(dispatch));

    return () => {
      document.removeEventListener("keydown", handleKeydown);
      document.removeEventListener("keyup", handleKeyup);
      window.removeEventListener(
        "blur",
        handleWindowBlurWithDispatch(dispatch),
      );
    };
  }, [dispatch]);

  return <ShiftAltCtrlButtons />;
};

export default Keyboard;
