export function appendSocLog(consoleEl, message, tone = "info") {
  const line = document.createElement("div");
  line.className = "console-line tone-" + tone;
  line.textContent = "[" + new Date().toISOString().slice(11, 19) + "] " + message;
  consoleEl.appendChild(line);
  consoleEl.scrollTop = consoleEl.scrollHeight;
}

export function renderJson(pre, value) {
  pre.textContent = JSON.stringify(value, null, 2);
}

export function renderCode(pre, code) {
  pre.textContent = String(code || "");
}

export function updateStatus(statusEl, rootEl, risk) {
  const score = Number(risk || 0);
  statusEl.classList.remove("status-healthy", "status-degraded", "status-critical");
  rootEl.classList.remove("risk-low", "risk-high", "risk-critical");

  if (score >= 80) {
    statusEl.textContent = "CRITICAL";
    statusEl.setAttribute("aria-label", "Estado del comando: critico");
    statusEl.classList.add("status-critical");
    rootEl.classList.add("risk-critical");
    return "critical";
  }
  if (score >= 50) {
    statusEl.textContent = "DEGRADED";
    statusEl.setAttribute("aria-label", "Estado del comando: degradado");
    statusEl.classList.add("status-degraded");
    rootEl.classList.add("risk-high");
    return "degraded";
  }

  statusEl.textContent = "HEALTHY";
  statusEl.setAttribute("aria-label", "Estado del comando: saludable");
  statusEl.classList.add("status-healthy");
  rootEl.classList.add("risk-low");
  return "healthy";
}

export function ensureRadarChart(canvasEl) {
  if (!canvasEl || typeof window.Chart !== "function") {
    return null;
  }

  return new window.Chart(canvasEl.getContext("2d"), {
    type: "radar",
    data: {
      labels: ["Probability", "Exposure", "Identity", "Remediation", "Stability"],
      datasets: [
        {
          label: "Threat Profile",
          data: [18, 22, 16, 35, 70],
          borderColor: "rgba(125, 227, 244, 1)",
          backgroundColor: "rgba(125, 227, 244, 0.2)"
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          min: 0,
          max: 100,
          ticks: { display: false },
          grid: { color: "rgba(255,255,255,0.12)" },
          angleLines: { color: "rgba(255,255,255,0.12)" },
          pointLabels: { color: "#c5d0da" }
        }
      },
      plugins: { legend: { labels: { color: "#f4fbff" } } }
    }
  });
}

export function updateRadar(chart, probability) {
  if (!chart) return;
  const p = Math.max(1, Math.min(99, Number(probability || 1)));
  chart.data.datasets[0].data = [p, Math.min(100, p + 7), Math.min(100, p + 5), Math.max(1, 100 - p), Math.max(1, 100 - p * 0.7)];
  chart.update();
}
