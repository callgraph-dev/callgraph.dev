Frontend client for the callgraph.dev extension.

The frontend displays the callgraph as a visual, interactive graph.
It uses cytoscape to draw the graph and dagre.js to layout the graph as a DAG.

The majority of the non-cytoscape state lives in Redux. React components are
overlaid on top of the cytoscape graph.

The frontend communicates with the backend vscode extension using the VsCodeExt.ts component.