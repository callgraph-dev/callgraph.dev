import {
  ClientRectObject,
  VirtualElement,
  flip,
  offset,
  useFloating,
} from "@floating-ui/react-dom";
import React, { ReactNode, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import { Text } from "../../components/Text";
import { AppDispatch, type RootState } from "../../store";
import {
  cytoscapeCollapseAllFolders,
  cytoscapeCollapseFolder,
  cytoscapeExpandAllFolders,
  cytoscapeExpandFolder,
  cytoscapeFocusSubgraph,
  cytoscapeHideNode,
  cytoscapeShowAllHiddenNodes,
  cytoscapeSummarizeAPI,
} from "../cytoscape/cytoscapeSlice";

import { hideContextMenu } from "./contextMenuSlice";

type ContextMenuProps = {
  children: ReactNode;
  reference: VirtualElement;
};

const ContextMenu: React.FC<ContextMenuProps> = ({ children, reference }) => {
  const { x, y, strategy, refs, update, isPositioned } = useFloating({
    strategy: "absolute",
    placement: "bottom-start",
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

const MouseContextMenu: React.FC = () => {
  const x = useSelector((state: RootState) => state.contextmenu.position?.x);
  const y = useSelector((state: RootState) => state.contextmenu.position?.y);

  const optionGroups = useSelector(
    (state: RootState) => state.contextmenu.optionGroups,
  );

  if (x === undefined || y === undefined) {
    return null;
  }

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

  return (
    <ContextMenu reference={virtualEl}>
      <OptionMenu optionGroups={optionGroups}></OptionMenu>
    </ContextMenu>
  );
};

export default MouseContextMenu;

const OptionOnClickHandlers: { [key: string]: (dispatch) => () => void } = {
  // Core context menu
  "Reveal all hidden nodes": (dispatch: AppDispatch) => () => {
    dispatch(cytoscapeShowAllHiddenNodes());
    dispatch(hideContextMenu());
  },
  "Expand all folders": (dispatch: AppDispatch) => () => {
    dispatch(cytoscapeExpandAllFolders());
    dispatch(hideContextMenu());
  },
  "Collapse all folders": (dispatch: AppDispatch) => () => {
    dispatch(cytoscapeCollapseAllFolders());
    dispatch(hideContextMenu());
  },
  // Node context menu
  "Hide node": (dispatch: AppDispatch) => () => {
    dispatch(cytoscapeHideNode());
    dispatch(hideContextMenu());
  },
  "Focus subgraph": (dispatch: AppDispatch) => () => {
    dispatch(cytoscapeFocusSubgraph());
    dispatch(hideContextMenu());
  },
  "Expand folder": (dispatch: AppDispatch) => () => {
    dispatch(cytoscapeExpandFolder());
    dispatch(hideContextMenu());
  },
  "Collapse enclosing folder": (dispatch: AppDispatch) => () => {
    dispatch(cytoscapeCollapseFolder());
    dispatch(hideContextMenu());
  },
  "Summarize API": (dispatch: AppDispatch) => () => {
    dispatch(cytoscapeSummarizeAPI());
    dispatch(hideContextMenu());
  },
};

interface OptionProps {
  label: keyof typeof OptionOnClickHandlers;
}

const Option: React.FC<OptionProps> = ({ label }) => {
  const dispatch = useDispatch();
  return (
    <div
      className="hover:bg-gray-200 cursor-pointer"
      onClick={OptionOnClickHandlers[label](dispatch)}
    >
      <Text>{label}</Text>
    </div>
  );
};

export interface OptionGroupProps {
  label: string;
  options: OptionProps[];
}

const OptionGroup: React.FC<OptionGroupProps> = ({ label, options }) => {
  return (
    <>
      <Divider label={label} />
      {options.map((option, idx) => (
        <Option key={idx} label={option.label} />
      ))}
    </>
  );
};

export interface OptionMenuProps {
  optionGroups: OptionGroupProps[];
}

export const OptionMenu: React.FC<OptionMenuProps> = ({ optionGroups }) => {
  return (
    <div className="flex flex-col p-2 bg-white border border-gray-200 rounded-lg shadow-lg min-w-48 max-w-96">
      {optionGroups.map((optionGroup, idx) => (
        <React.Fragment key={idx}>
          <OptionGroup
            label={optionGroup.label}
            options={optionGroup.options}
          />
        </React.Fragment>
      ))}
    </div>
  );
};

const Divider: React.FC<{ label: string }> = ({ label }) => {
  return (
    <div className="relative">
      <div className="absolute inset-0 flex items-center" aria-hidden="true">
        <div className="w-full border-t border-gray-300" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-white px-2 text-sm text-gray-500">{label}</span>
      </div>
    </div>
  );
};
