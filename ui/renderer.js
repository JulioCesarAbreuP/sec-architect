export function renderStatusBadge(element, statusLabel, tone) {
  if (!element) {
    return;
  }

  element.textContent = statusLabel;
  element.className = "status-badge status-" + tone;
}

export function renderResultBox(element, title, payload) {
  if (!element) {
    return;
  }

  const safePayload = typeof payload === "string" ? payload : JSON.stringify(payload, null, 2);
  element.textContent = "";

  const heading = document.createElement("h3");
  heading.textContent = title;

  const pre = document.createElement("pre");
  pre.textContent = safePayload;

  element.appendChild(heading);
  element.appendChild(pre);
}

export function renderMitreFindings(element, findings) {
  if (!element) {
    return;
  }

  element.textContent = "";

  const heading = document.createElement("h3");
  heading.textContent = "MITRE Findings";
  element.appendChild(heading);

  if (!findings || !findings.length) {
    const empty = document.createElement("p");
    empty.textContent = "Sin hallazgos.";
    element.appendChild(empty);
    return;
  }

  const list = document.createElement("ul");
  list.className = "finding-list";

  findings.forEach((item) => {
    const row = document.createElement("li");
    const strong = document.createElement("strong");
    const severity = document.createElement("span");
    const message = document.createElement("p");

    strong.textContent = item.techniqueId || "N/A";
    severity.textContent = String(item.severity || "info").toUpperCase();
    message.textContent = item.message || "Sin descripcion";

    row.appendChild(strong);
    row.appendChild(severity);
    row.appendChild(message);
    list.appendChild(row);
  });

  element.appendChild(list);
}
