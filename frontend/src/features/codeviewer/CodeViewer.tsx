import hljs from "highlight.js/lib/core";
import python from "highlight.js/lib/languages/python";
import javascript from "highlight.js/lib/languages/typescript";
import typescript from "highlight.js/lib/languages/typescript";
import React from "react";

import "highlight.js/styles/github.css";
import { Snippet } from "../../lib/graph";

// Keep in sync with client/src/features/graph/graphSlice.ts
hljs.registerLanguage("python", python);
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("typescript", typescript);

interface CodeSnippetProps {
  lineNumber: number | null;
  code: string;
  language: string;
}

const CodeSnippet: React.FC<CodeSnippetProps> = ({
  lineNumber,
  code,
  language,
}) => {
  const highlightedCode = hljs.highlight(code, { language }).value;
  return (
    <div>
      {lineNumber && <span className="text-gray-300 pr-4">{lineNumber}</span>}
      <span dangerouslySetInnerHTML={{ __html: highlightedCode }}></span>
    </div>
  );
};

interface CodeViewerProps {
  snippets: Snippet[];
  language: string;
}

const CodeViewer: React.FC<CodeViewerProps> = ({ snippets, language }) => {
  const uniqueSnippets = snippets.filter(
    (snippet, i) =>
      snippets.findIndex((s) => s.lineno === snippet.lineno) === i,
  );
  return (
    <div id="code-viewer">
      <div className="flex max-w-fit flex-col rounded-lg border-4 border-slate-700 bg-slate-700 py-2 pl-2 pr-4 font-mono text-sm text-white">
        {uniqueSnippets.map((snippet, i) => (
          <CodeSnippet
            key={i}
            lineNumber={snippet.lineno}
            code={snippet.text}
            language={language}
          />
        ))}
      </div>
    </div>
  );
};

export const PlainTextViewer: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <div className="flex max-w-fit flex-col rounded-lg border border-slate-700 bg-white py-2 pl-2 pr-4 text-sm ">
      {children}
    </div>
  );
};

export default CodeViewer;