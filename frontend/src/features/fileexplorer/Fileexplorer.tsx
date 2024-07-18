import { clsx } from "clsx";
import React, { MouseEventHandler, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { Strong, Text } from "../../components/Text";
import type { AppDispatch, RootState } from "../../store";
import { cytoscapeCenter } from "../cytoscape/cytoscapeSlice";
import { filterNodesByText } from "../graph/graphSlice";

import FileExpansion from "./Fileexpansion";
import {
  Directory,
  collapseDirectory,
  expandDirectory,
  selectFileOrDir,
  setIsolated,
  preselectNextFile,
  preselectPrevFile,
  preselectPrevDirOrCollapse,
  preselectNextDirOrExpand,
} from "./fileexplorerSlice";
import LoadingFileexplorer from "./LoadingFileexplorer";
import StatusKeyPolling from "./StatusKeyPolling";

const ChevronDown: React.FC = (): React.ReactNode => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="w-5 h-5"
    >
      <path
        fillRule="evenodd"
        d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
        clipRule="evenodd"
      />
    </svg>
  );
};

const ChevronRight: React.FC = (): React.ReactNode => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="w-5 h-5"
    >
      <path
        fillRule="evenodd"
        d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z"
        clipRule="evenodd"
      />
    </svg>
  );
};

const DocumentTextIcon: React.FC = (): React.ReactNode => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      className="w-4 h-4 m-0.5 text-zinc-700"
    >
      <path
        fillRule="evenodd"
        d="M4 2a1.5 1.5 0 0 0-1.5 1.5v9A1.5 1.5 0 0 0 4 14h8a1.5 1.5 0 0 0 1.5-1.5V6.621a1.5 1.5 0 0 0-.44-1.06L9.94 2.439A1.5 1.5 0 0 0 8.878 2H4Zm1 5.75A.75.75 0 0 1 5.75 7h4.5a.75.75 0 0 1 0 1.5h-4.5A.75.75 0 0 1 5 7.75Zm0 3a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1-.75-.75Z"
        clipRule="evenodd"
      />
    </svg>
  );
};

const ViewfinderCircleIcon: React.FC = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      className="w-4 h-4"
    >
      <path d="M3.75 2A1.75 1.75 0 0 0 2 3.75v1.5a.75.75 0 0 0 1.5 0v-1.5a.25.25 0 0 1 .25-.25h1.5a.75.75 0 0 0 0-1.5h-1.5ZM10.75 2a.75.75 0 0 0 0 1.5h1.5a.25.25 0 0 1 .25.25v1.5a.75.75 0 0 0 1.5 0v-1.5A1.75 1.75 0 0 0 12.25 2h-1.5ZM3.5 10.75a.75.75 0 0 0-1.5 0v1.5c0 .966.784 1.75 1.75 1.75h1.5a.75.75 0 0 0 0-1.5h-1.5a.25.25 0 0 1-.25-.25v-1.5ZM14 10.75a.75.75 0 0 0-1.5 0v1.5a.25.25 0 0 1-.25.25h-1.5a.75.75 0 0 0 0 1.5h1.5A1.75 1.75 0 0 0 14 12.25v-1.5ZM8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
    </svg>
  );
};

const FolderPlusIcon: React.FC = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      className="w-4 h-4"
    >
      <path
        fillRule="evenodd"
        d="M3.5 2A1.5 1.5 0 0 0 2 3.5v9A1.5 1.5 0 0 0 3.5 14h9a1.5 1.5 0 0 0 1.5-1.5v-7A1.5 1.5 0 0 0 12.5 4H9.621a1.5 1.5 0 0 1-1.06-.44L7.439 2.44A1.5 1.5 0 0 0 6.38 2H3.5ZM8 6a.75.75 0 0 1 .75.75v1.5h1.5a.75.75 0 0 1 0 1.5h-1.5v1.5a.75.75 0 0 1-1.5 0v-1.5h-1.5a.75.75 0 0 1 0-1.5h1.5v-1.5A.75.75 0 0 1 8 6Z"
        clipRule="evenodd"
      />
    </svg>
  );
};

