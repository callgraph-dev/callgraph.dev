import React, { useEffect } from "react";
import { useDispatch } from "react-redux";

import type { AppDispatch } from "../../store";
import { scheduleGraph } from "../graph/graphSlice";

export const Debug: React.FC = () => {
  console.log("Debug component");
  const dispatch: AppDispatch = useDispatch();

  useEffect(() => {
    dispatch(scheduleGraph("https://github.com/pypa/pipx"));
  }, []);

  return <div></div>;
};

export default Debug;
