import {
  useFloating,
  offset,
  flip,
  VirtualElement,
  ClientRectObject,
} from "@floating-ui/react-dom";
import React, { useEffect, ReactNode } from "react";
import { useSelector, useDispatch } from "react-redux";

import type { RootState } from "../../store";
import CodeViewer, { PlainTextViewer } from "../codeviewer/CodeViewer";
import { updatePointer } from "../pointer/pointerSlice";

type TooltipProps = {
  children: ReactNode;
  reference: VirtualElement;
};

const Tooltip: React.FC<TooltipProps> = ({ children, reference }) => {
  const { x, y, strategy, refs, update, isPositioned } = useFloating({
    strategy: "absolute",
    placement: "right",
    middleware: [offset({ mainAxis: 10, crossAxis: -10 }), flip()],
    elements: {
      reference,
    },
  });
  // Style object for the floating element
  const floatingStyles = {
    position: strategy,
    top: y ?? 0,
    left: x ?? 0,
    visibility: isPositioned ? "visible" : "hidden",
  };

  useEffect(() => {
    if (reference) {
      update();
    }
  }, [reference, update]);

  return (
    <div ref={refs.floating} style={floatingStyles} className="z-50">
      {children}
    </div>
  );
};

const MouseTooltip: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const dispatch = useDispatch();
  const x = useSelector((state: RootState) => state.pointer.x);
  const y = useSelector((state: RootState) => state.pointer.y);

  useEffect(() => {
    const updateMouseCoordsFn = (e: MouseEvent) => {
      dispatch(updatePointer({ x: e.clientX, y: e.clientY }));
    };
    document.addEventListener("mousemove", updateMouseCoordsFn);
    return () => {
      document.removeEventListener("mousemove", updateMouseCoordsFn);
    };
  }, []);

  const virtualEl = {
    getBoundingClientRect(): ClientRectObject {
      return {
        width: 0,
        height: 0,
        x: x,
        y: y,
        top: y,
        left: x,
        right: x,
        bottom: y,
      };
    },
  };

  return <Tooltip reference={virtualEl}>{children}</Tooltip>;
};

const HideableMouseTooltip: React.FC = () => {
  const hidden = useSelector((state: RootState) => state.tooltip.hidden);
  const tooltipDetails = useSelector(
    (state: RootState) => state.tooltip.details,
  );
  const language = useSelector((state: RootState) => state.graph.language);

  const children = (() => {
    if (hidden) {
      return null;
    }

    if (tooltipDetails.type === "codeviewer") {
      return (
        <CodeViewer
          snippets={tooltipDetails.contents}
          language={language ?? "no-highlight"}
        />
      );
    } else if (tooltipDetails.type === "plaintextviewer") {
      return <PlainTextViewer>{tooltipDetails.contents}</PlainTextViewer>;
    }
  })();

  return hidden ? null : <MouseTooltip>{children}</MouseTooltip>;
};

export default HideableMouseTooltip;
