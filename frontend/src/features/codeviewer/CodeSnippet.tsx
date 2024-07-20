import { LanguageFn } from "highlight.js";
import hljs from "highlight.js/lib/core";
import python from "highlight.js/lib/languages/python";
import {
  default as javascript,
  default as typescript,
} from "highlight.js/lib/languages/typescript";

import "highlight.js/styles/github.css";
import { Language } from "../../shared/types";

// Define the mapped type for the object
type LanguageObjectType = {
  [K in Language]: LanguageFn;
};

// Create an object with all required keys
const languagesTypes: LanguageObjectType = {
  python: python,
  javascript: javascript,
  typescript: typescript,
};

Object.entries(languagesTypes).forEach(([key, value]) => {
  hljs.registerLanguage(key, value);
});

export interface CodeSnippetProps {
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

export default CodeSnippet;
