import React from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";

import App from "./src/App";
import { store } from "./src/store";

const container = document.getElementById("react-root");
const root = createRoot(container!);
root.render(<Provider store={store} children={<App />}></Provider>);
