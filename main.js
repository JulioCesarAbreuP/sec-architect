import { runGraphInferenceEngine } from "./core/enterprise/inference-engine.js";
import { rememberAnalysis, buildContextNarrative } from "./core/enterprise/operational-memory.js";
import { createShadowMonitor } from "./core/enterprise/shadow-monitor.js";
import { loadArchitectureBoardDocs, answerArchitectureQuestion } from "./core/enterprise/architecture-board.js";
import { simulateAttack } from "./core/enterprise/attack-simulation.js";
import { decodeJwt, validateSc300Claims } from "./core/jwt-validator.js";
import { setStatusChip, appendConsoleLine, renderJson, setPanelRiskMotion } from "./ui/enterprise/dashboard-ui.js";
import { createIAPanelBindings } from "./ui/enterprise/panel-ia.js";
import { createJsonPanelBindings } from "./ui/enterprise/panel-json.js";
import { createJwtPanelBindings } from "./ui/enterprise/panel-jwt.js";

let radar = null;
let docsCache = [];
let lastAnalysisState = null;
let monitor = null;

function parseInputJson(rawText) {
  try {
    return { ok: true, value: JSON.parse(String(rawText || "")) };
  } catch (error) {
    return { ok: false, message: error.message };
  }
}

function ensureRadar() {
  if (radar) {
    return radar;
  }

  const canvas = document.getElementById("riskRadar");
  if (!canvas || typeof window.Chart !== "function") {
    return null;
  }

  const chart = new window.Chart(canvas.getContext("2d"), {
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
      plugins: { legend: { labels: { color: "#e0e0e0" } } },
      scales: {
        r: {
          min: 0,
          max: 100,
          ticks: { display: false },
          grid: { color: "rgba(255,255,255,0.12)" },
          angleLines: { color: "rgba(255,255,255,0.12)" },
          pointLabels: { color: "#9aa3ad" }
        }
      }
    }
  });

  radar = chart;
  return radar;
}

function updateRadarWithProbability(probability) {
  const chart = ensureRadar();
  if (!chart) {
    return;
  }

  const p = Math.max(1, Math.min(99, Number(probability || 1)));
  chart.data.datasets[0].data = [p, Math.min(100, p + 7), Math.min(100, p + 5), Math.max(0, 100 - p), Math.max(0, 100 - p * 0.7)];
  chart.update();
}

function setThreatState(riskScore) {
  const root = document.getElementById("enterpriseRoot");
  const status = document.getElementById("command-status");
  const banner = document.getElementById("threatEscalationBanner");
  const state = setStatusChip(status, riskScore);
  setPanelRiskMotion(root, state);

  const previousRisk = lastAnalysisState ? Number(lastAnalysisState.analysis.probability || 0) : 0;
  const escalated = Number(riskScore || 0) > previousRisk + 8;
  banner.hidden = !escalated;

  if (monitor) {
    monitor.updateRisk(riskScore);
  }
}

async function refreshArchitectureBoard() {
  docsCache = await loadArchitectureBoardDocs();
  const board = document.getElementById("architectureBoardContent");
  if (!docsCache.length) {
    board.innerHTML = "<p>No fue posible cargar ARCHITECTURE.md o ADRs.</p>";
    return;
  }

  const architectureDoc = docsCache.find((doc) => doc.path.includes("ARCHITECTURE.md")) || docsCache[0];
  board.innerHTML = architectureDoc.html;
}

export async function analyzeArchitectureWithAI() {
  const jsonPanel = createJsonPanelBindings();
  const iaPanel = createIAPanelBindings();
  const format = jsonPanel.format.value;
  const output = iaPanel.analysisOutput;
  const fixOutput = document.getElementById("terraformFixOutput");
  const memoryText = iaPanel.memoryNarrative;
  const shadowConsole = document.getElementById("shadowConsole");

  const parsed = parseInputJson(jsonPanel.input.value);
  if (!parsed.ok) {
    renderJson(output, { error: "JSON invalido", detail: parsed.message });
    appendConsoleLine(shadowConsole, "Payload rechazado por capa sintactica.", "threat");
    return;
  }

  appendConsoleLine(shadowConsole, "Motor enterprise iniciando inferencia multinivel sobre grafo User -> Role -> Resource -> Exposure -> Attack Path.", "info");

  try {
    const inference = await runGraphInferenceEngine(parsed.value, format);
    const analysis = inference.analysis;
    renderJson(output, analysis);
    fixOutput.textContent = String(analysis.terraform_fix || "Sin remediacion");

    updateRadarWithProbability(analysis.probability);
    setThreatState(analysis.probability);

    const memorySnapshot = rememberAnalysis({
      affectedUser: parsed.value.user || parsed.value.servicePrincipal,
      affectedResource: parsed.value.resource || parsed.value.keyVault,
      riskScore: analysis.probability,
      remediated: analysis.probability < 50,
      analysis
    });

    memoryText.textContent = buildContextNarrative(memorySnapshot.current, memorySnapshot.previous);
    lastAnalysisState = { layers: inference.layers, analysis };

    appendConsoleLine(shadowConsole, "[AI] Probability=" + analysis.probability + " | MITRE=" + analysis.mitre_technique + " | CriticalNode=" + analysis.critical_node, analysis.probability >= 70 ? "threat" : "info");
  } catch (error) {
    renderJson(output, { error: error.message });
    appendConsoleLine(shadowConsole, "Fallo en motor de inferencia: " + error.message, "threat");
  }
}

