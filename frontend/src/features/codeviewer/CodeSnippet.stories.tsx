import type { Story } from "@ladle/react";

import CodeSnippet, { CodeSnippetProps } from "./CodeSnippet";

export const CodeSnippetStory: Story<CodeSnippetProps> = (props) => (
  <CodeSnippet {...props} />
);

CodeSnippetStory.args = {
  code: "from math import add",
  lineNumber: 13,
  language: "python",
};
