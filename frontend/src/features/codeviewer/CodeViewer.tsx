import { Snippet } from "../../shared/graph";

import CodeSnippet from "./CodeSnippet";

export interface CodeViewerProps {
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
      Sup
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
