interface HeightAndWidth {
  height: number;
  width: number;
}

function getHeightAndWidth(node: cytoscape.NodeSingular): HeightAndWidth {
  /**
    Calculate the width of a node given its text label `node.data('lbl')`
    */

  const heightPadding = 0;
  const widthPadding = 10;

  // Hardcoded values taken from `cy.nodes()[0].style()`
  const fStyle = "normal";
  const size = "14px";
  const family = "Helvetica Neue, Helvetica, sans-serif";
  const weight = "normal";

  const lines = node.data("displayName").split("\n");
  const lengths = lines.map((a) => a.length);
  const max_line = lengths.indexOf(Math.max(...lengths));

  const ctx = document.createElement("canvas").getContext("2d");
  ctx!.font = fStyle + " " + weight + " " + size + " " + family;
  const measureText = ctx!.measureText(lines[max_line]);

  const height =
    measureText.fontBoundingBoxAscent +
    measureText.fontBoundingBoxDescent +
    heightPadding;
  const width = measureText.width + widthPadding;

  return {
    height,
    width,
  };
}

export default getHeightAndWidth;
