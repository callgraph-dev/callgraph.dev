import {
  Action,
  configureStore,
  Dispatch,
  MiddlewareAPI,
} from "@reduxjs/toolkit";

import cmdpalReducer from "./features/cmdpal/cmdpalSlice";
import contextMenuReducer from "./features/contextmenu/contextMenuSlice";
import counterReducer from "./features/counter/counterSlice";
import cytoscapeRedcuer from "./features/cytoscape/cytoscapeSlice";
import fileexplorerReducer from "./features/fileexplorer/fileexplorerSlice";
import graphReducer from "./features/graph/graphSlice";
import keyboardReducer from "./features/keyboard/keyboardSlice";
import pointerReducer from "./features/pointer/pointerSlice";
import toastReducer from "./features/toast/toastSlice";
import tooltipReducer from "./features/tooltip/tooltipSlice";
import vscodeextReducer from "./features/vscodeext/vscodeExtSlice";

const loggerMiddleware =
  (store: MiddlewareAPI<Dispatch, unknown>) =>
  (next: Dispatch) =>
  (action: Action) => {
    console.debug("Dispatching:", action);
    const result = next(action);
    console.debug("Next state:", store.getState());
    return result;
  };

export default loggerMiddleware;

export const store = configureStore({
  reducer: {
    cmdpal: cmdpalReducer,
    counter: counterReducer,
    contextmenu: contextMenuReducer,
    cytoscape: cytoscapeRedcuer,
    fileexplorer: fileexplorerReducer,
    graph: graphReducer,
    keyboard: keyboardReducer,
    pointer: pointerReducer,
    toast: toastReducer,
    tooltip: tooltipReducer,
    vscodeext: vscodeextReducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware(),
  // middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(loggerMiddleware),
});

// @ts-expect-error - window is a global variable
window.store = store;

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
