import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import { AppDispatch, RootState } from "../../store";
import { initializeCytoscape } from "../cytoscape/cytoscapeSlice";

import { setGraphLanguage } from "./graphSlice";

const Graph: React.FC = () => {
  const dispatch: AppDispatch = useDispatch();
  const nodes = useSelector((state: RootState) => state.graph.nodes);
  const edges = useSelector((state: RootState) => state.graph.edges);
  const expandedFolders = useSelector(
    (state: RootState) => state.graph.expandedFolders,
  );
  const language = useSelector((state: RootState) => state.graph.language);

  useEffect(() => {
    console.log("re-init cytoscape");
    dispatch(
      initializeCytoscape({
        nodes: Object.values(nodes),
        edges: Object.values(edges),
        expandedFolders,
      }),
    );
  }, [dispatch, nodes, edges, expandedFolders]);

  useEffect(() => {
    if (language) {
      dispatch(setGraphLanguage(language));
    }
  }, [dispatch, language]);

  return <div></div>;
};

export default Graph;
