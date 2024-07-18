import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import { AppDispatch, RootState } from "../../store";
import { setLoadingBarWidth } from "../cmdpal/cmdpalSlice";
import { checkGraphStatus } from "../graph/graphSlice";
import { createToast } from "../toast/toastSlice";

const POLLING_INTERVAL_MS = 3000;
let interval: number | undefined;

// This component lifecycle is coupled to the interval.
// If the component is unmounted, the interval is cleared.
// If the statusKey changes, the interval is cleared and reset.
const StatusKeyPolling: React.FC = () => {
  console.log("StatusKeyPolling loaded");
  const dispatch: AppDispatch = useDispatch();
  const status = useSelector((state: RootState) => state.graph.status);
  const statusKey = useSelector((state: RootState) => state.graph.statusKey);
  const numNodes = useSelector(
    (state: RootState) => Object.keys(state.graph.nodes).length,
  );

  useEffect(() => {
    if (interval !== undefined) {
      clearInterval(interval);
      interval = undefined;
    }
    if (statusKey) {
      dispatch(checkGraphStatus(statusKey));

      interval = setInterval(() => {
        dispatch(checkGraphStatus(statusKey));
      }, POLLING_INTERVAL_MS);
    }
    return () => {
      if (interval) {
        clearInterval(interval);
        interval = undefined;
      }
    };
  }, [statusKey]);

  useEffect(() => {
    if (status === "failed") {
      dispatch(createToast({ text: "Failed to load graph", type: "error" }));
      dispatch(setLoadingBarWidth("w-full"));
    }
  }, [status]);

  useEffect(() => {
    if (status === "idle" && numNodes === 0) {
      dispatch(createToast({ text: "No nodes found in graph", type: "error" }));
    }
  }, [status, numNodes]);

  return <div></div>;
};

export default StatusKeyPolling;
