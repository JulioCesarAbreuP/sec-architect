function renderSvgGraph(container, graph, onNodeClick) {
  const width = container.clientWidth || 420;
  const height = 220;

  const positions = {
    n1: { x: 35, y: 110 },
    n2: { x: 125, y: 60 },
    n3: { x: 220, y: 110 },
    n4: { x: 315, y: 60 },
    n5: { x: 405, y: 110 }
  };

  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("width", String(width));
  svg.setAttribute("height", String(height));
  svg.setAttribute("viewBox", "0 0 440 220");

  for (const edge of graph.edges) {
    const line = document.createElementNS(ns, "line");
    line.setAttribute("x1", String(positions[edge.source].x));
    line.setAttribute("y1", String(positions[edge.source].y));
    line.setAttribute("x2", String(positions[edge.target].x));
    line.setAttribute("y2", String(positions[edge.target].y));
    line.setAttribute("stroke", "#607080");
    line.setAttribute("stroke-width", "1.8");
    svg.appendChild(line);
  }

  for (const node of graph.nodes) {
    const g = document.createElementNS(ns, "g");
    g.setAttribute("transform", "translate(" + positions[node.id].x + "," + positions[node.id].y + ")");
    g.style.cursor = "pointer";

    const circle = document.createElementNS(ns, "circle");
    circle.setAttribute("r", "17");
    circle.setAttribute("fill", "#1f2a35");
    circle.setAttribute("stroke", "#7de3f4");
    circle.setAttribute("stroke-width", "1.4");

    const label = document.createElementNS(ns, "text");
    label.setAttribute("x", "0");
    label.setAttribute("y", "30");
    label.setAttribute("fill", "#e0e0e0");
    label.setAttribute("text-anchor", "middle");
    label.setAttribute("font-size", "8");
    label.textContent = node.label.slice(0, 16);

    g.appendChild(circle);
    g.appendChild(label);
    g.addEventListener("click", () => onNodeClick(node));
    svg.appendChild(g);
  }

  container.textContent = "";
  container.appendChild(svg);
}

export function renderAttackGraph(container, graph, onNodeClick) {
  // If a graph library is later loaded globally, this fallback can be replaced.
  renderSvgGraph(container, graph, onNodeClick);
}
