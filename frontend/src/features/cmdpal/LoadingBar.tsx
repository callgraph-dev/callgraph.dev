import clsx from "clsx";
import React from "react";
import { useDispatch, useSelector } from "react-redux";

import { AppDispatch, RootState } from "../../store";
import { hideTooltip, showTooltip } from "../tooltip/tooltipSlice";

const LoadingBar = () => {
  const loadingBarWidth = useSelector(
    (state: RootState) => state.cmdpal.loadingBarWidth,
  );

  const dispatch = useDispatch<AppDispatch>();

  const isLoading = loadingBarWidth !== "w-full";

  const handleMouseOver = (_event: React.MouseEvent<HTMLDivElement>) => {
    if (!isLoading) {
      return;
    }

    const loadingstates = {
      "w-1/6": "Scheduling tasks...",
      "w-2/6": "Checking cache...",
      "w-3/6": "Cloning repository...",
      "w-4/6": "Indexing repository...",
      "w-5/6": "Computing graph layout...",
      "w-full": "Done",
    };

    dispatch(
      showTooltip({
        type: "plaintextviewer",
        contents: loadingstates[loadingBarWidth],
      }),
    );
  };

  const handleMouseOut = (_event: React.MouseEvent<HTMLDivElement>) => {
    dispatch(hideTooltip());
  };

  return (
    <div
      id="combo-box-loading-bar"
      className={clsx(["w-full", isLoading ? "h-1" : "h-0.5"])}
      onMouseOver={handleMouseOver}
      onMouseOut={handleMouseOut}
    >
      <div
        id="combo-box-loading-bar-completed"
        className={clsx([
          "bg-orange-500 transition-all h-full",
          loadingBarWidth,
        ])}
      ></div>
    </div>
  );
};

export default LoadingBar;
