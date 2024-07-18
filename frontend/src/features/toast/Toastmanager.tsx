import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { ToastContainer } from "react-toastify";

import "react-toastify/dist/ReactToastify.css";
import { AppDispatch } from "../../store";

import { createToast } from "./toastSlice";

const ToastManager: React.FC = () => {
  const dispatch: AppDispatch = useDispatch();

  useEffect(() => {
    window.onerror = (message, source, lineno, colno, error) => {
      console.error(
        "Uncaught exception: ",
        message,
        source,
        lineno,
        colno,
        error,
      );

      dispatch(
        createToast({
          text: "An unexpected error occurred. Please try again later.",
          type: "error",
          id: "-1",
        }),
      );
      return true;
    };
  }, []);

  useEffect(() => {
    window.onunhandledrejection = function (event) {
      console.error("Unhandled Promise rejection:", event.reason);
      dispatch(
        createToast({
          text: "An unexpected error occurred. Please try again later.",
          type: "error",
          id: "-2",
        }),
      );
      return true;
    };
  }, []);

  return (
    <ToastContainer
      stacked
      newestOnTop={false}
      position="bottom-right"
      hideProgressBar={true}
    />
  );
};

export default ToastManager;
