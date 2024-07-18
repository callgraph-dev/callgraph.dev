import clsx from "clsx";
import React, { useState } from "react";
import { useSelector } from "react-redux";

import { Code, Strong, Text } from "../../components/Text";
import { RootState } from "../../store";

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

const ChevronLeft: React.FC = (): React.ReactNode => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="w-5 h-5"
    >
      <path
        fillRule="evenodd"
        d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z"
        clipRule="evenodd"
      />
    </svg>
  );
};

interface Props {}

const FileExpansion: React.FC<Props> = () => {
  const [isExpanded, setIsExpanded] = useState(true);

  const selected = useSelector(
    (state: RootState) => state.fileexplorer.selected,
  );
  const hasSelection = selected !== null;

  const edges = useSelector((state: RootState) => state.graph.edges);
  const incomingEdges = Object.values(edges).filter(
    (edge) => edge.target === selected && edge.source !== selected,
  );
  const outgoingEdges = Object.values(edges).filter(
    (edge) => edge.source === selected && edge.target !== selected,
  );

  const imports: { [key: string]: number } = {};

  outgoingEdges
    .map((e) => e.snippets.map((s) => s.text))
    .flat()
    .forEach((text) => {
      if (!imports[text]) {
        imports[text] = 0;
      }
      imports[text]++;
    });

  const exports: { [key: string]: number } = {};

  incomingEdges
    .map((e) => e.snippets.map((s) => s.displayName))
    .flat()
    .forEach((name) => {
      if (!exports[name]) {
        exports[name] = 0;
      }
      exports[name]++;
    });

  // const imports = [
  //   "from pipx.emojis import EMOJI_SUPPORT",
  //   "from pipx.emojis import EMOJI_SUPPORT",
  //   "from pipx.emojis import EMOJI_SUPPORT",
  //   "from pipx.emojis import EMOJI_SUPPORT",
  //   "from pipx.emojis import EMOJI_SUPPORT",
  //   "from pipx.emojis import EMOJI_SUPPORT",
  //   "from pipx.emojis import EMOJI_SUPPORT",
  //   "from pipx.emojis import EMOJI_SUPPORT",
  //   "from pipx.emojis import EMOJI_SUPPORT",
  //   "from pipx.emojis import EMOJI_SUPPORT",
  //   "from pipx.emojis import EMOJI_SUPPORT",
  //   "from pipx.emojis import EMOJI_SUPPORT",
  //   "from pipx.emojis import EMOJI_SUPPORT",
  //   "from pipx.emojis import EMOJI_SUPPORT",
  //   "from pipx.emojis import EMOJI_SUPPORT",
  //   "from pipx.emojis import EMOJI_SUPPORT",
  //   "from pipx.emojis import EMOJI_SUPPORT",
  //   "from pipx.emojis import EMOJI_SUPPORT",
  //   "from pipx.emojis import EMOJI_SUPPORT",
  //   "from pipx.emojis import EMOJI_SUPPORT",
  //   "from pipx.emojis import EMOJI_SUPPORT",
  //   "from pipx.emojis import EMOJI_SUPPORT",
  //   "from pipx.emojis import EMOJI_SUPPORT",
  //   "from pipx.emojis import EMOJI_SUPPORT",
  //   "from pipx.emojis import EMOJI_SUPPORT",
  //   "from pipx.emojis import EMOJI_SUPPORT",
  //   "from pipx.emojis import EMOJI_SUPPORT",
  // ];

  // const exports = [
  //   "show_cursor",
  //   "hide_cursor",
  //   "animate",
  //   "animate",
  //   "animate",
  //   "animate",
  //   "animate",
  //   "animate",
  //   "animate",
  //   "animate",
  //   "animate",
  //   "animate",
  //   "animate",
  //   "animate",
  //   "animate",
  //   "animate",
  //   "animate",
  //   "animate",
  //   "animate_this_really_long_and_badly_named_function",
  // ];

  return (
    <>
      <div id="file-expansion-container" className="relative mt-4 ml-[-1rem]">
        <div
          id="floating-window-file-expansion-expand-button"
          className={clsx([
            isExpanded && "hidden",
            !isExpanded &&
              "flex pl-4 h-10 items-center justify-center border-zinc-800 bg-stone-50 drop-shadow",
          ])}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <ChevronRight />
        </div>
        <div
          id="floating-window-file-expansion"
          className={clsx([!isExpanded && "hidden", isExpanded && "flex"])}
        >
          <div
            id="floating-window-file-expansion-contents"
            className="flex flex-col h-[80vh] max-h-max w-96 pl-6 pr-2 border-zinc-800 drop-shadow opacity-95 backdrop-blur-2xl bg-stone-50"
          >
            {!hasSelection && (
              <div className="flex">
                <Text>Select a file to see details.</Text>
              </div>
            )}
            {hasSelection && (
              <div className="flex flex-col h-full">
                <Text className="p-2">
                  <Strong className="">{selected}</Strong>
                </Text>
                <Text className="bg-stone-200/80 rounded-md p-1 px-2">
                  <Strong>Imports</Strong>
                </Text>
                <div className="flex-1 text-nowrap overflow-auto my-2 px-2">
                  {Object.entries(imports).map(([imp, count], i) => (
                    <div key={i}>
                      <Text>
                        ({count}) <Code>{imp}</Code>
                      </Text>
                    </div>
                  ))}
                </div>
                <Text className="bg-stone-200/80 rounded-md p-1 px-2">
                  <Strong>Exports</Strong>
                </Text>
                <div className="flex-1 text-nowrap overflow-auto my-2 px-2">
                  {Object.entries(exports).map(([exp, count], i) => (
                    <div key={i}>
                      <Text>
                        ({count}) <Code>{exp}</Code>
                      </Text>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div
            id="floating-window-file-expansion-collapse-button"
            className="flex h-10 items-center justify-center border-zinc-800 bg-stone-50 drop-shadow"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <ChevronLeft />
          </div>
        </div>
      </div>
    </>
  );
};

export default FileExpansion;
