import { RootState } from "../store";

export const isMetaOrCtrl = (state: RootState): boolean => {
  const isMac = window.navigator.userAgent.includes("Mac") ?? false;
  if (isMac && state.keyboard.isMeta) {
    return true;
  } else if (!isMac && state.keyboard.isCtrl) {
    return true;
  }
  return false;
};
