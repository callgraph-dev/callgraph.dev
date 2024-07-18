# callgraph-dev README

![Demo](https://marketing.callgraph.dev/export-type-hierarchy-2.gif)


Generate interactive graph visualizations from your code.

This extension uses language servers to discover relationships between symbols.

## Features

### 1. Draw call graph for file/folder.

- Only includes symbols that are defined in the file/folder (including subfolders). 
- Calls to builtin language features or 3rd party packages are currently ignored.


### 2. Draw type hierarchy for file/folder:

- Only includes symbols that are defined in the file/folder (including subfolders). 
- Types defined by the language or 3rd party packages are currently ignored.

### 3. Expand call graph for symbol.

- Recursively graph all the callers and callees of a symbol.

### 4. Expand type hierarchy for symbol.

- Recursively graph all the supertypes and subtypes of a symbol.

## Actions
- cmd+click (ctrl+click on Windows) to Go to Definition.
- (coming soon) shift+click to expand a node by depth 1.


## Limitations

- Currently, only tested against Python codebases using Pylance language server.
- Large codebases will often look like spaghetti. Consider graphing deeply nested folders 