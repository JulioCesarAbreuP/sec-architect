export function renderZeroTrustScore(container, score) {
  const normalized = Math.max(0, Math.min(100, Number(score || 0)));
  const state = normalized >= 80 ? "Healthy" : normalized >= 50 ? "Degraded" : "Critical";
  container.textContent = normalized.toFixed(0) + " / 100 (" + state + ")";
}

export function renderGaugeScore(container, score, label = "Zero Trust Score") {
  const normalized = Math.max(0, Math.min(100, Number(score || 0)));
  const state = normalized >= 80 ? "Healthy" : normalized >= 50 ? "Degraded" : "Critical";
  const stateColor = normalized >= 80 ? "#4ade80" : normalized >= 50 ? "#facc15" : "#f87171";

  // Clear container
  container.textContent = "";

  // Create gauge SVG
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("width", "120");
  svg.setAttribute("height", "140");
  svg.setAttribute("viewBox", "0 0 120 140");
  svg.setAttribute("class", "gauge-svg");

  // Background arc (full circle path)
  const bgCircle = document.createElementNS(ns, "circle");
  bgCircle.setAttribute("cx", "60");
  bgCircle.setAttribute("cy", "70");
  bgCircle.setAttribute("r", "50");
  bgCircle.setAttribute("fill", "none");
  bgCircle.setAttribute("stroke", "#2d3e4d");
  bgCircle.setAttribute("stroke-width", "6");
  svg.appendChild(bgCircle);

  // Progress arc (animated path based on score)
  // Arc from 180 deg to (180 - score*1.8) deg = 0-180 range represents 0-100 score
  const startAngle = Math.PI; // 180 degrees (left side)
  const endAngle = Math.PI - (normalized / 100) * Math.PI; // sweep to right based on score
  const startX = 60 + 50 * Math.cos(startAngle);
  const startY = 70 + 50 * Math.sin(startAngle);
  const endX = 60 + 50 * Math.cos(endAngle);
  const endY = 70 + 50 * Math.sin(endAngle);
  const largeArc = normalized > 50 ? 0 : 1;

  const pathD = `M ${startX} ${startY} A 50 50 0 ${largeArc} 1 ${endX} ${endY}`;

  const progressArc = document.createElementNS(ns, "path");
  progressArc.setAttribute("d", pathD);
  progressArc.setAttribute("fill", "none");
  progressArc.setAttribute("stroke", stateColor);
  progressArc.setAttribute("stroke-width", "6");
  progressArc.setAttribute("stroke-linecap", "round");
  progressArc.setAttribute("class", "gauge-arc");
  svg.appendChild(progressArc);

  // Center text: score value
  const scoreText = document.createElementNS(ns, "text");
  scoreText.setAttribute("x", "60");
  scoreText.setAttribute("y", "65");
  scoreText.setAttribute("text-anchor", "middle");
  scoreText.setAttribute("font-size", "22");
  scoreText.setAttribute("font-weight", "bold");
  scoreText.setAttribute("fill", stateColor);
  scoreText.textContent = Math.round(normalized);
  svg.appendChild(scoreText);

  // State label below gauge
  const labelText = document.createElementNS(ns, "text");
  labelText.setAttribute("x", "60");
  labelText.setAttribute("y", "115");
  labelText.setAttribute("text-anchor", "middle");
  labelText.setAttribute("font-size", "11");
  labelText.setAttribute("fill", "#a0a8b0");
  labelText.textContent = state;
  svg.appendChild(labelText);

  container.appendChild(svg);

  // Title/label below
  const titleEl = document.createElement("div");
  titleEl.style.textAlign = "center";
  titleEl.style.fontSize = "9px";
  titleEl.style.color = "#7e96ad";
  titleEl.style.marginTop = "4px";
  titleEl.textContent = label;
  container.appendChild(titleEl);
}

export function renderScoreBreakdown(container, breakdown) {
  // Render a breakdown of score components
  if (!container) return;
  if (typeof breakdown !== "object" || !breakdown) {
    container.textContent = "No breakdown data.";
    return;
  }

  container.textContent = "";

  const entries = Object.entries(breakdown);
  if (entries.length === 0) {
    container.textContent = "No components.";
    return;
  }

  const grid = document.createElement("div");
  grid.style.display = "grid";
  grid.style.gridTemplateColumns = "1fr 1fr";
  grid.style.gap = "8px";

  entries.forEach(([name, value]) => {
    const componentEl = document.createElement("div");
    componentEl.style.borderLeft = "3px solid #60a5fa";
    componentEl.style.paddingLeft = "6px";
    componentEl.style.paddingRight = "6px";
    componentEl.style.paddingTop = "4px";
    componentEl.style.paddingBottom = "4px";
    componentEl.style.backgroundColor = "#1a2530";
    componentEl.style.borderRadius = "3px";

    const nameEl = document.createElement("div");
    nameEl.style.fontSize = "9px";
    nameEl.style.color = "#7e96ad";
    nameEl.style.marginBottom = "2px";
    nameEl.textContent = name;
    componentEl.appendChild(nameEl);

    const valueEl = document.createElement("div");
    valueEl.style.fontSize = "14px";
    valueEl.style.fontWeight = "bold";
    valueEl.style.color = "#e0e0e0";
    valueEl.textContent = value + "%";
    componentEl.appendChild(valueEl);

    const barEl = document.createElement("div");
    barEl.style.width = "100%";
    barEl.style.height = "3px";
    barEl.style.backgroundColor = "#0d141a";
    barEl.style.marginTop = "3px";
    barEl.style.borderRadius = "2px";
    barEl.style.overflow = "hidden";

    const fillEl = document.createElement("div");
    fillEl.style.width = value + "%";
    fillEl.style.height = "100%";
    fillEl.style.backgroundColor = value >= 70 ? "#4ade80" : value >= 40 ? "#facc15" : "#f87171";
    barEl.appendChild(fillEl);
    componentEl.appendChild(barEl);

    grid.appendChild(componentEl);
  });

  container.appendChild(grid);
}
