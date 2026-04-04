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

export function paintEntraRadar(doc, level) {
  const fill = doc.getElementById("entra-arc-fill");
  const needle = doc.getElementById("entra-needle");
  const label = doc.getElementById("entra-radar-label");

  if (!fill || !needle || !label) {
    return;
  }

  if (level === "safe") {
    fill.setAttribute("stroke", "#4ade80");
    fill.setAttribute("stroke-dashoffset", "0");
    needle.setAttribute("x2", "20");
    needle.setAttribute("y2", "90");
    needle.setAttribute("stroke", "#4ade80");
    label.textContent = "MFA ENABLED - HARDENED";
    label.className = "entra-radar-label entra-label-ok";
    return;
  }

  if (level === "risk") {
    fill.setAttribute("stroke", "#f87171");
    fill.setAttribute("stroke-dashoffset", "0");
    needle.setAttribute("x2", "140");
    needle.setAttribute("y2", "90");
    needle.setAttribute("stroke", "#f87171");
    label.textContent = "MFA DISABLED - CRITICAL RISK";
    label.className = "entra-radar-label entra-label-crit";
    return;
  }

  fill.setAttribute("stroke", "#7e96ad");
  fill.setAttribute("stroke-dashoffset", "102");
  needle.setAttribute("x2", "80");
  needle.setAttribute("y2", "30");
  needle.setAttribute("stroke", "#7e96ad");
  label.textContent = "AWAITING PAYLOAD";
  label.className = "entra-radar-label";
}

export function renderEntraConsole(doc, messages) {
  const list = doc.getElementById("entra-console");
  if (!list) {
    return;
  }

  list.textContent = "";

  (messages || []).forEach((entry) => {
    const li = doc.createElement("li");
    const ts = new Date().toLocaleTimeString("es-ES", { hour12: false });
    li.className = "entra-console-line entra-console-" + (entry.level || "info");
    li.textContent = "[" + ts + "] " + String(entry.message || "");
    list.appendChild(li);
  });
}

export function renderEntraRemediationPanel(doc, model) {
  const codeEl = doc.getElementById("entra-remediation-code");
  const copyBtn = doc.getElementById("entra-copy-fix");
  const scoreEl = doc.getElementById("entra-risk-score");
  const hasFix = Boolean(model && model.hasFix);
  const riskScore = typeof model?.riskScore === "number" ? model.riskScore : null;
  const radarLevel = model?.radarLevel || "neutral";

  if (codeEl) {
    codeEl.textContent = hasFix
      ? String(model.terraformFix || "")
      : "# No remediation generated.\n# Identity object passed or has indeterminate posture.";
  }

  if (copyBtn) {
    copyBtn.disabled = !hasFix;
    copyBtn.textContent = "[COPY FIX TO CLIPBOARD]";
  }

  if (scoreEl) {
    scoreEl.textContent = riskScore === null ? "Risk Score: N/A" : "Risk Score: " + riskScore + "/100";
    scoreEl.className = "entra-risk-score " + (radarLevel === "risk" ? "is-risk" : radarLevel === "safe" ? "is-safe" : "is-neutral");
  }
}

export async function copyTextToClipboard(text) {
  const value = String(text || "").trim();
  if (!value) {
    return false;
  }

  if (navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(value);
    return true;
  }

  const temp = document.createElement("textarea");
  temp.value = value;
  document.body.appendChild(temp);
  temp.select();
  const copied = document.execCommand("copy");
  temp.remove();
  return Boolean(copied);
}