const FolderMinusIcon: React.FC = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      className="w-4 h-4"
    >
      <path
        fillRule="evenodd"
        d="M3.5 2A1.5 1.5 0 0 0 2 3.5v9A1.5 1.5 0 0 0 3.5 14h9a1.5 1.5 0 0 0 1.5-1.5v-7A1.5 1.5 0 0 0 12.5 4H9.621a1.5 1.5 0 0 1-1.06-.44L7.439 2.44A1.5 1.5 0 0 0 6.38 2H3.5Zm6.75 7.75a.75.75 0 0 0 0-1.5h-4.5a.75.75 0 0 0 0 1.5h4.5Z"
        clipRule="evenodd"
      />
    </svg>
  );
};

export const Fileexplorer: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const rootDirectory = useSelector(
    (state: RootState) => state.fileexplorer.rootDirectory,
  );
  const preselected = useSelector(
    (state: RootState) => state.fileexplorer.preselected,
  );
  const status = useSelector((state: RootState) => state.fileexplorer.status);

  useEffect(() => {
    const handle = (event: KeyboardEvent) => {
      if (preselected === null) return;
      const events = [
        "ArrowDown",
        "ArrowUp",
        "ArrowLeft",
        "ArrowRight",
        " ",
        "Enter",
      ];
      if (!events.includes(event.key)) return;

      // prevents moving the scroll bar
      event.preventDefault();

      if (event.key === "ArrowDown") {
        dispatch(preselectNextFile(preselected));
      } else if (event.key === "ArrowUp") {
        dispatch(preselectPrevFile(preselected));
      } else if (event.key === "ArrowLeft") {
        dispatch(preselectPrevDirOrCollapse(preselected));
      } else if (event.key === "ArrowRight") {
        dispatch(preselectNextDirOrExpand(preselected));
      } else if (event.key === " " || event.key === "Enter") {
        dispatch(selectFileOrDir(preselected));
      }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [preselected]);

  return (
    <>
      <div
        id="floating-window-file-tree"
        className="absolute z-20 ml-4 mt-24 hidden sm:flex"
      >
        <div
          id="file-tree-container"
          className="relative z-[21] h-[80vh] max-h-max w-64 flex flex-col rounded border-zinc-800 bg-stone-50 opacity-95 backdrop-blur-2xl drop-shadow"
        >
          <div className="flex gap-1 p-2">
            <Text>
              <Strong>File Explorer</Strong>
            </Text>
          </div>
          <div className="h-px bg-gradient-to-r from-orange-700 to-orange-50"></div>
          <div id="file-tree" className="flex flex-col flex-1 overflow-auto">
            {status === "succeeded" && (
              <FileTreeRootDirectory dir={rootDirectory} />
            )}
            {status === "loading" && <LoadingFileexplorer />}
          </div>
          <div className="h-px bg-gradient-to-l from-orange-700 to-orange-50"></div>
        </div>
        <FileExpansion />
      </div>
    </>
  );
};

export const FileTreeFile: React.FC<{ filepath: string; depth: number }> = ({
  filepath,
  depth,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const [isHovered, setIsHovered] = useState(false);

  const isSelected = useSelector(
    (state: RootState) => state.fileexplorer.selected === filepath,
  );
  const filename = filepath.split("/").pop();
  const isPreselected = useSelector(
    (state: RootState) => state.fileexplorer.preselected === filepath,
  );

  const handleFileClick: MouseEventHandler<HTMLDivElement> = (event) => {
    dispatch(selectFileOrDir(filepath));
    event.stopPropagation();
  };

  const handleViewfinderCircleClick: MouseEventHandler<HTMLDivElement> = () => {
    dispatch(cytoscapeCenter(filepath));
  };

  const paddingLeft = `${(depth - 1) * 8}px`;
  return (
    <div
      className={clsx(
        !isSelected && "hover:bg-slate-400/20",
        isSelected && "bg-blue-400 hover:bg-blue-400/80",
        isPreselected && "ring-inset ring-2 ring-blue-300/80",
      )}
      onClick={handleFileClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className="flex flex-row flex-shrink-0 items-center gap-1"
        style={{ paddingLeft }}
      >
        <DocumentTextIcon />
        <Text isSelected={isSelected} data-filepath={filepath}>
          {filename}
        </Text>
        {isHovered && (
          <div
            className="ml-auto mr-2 hover:text-blue-500"
            onClick={handleViewfinderCircleClick}
          >
            <ViewfinderCircleIcon />
          </div>
        )}
      </div>
    </div>
  );
};

const FileTreeDirectory: React.FC<{
  dir: Directory;
}> = ({ dir }) => {
  const dispatch = useDispatch<AppDispatch>();
  const [isHovered, setIsHovered] = useState(false);
  // isIsolated controls if we only show files/folders in the current directory.
  const isIsolated = useSelector(
    (state: RootState) => state.fileexplorer.isolated === dir.id,
  );
  const isCollapsed = useSelector(
    (state: RootState) => state.fileexplorer.directories[dir.id].isCollapsed,
  );
  const isSelected = useSelector(
    (state: RootState) => state.fileexplorer.selected === dir.id,
  );
  const isPreselected = useSelector(
    (state: RootState) => state.fileexplorer.preselected === dir.id,
  );

  const setIsCollapsed = (shouldCollapse: boolean) => {
    if (shouldCollapse) {
      dispatch(collapseDirectory(dir.id));
    } else {
      dispatch(expandDirectory(dir.id));
    }
  };

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    setIsCollapsed(!isCollapsed);
    dispatch(selectFileOrDir(dir.id));
    event.preventDefault();
    event.stopPropagation();
  };

  const handleFolderPlusIconClick = (
    event: React.MouseEvent<HTMLDivElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    dispatch(setIsolated(dir.id));
    dispatch(filterNodesByText(dir.name));
  };

  const handleFolderMinusIconClick = (
    event: React.MouseEvent<HTMLDivElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    dispatch(setIsolated(null));
  };

  const paddingLeft = `${(dir.depth - 1) * 8}px`;
  return (
    <div className={clsx(["w-full", isIsolated && "bg-blue-500/20"])}>
      <div
        className={clsx([
          "flex flex-row items-center gap-0 w-full text-orange-700",
          !isSelected && "hover:bg-slate-400/20",
          isSelected && "bg-blue-400/70 hover:bg-blue-400/60",
          isPreselected && "ring-inset ring-2 ring-blue-300/80",
        ])}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          className="flex flex-row w-full flex-shrink-0 items-center gap-0"
          style={{ paddingLeft }}
        >
          {isCollapsed && <ChevronRight />}
          {!isCollapsed && <ChevronDown />}
          <Text isSelected={isSelected} data-filepath={dir.id}>
            {dir.name}
          </Text>
          {isHovered && !isIsolated && (
            <div
              className="ml-auto mr-2 text-black hover:text-blue-500"
              onClick={handleFolderPlusIconClick}
            >
              <FolderPlusIcon />
            </div>
          )}
          {isHovered && isIsolated && (
            <div
              className="ml-auto mr-2 text-black hover:text-blue-500"
              onClick={handleFolderMinusIconClick}
            >
              <FolderMinusIcon />
            </div>
          )}
        </div>
      </div>
      {!isCollapsed && (
        <div className="flex flex-col">
          {" "}
          {Object.values(dir.directories).map((subDir, index) => (
            <FileTreeDirectory key={index} dir={subDir} />
          ))}
          {dir.files.map((file, index) => (
            <FileTreeFile key={index} filepath={file} depth={dir.depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

const FileTreeRootDirectory: React.FC<{
  dir: Directory;
}> = ({ dir }) => {
  return (
    <div className="flex flex-col overflow-auto">
      {" "}
      {Object.values(dir.directories).map((subDir, index) => (
        <FileTreeDirectory key={index} dir={subDir} />
      ))}
      {dir.files.map((file, index) => (
        <FileTreeFile key={index} filepath={file} depth={dir.depth + 1} />
      ))}
    </div>
  );
};

export default Fileexplorer;
