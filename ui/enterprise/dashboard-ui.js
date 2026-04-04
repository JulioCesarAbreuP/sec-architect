export function setStatusChip(element, riskScore) {
  const score = Number(riskScore || 0);
  element.classList.remove("status-healthy", "status-degraded", "status-critical");

  if (score >= 80) {
    element.textContent = "CRITICAL";
    element.classList.add("status-critical");
    return "critical";
  }
  if (score >= 50) {
    element.textContent = "DEGRADED";
    element.classList.add("status-degraded");
    return "degraded";
  }

  element.textContent = "HEALTHY";
  element.classList.add("status-healthy");
  return "healthy";
}

export function appendConsoleLine(container, line, tone) {
  const item = document.createElement("div");
  item.className = "console-line tone-" + (tone || "info");
  item.textContent = "[" + new Date().toISOString().slice(11, 19) + "] " + line;
  container.appendChild(item);
  container.scrollTop = container.scrollHeight;
}

export function renderJson(container, value) {
  container.textContent = JSON.stringify(value, null, 2);
}

export function setPanelRiskMotion(root, state) {
  root.classList.remove("risk-low", "risk-high", "risk-critical");
  if (state === "critical") {
    root.classList.add("risk-critical");
    return;
  }
  if (state === "degraded") {
    root.classList.add("risk-high");
    return;
  }
  root.classList.add("risk-low");
}
