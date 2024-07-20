import type { Story } from "@ladle/react";

import CodeViewer, { CodeViewerProps } from "./CodeViewer";

export const CodeViewerStory: Story<CodeViewerProps> = (props) => (
  <CodeViewer {...props} />
);

CodeViewerStory.args = {
  snippets: [
    {
      displayName: "add()",
      lineno: 13,
      text: "from math import add",
    },
  ],
  language: "python",
};
