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

function getNodeColor(node) {
  if (node.type === "user") return "#60a5fa"; // accent blue
  if (node.type === "role") return "#facc15"; // warn yellow
  if (node.type === "resource") return "#7e96ad"; // muted teal
  if (node.type === "exposure") return "#f87171"; // critical red
  return "#60a5fa";
}

async function renderD3Graph(container, graph, onNodeClick) {
  if (!window.d3) {
    renderSvgGraph(container, graph, onNodeClick);
    return;
  }

  const d3 = window.d3;
  const width = container.clientWidth || 420;
  const height = 320;

  // Clear container and create SVG
  container.textContent = "";
  const svg = d3.select(container)
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("class", "d3-attack-graph");

  // Create defs for gradient marker style
  svg.append("defs")
    .append("marker")
    .attr("id", "arrowhead")
    .attr("markerWidth", "10")
    .attr("markerHeight", "10")
    .attr("refX", "9")
    .attr("refY", "3")
    .attr("orient", "auto")
    .append("polygon")
    .attr("points", "0 0, 10 3, 0 6")
    .attr("fill", "#607080");

  // Create node and link arrays (clone to avoid modifying original)
  const nodes = graph.nodes.map((n) => ({ ...n }));
  const links = graph.edges.map((e) => ({ source: e.source, target: e.target }));

  // Force simulation
  const simulation = d3
    .forceSimulation(nodes)
    .force(
      "link",
      d3.forceLink(links)
        .id((d) => d.id)
        .distance(80)
        .strength(0.1)
    )
    .force("charge", d3.forceManyBody().strength(-300))
    .force("center", d3.forceCenter(width / 2, height / 2));

  // Link rendering (edges)
  const linkGroup = svg
    .append("g")
    .attr("class", "links")
    .selectAll("line")
    .data(links)
    .enter()
    .append("line")
    .attr("stroke", "#607080")
    .attr("stroke-width", 1.5)
    .attr("marker-end", "url(#arrowhead)");

  // Node rendering
  const nodeGroup = svg
    .append("g")
    .attr("class", "nodes")
    .selectAll("g")
    .data(nodes)
    .enter()
    .append("g")
    .attr("class", "node")
    .call(
      d3
        .drag()
        .on("start", (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("end", (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        })
    );

  // Node circles
  nodeGroup
    .append("circle")
    .attr("r", 12)
    .attr("fill", (d) => getNodeColor(d))
    .attr("stroke", "#fff")
    .attr("stroke-width", 1.5)
    .attr("class", "node-circle");

  // Node labels
  nodeGroup
    .append("text")
    .attr("x", 0)
    .attr("y", 25)
    .attr("text-anchor", "middle")
    .attr("fill", "#e0e0e0")
    .attr("font-size", "9")
    .attr("class", "node-label")
    .text((d) => d.label.slice(0, 12));

  // Node click handler
  nodeGroup.on("click", (event, d) => {
    event.stopPropagation();
    onNodeClick(d);
  });

  nodeGroup.style("cursor", "pointer");

  // Update positions on each tick
  simulation.on("tick", () => {
    linkGroup
      .attr("x1", (d) => d.source.x)
      .attr("y1", (d) => d.source.y)
      .attr("x2", (d) => d.target.x)
      .attr("y2", (d) => d.target.y);

    nodeGroup.attr("transform", (d) => "translate(" + d.x + "," + d.y + ")");
  });
}

export function renderAttackGraph(container, graph, onNodeClick) {
  // Use D3.js force-directed graph if available, otherwise fallback to static SVG
  renderD3Graph(container, graph, onNodeClick).catch(() => {
    renderSvgGraph(container, graph, onNodeClick);
  });
}
