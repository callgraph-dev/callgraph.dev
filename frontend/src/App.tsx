import ComboBox from "./features/cmdpal/ComboBox";
import MouseContextMenu from "./features/contextmenu/ContextMenu";
import Debug from "./features/debug/Debug";
import Fileexplorer from "./features/fileexplorer/Fileexplorer";
import StatusKeyPolling from "./features/fileexplorer/StatusKeyPolling";
import Graph from "./features/graph/Graph";
import Keyboard from "./features/keyboard/Keyboard";
import ToastManager from "./features/toast/Toastmanager";
import HideableMouseTooltip from "./features/tooltip/Tooltip";
import VscodeExt from "./features/vscodeext/VscodeExt";
import { checkFeature } from "./lib/featureflags";

window.addEventListener("error", (event) => {
  console.error("Uncaught error:", event);
});

window.addEventListener("unhandledrejection", (event) => {
  console.error("Uncaught promise error:", event);
});

const App = () => {
  // @ts-expect-error - injected by esbuild
  const serverUrl: string = process.env.SERVER_URL;
  const isDebug = serverUrl.includes("localhost");

  return (
    <div>
      {isDebug && !checkFeature("vscodeext") && <Debug />}
      <Graph></Graph>
      {checkFeature("fileexplorer") && (
        <div id="layout-header" className="relative">
          <ComboBox />
        </div>
      )}
      {checkFeature("fileexplorer") && (
        <div id="layout-left-sidebar" className="relative">
          <Fileexplorer />
        </div>
      )}
      <HideableMouseTooltip />
      <ToastManager />
      <StatusKeyPolling />
      <Keyboard />
      <MouseContextMenu />
      {checkFeature("vscodeext") && <VscodeExt />}
    </div>
  );
};

export default App;
