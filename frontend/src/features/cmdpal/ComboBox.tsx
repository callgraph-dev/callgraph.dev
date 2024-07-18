import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { Text } from "../../components/Text";
import { AppDispatch, RootState } from "../../store";
import {
  scheduleGraph,
  filterNodesByText,
  redrawGraph,
} from "../graph/graphSlice";

import { blurCommandPalette, focusCommandPalette } from "./cmdpalSlice";
import LoadingBar from "./LoadingBar";

interface UpdateStateEffect {
  type: "updatestate";
  choices: string[];
  placeholder: string;
  shouldFilterChoices: boolean;
}

interface FireEventEffect {
  type: "fireevent";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  action: (data: any) => any;
}

type Effect = UpdateStateEffect | FireEventEffect;

const firstLoadChoices = [
  "Graph: Redraw",
  "Graph: Use new repository...",
  "Graph: Filter nodes by name...",
  "Debug: Quick load graph",
];

const allEffects: { [key: string]: Effect } = {
  "Graph: Redraw": {
    type: "fireevent",
    action: () => redrawGraph(),
  },
  "Graph: Use new repository...": {
    type: "updatestate",
    choices: ["Graph: Load repository from URL"],
    placeholder: "Enter a GitHub URL (e.g. https://github.com/pypa/pipx.git)",
    shouldFilterChoices: false,
  },
  "Graph: Load repository from URL": {
    type: "fireevent",
    action: (url) => scheduleGraph(url),
  },
  "Graph: Filter nodes by name...": {
    type: "updatestate",
    choices: ["Graph: Execute filter nodes by name"],
    placeholder: "Text/Regex to filter nodes by (e.g. ^/src)",
    shouldFilterChoices: false,
  },
  "Graph: Execute filter nodes by name": {
    type: "fireevent",
    action: (filterText) => filterNodesByText(filterText),
  },
  "Debug: Quick load graph": {
    type: "fireevent",
    action: () => scheduleGraph("https://github.com/pypa/pipx"),
  },
};

// theres two things that can happen when a choice is selected
// 1. We can update the state of the combobox to reflect more choices
// 2. We can fire off an event and reset the state of the combobox

const ComboBox = () => {
  const [value, setValue] = useState("");
  const [choices, setChoices] = useState(firstLoadChoices);
  const [choicesForLevel, setChoicesForLevel] = useState(firstLoadChoices);
  const [shouldFilterChoices, setShouldFilterChoices] = useState(true);
  const [placeholder, setPlaceholder] = useState("Command Palette");
  const [highlighted, setHighlighted] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const ref = React.useRef<HTMLInputElement>(null);

  const dispatch: AppDispatch = useDispatch();
  const isFocused = useSelector((state: RootState) => state.cmdpal.isFocused);
  useEffect(() => {
    if (isFocused) {
      handleInputFocus();
    } else {
      handleInputBlur();
    }
  }, [isFocused]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        handleInputFocus();
      }
    };

    window.addEventListener("keydown", handler);

    return () => {
      window.removeEventListener("keydown", handler);
    };
  }, []);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      (event.target as HTMLInputElement).blur();
    }

    if (!isFocused) {
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlighted((prevHighlighted) =>
        prevHighlighted === 0 ? choices.length - 1 : prevHighlighted - 1,
      );
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlighted((prevHighlighted) =>
        prevHighlighted === choices.length - 1 ? 0 : prevHighlighted + 1,
      );
    } else if (event.key === "Enter") {
      event.preventDefault();
      executeEffect(choices[highlighted]);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setValue(newValue);
    if (isOpen) {
      if (shouldFilterChoices) {
        setChoices(
          choicesForLevel.filter((choice) =>
            choice.toLowerCase().includes(newValue.toLowerCase()),
          ),
        );
      }
      setHighlighted(0);
    }
  };

  const handleInputFocus = () => {
    setIsOpen(true);
    setPlaceholder("Type to filter commands");
    if (ref.current) {
      ref.current.focus();
    }
  };

  const handleInputBlur = () => {
    setValue("");
    // Choices is stored separately from choicesForLevel so we can recover if we've accidentally filtered to 0
    setChoices(firstLoadChoices);
    setChoicesForLevel(firstLoadChoices);
    setIsOpen(false);
    setHighlighted(0);
    setPlaceholder("Command Palette (⌘+K)");
    setShouldFilterChoices(true);
    if (ref.current) {
      ref.current.blur();
    }
  };

  const handleOptionOnClick = (event: React.MouseEvent, option: string) => {
    executeEffect(option);
  };

  const handleOptionMouseDown = (event: React.MouseEvent) => {
    // Prevent us from losing focus on the input
    event.preventDefault();
  };

  const executeEffect = (option: string) => {
    const effect = allEffects[option];
    if (effect == null) {
      console.warn("No effect for", option);
      return;
    }
    if (effect.type === "updatestate") {
      setChoices(effect.choices);
      setChoicesForLevel(effect.choices);
      setPlaceholder(effect.placeholder);
      setShouldFilterChoices(effect.shouldFilterChoices);
      setValue("");
    } else if (effect.type === "fireevent") {
      dispatch(effect.action(value));
      dispatch(blurCommandPalette());
    }
  };

  return (
    <div className="absolute z-30  w-full flex flex-col left-1/2 -translate-x-1/2 sm:w-3/4 p-1 sm:mt-4 lg:w-1/2">
      <input
        className={`w-full px-2 py-3 bg-stone-50 drop-shadow rounded-t-lg text-sm`}
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => dispatch(focusCommandPalette())}
        onBlur={() => dispatch(blurCommandPalette())}
        placeholder={placeholder}
        ref={ref}
      />
      <LoadingBar />
      <ul className={`w-full mt-1 border rounded-md ${isOpen ? "" : "hidden"}`}>
        {choices.map((option, index) => (
          <li
            key={index}
            onMouseDown={handleOptionMouseDown}
            onClick={(event) => handleOptionOnClick(event, option)}
            className={`py-1 pl-2 hover:cursor-pointer ${
              index === highlighted
                ? "bg-blue-500 text-white"
                : "bg-stone-50 hover:bg-gray-100"
            }`}
          >
            <Text isSelected={index === highlighted}>{option}</Text>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ComboBox;
