import clsx from "clsx";

import { useSelector } from "react-redux";

import { isMetaOrCtrl } from "../../lib/isMetaOrCtrl";
import { RootState } from "../../store";

export const ShiftAltCtrlButtons: React.FC = () => {
  const isShift = useSelector((state: RootState) => state.keyboard.isShift);
  const isAlt = useSelector((state: RootState) => state.keyboard.isAlt);
  const isCtrl = useSelector(isMetaOrCtrl);

  const Circle: React.FC<{ isToggled: boolean; toggleColor: string }> = ({
    isToggled,
    toggleColor,
  }) => {
    return (
      <div className="flex flex-col">
        <div
          className={clsx(
            "w-4 h-4 rounded-full ring-inset shadow-inner transition-all duration-300",
            isToggled ? toggleColor : "hidden",
          )}
        ></div>
      </div>
    );
  };

  return (
    <div
      id="floating-window-bottom-left"
      className="absolute z-20 bottom-0 left-0 ml-4 mb-4 flex"
    >
      <div
        id="shift-alt-ctrl-button-container"
        className="relative p-2 flex gap-2"
      >
        <Circle
          isToggled={isShift}
          toggleColor="bg-orange-200/50 ring-orange-300"
        />
        <Circle
          isToggled={isAlt}
          toggleColor="bg-orange-400/40 ring-orange-500"
        />
        <Circle
          isToggled={isCtrl}
          toggleColor="bg-orange-600/30 ring-red-700"
        />
      </div>
    </div>
  );
};