function wireCopyFixAction() {
  const copyButton = document.getElementById("copyFixBtn");
  const fixOutput = document.getElementById("terraformFixOutput");
  const shadowConsole = document.getElementById("shadowConsole");
  copyButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(fixOutput.textContent || "");
      appendConsoleLine(shadowConsole, "Auto-remediation copiada a portapapeles.", "info");
    } catch {
      appendConsoleLine(shadowConsole, "No se pudo copiar la remediacion.", "threat");
    }
  });
}

function wireJwtPanel() {
  const jwtPanel = createJwtPanelBindings();
  const button = jwtPanel.validateButton;
  const input = jwtPanel.input;
  const output = jwtPanel.output;
  const shadowConsole = document.getElementById("shadowConsole");

  button.addEventListener("click", () => {
    const decoded = decodeJwt(input.value);
    if (!decoded.ok) {
      renderJson(output, decoded);
      appendConsoleLine(shadowConsole, "JWT invalido detectado por panel de identidad.", "threat");
      return;
    }
    const claims = validateSc300Claims(decoded.claims);
    renderJson(output, claims);
    appendConsoleLine(shadowConsole, "JWT evaluado: hasMfa=" + claims.hasMfa + " isExpired=" + claims.isExpired, claims.commandCenterStatus === "pass" ? "info" : "threat");
  });
}

function wireAttackSimulationPanel() {
  const select = document.getElementById("attackTechniqueSelect");
  const button = document.getElementById("runSimulationBtn");
  const output = document.getElementById("attackSimulationOutput");
  const shadowConsole = document.getElementById("shadowConsole");

  button.addEventListener("click", () => {
    const result = simulateAttack(select.value);
    renderJson(output, result);
    updateRadarWithProbability(result.impact);
    setThreatState(result.impact);
    appendConsoleLine(shadowConsole, "[SIM] " + result.technique + " -> impacto estimado " + result.impact + "%", result.impact >= 75 ? "threat" : "info");
  });
}

function wireArchitectureBoard() {
  const askButton = document.getElementById("askArchitectureBtn");
  const refreshButton = document.getElementById("refreshArchitectureBtn");
  const questionInput = document.getElementById("architectureQuestion");
  const title = document.getElementById("architectureAnswerTitle");
  const content = document.getElementById("architectureBoardContent");

  askButton.addEventListener("click", () => {
    const answer = answerArchitectureQuestion(questionInput.value, docsCache);
    title.textContent = answer.title;
    content.innerHTML = answer.html;
  });

  refreshButton.addEventListener("click", async () => {
    await refreshArchitectureBoard();
  });

  setInterval(() => {
    refreshArchitectureBoard().catch(() => {});
  }, 60000);
}

function wireSocNightMode() {
  const button = document.getElementById("socNightMode");
  button.addEventListener("click", () => {
    document.body.classList.toggle("soc-night");
  });
}

function wirePrimaryActions() {
  const jsonPanel = createJsonPanelBindings();
  const runButton = jsonPanel.runButton;
  runButton.addEventListener("click", () => {
    analyzeArchitectureWithAI().catch(() => {});
  });
}

async function boot() {
  const shadowConsole = document.getElementById("shadowConsole");
  ensureRadar();
  await refreshArchitectureBoard();

  monitor = createShadowMonitor((line, riskScore) => {
    appendConsoleLine(shadowConsole, line, riskScore >= 75 ? "threat" : "info");
  });
  monitor.start(20);

  wirePrimaryActions();
  wireCopyFixAction();
  wireJwtPanel();
  wireAttackSimulationPanel();
  wireArchitectureBoard();
  wireSocNightMode();

  window.analyzeArchitectureWithAI = analyzeArchitectureWithAI;
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    boot().catch(() => {});
  });
} else {
  boot().catch(() => {});
}
