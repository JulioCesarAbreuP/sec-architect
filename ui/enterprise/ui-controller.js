import { analyzeEntraIdWithSabsa } from "../../core/enterprise/sabsa-logic.js";
import { rememberAnalysis, buildContextNarrative } from "../../core/enterprise/operational-memory.js";
import { createShadowMonitor } from "../../core/enterprise/shadow-monitor.js";
import { loadArchitectureBoardDocs, answerArchitectureQuestion } from "../../core/enterprise/architecture-board.js";
import { simulateAttack } from "../../core/enterprise/attack-simulation.js";
import { decodeJwt, validateSc300Claims } from "../../core/jwt-validator.js";
import { setStatusChip, appendConsoleLine, renderJson, setPanelRiskMotion } from "./dashboard-ui.js";

let radar = null;
let docsCache = [];
let monitor = null;
let previousAnalysis = null;

function parseJsonSyntax(rawText) {
  try {
    JSON.parse(String(rawText || ""));
    return { ok: true };
  } catch (error) {
    return { ok: false, message: error.message };
  }
}

function ensureRadar() {
  if (radar) return radar;
  const canvas = document.getElementById("riskRadar");
  if (!canvas || typeof window.Chart !== "function") return null;

  radar = new window.Chart(canvas.getContext("2d"), {
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
          pointLabels: { color: "#9aa3ad" }
        }
      },
      plugins: { legend: { labels: { color: "#e0e0e0" } } }
    }
  });

  return radar;
}

function updateRadar(probability) {
  const chart = ensureRadar();
  if (!chart) return;

  const p = Math.max(1, Math.min(99, Number(probability || 1)));
  chart.data.datasets[0].data = [p, Math.min(100, p + 8), Math.min(100, p + 5), Math.max(1, 100 - p), Math.max(1, 100 - p * 0.68)];
  chart.update();
}

function setThreatState(probability) {
  const status = document.getElementById("command-status");
  const root = document.getElementById("enterpriseRoot");
  const banner = document.getElementById("threatEscalationBanner");
  const state = setStatusChip(status, probability);
  setPanelRiskMotion(root, state);

  const oldRisk = previousAnalysis ? Number(previousAnalysis.analysis.probability || 0) : 0;
  banner.hidden = !(Number(probability || 0) >= oldRisk + 8);

  if (monitor) {
    monitor.updateRisk(probability);
  }
}

async function refreshBoard() {
  docsCache = await loadArchitectureBoardDocs();
  const board = document.getElementById("architectureBoardContent");
  if (!docsCache.length) {
    board.innerHTML = "<p>No fue posible cargar arquitectura y ADRs.</p>";
    return;
  }
  const rootDoc = docsCache.find((doc) => doc.path.includes("ARCHITECTURE.md")) || docsCache[0];
  board.innerHTML = rootDoc.html;
}

async function runAnalysis() {
  const jsonInput = document.getElementById("graphJsonInput");
  const format = document.getElementById("remediationFormat").value;
  const output = document.getElementById("aiAnalysisOutput");
  const fixOutput = document.getElementById("terraformFixOutput");
  const memoryOutput = document.getElementById("operationalMemoryNarrative");
  const shadowConsole = document.getElementById("shadowConsole");

  try {
    const result = await analyzeEntraIdWithSabsa(jsonInput.value, format);
    renderJson(output, result.analysis);
    fixOutput.textContent = result.analysis.terraform_fix;

    updateRadar(result.analysis.probability);
    setThreatState(result.analysis.probability);

    const memory = rememberAnalysis({
      affectedUser: result.payload.user || result.payload.servicePrincipal,
      affectedResource: result.payload.resource || result.payload.targetResource || result.payload.keyVault,
      riskScore: result.analysis.probability,
      remediated: result.analysis.probability < 50,
      analysis: result.analysis
    });

    memoryOutput.textContent = buildContextNarrative(memory.current, memory.previous);
    previousAnalysis = result;

    appendConsoleLine(shadowConsole, "[IA-LOG] Probabilidad de Movimiento Lateral: " + result.analysis.probability + "%", result.analysis.probability >= 70 ? "threat" : "info");
    appendConsoleLine(shadowConsole, "[IA-LOG] Vector: " + result.analysis.mitre_technique, result.analysis.probability >= 70 ? "threat" : "info");
    appendConsoleLine(shadowConsole, result.analysis.ai_context_message, "info");
  } catch (error) {
    renderJson(output, { error: error.message });
    appendConsoleLine(shadowConsole, "[PARSER-ERROR] " + error.message, "threat");
  }
}

function wireParserValidation() {
  const input = document.getElementById("graphJsonInput");
  const button = document.getElementById("runInferenceBtn");
  const shadowConsole = document.getElementById("shadowConsole");

  input.addEventListener("input", () => {
    const check = parseJsonSyntax(input.value);
    if (!check.ok) {
      button.disabled = true;
      input.classList.add("input-error");
      appendConsoleLine(shadowConsole, "[PARSER-ERROR] JSON invalido: " + check.message, "threat");
      return;
    }

    input.classList.remove("input-error");
    button.disabled = false;
  });
}

function wireCopyFix() {
  const button = document.getElementById("copyFixBtn");
  const fixOutput = document.getElementById("terraformFixOutput");
  const shadowConsole = document.getElementById("shadowConsole");

  button.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(fixOutput.textContent || "");
      appendConsoleLine(shadowConsole, "Auto-remediacion copiada al portapapeles.", "info");
    } catch {
      appendConsoleLine(shadowConsole, "No se pudo copiar la remediacion.", "threat");
    }
  });
}

function wireJwt() {
  const input = document.getElementById("jwtInput");
  const output = document.getElementById("jwtOutput");
  const button = document.getElementById("validateJwtBtn");
  const shadowConsole = document.getElementById("shadowConsole");

  button.addEventListener("click", () => {
    const decoded = decodeJwt(input.value);
    if (!decoded.ok) {
      renderJson(output, decoded);
      appendConsoleLine(shadowConsole, "JWT invalido detectado en panel operacional.", "threat");
      return;
    }

    const claims = validateSc300Claims(decoded.claims);
    renderJson(output, claims);
    appendConsoleLine(shadowConsole, "JWT evaluado: hasMfa=" + claims.hasMfa + " isExpired=" + claims.isExpired, claims.commandCenterStatus === "pass" ? "info" : "threat");
  });
}

function wireAttackSimulation() {
  const select = document.getElementById("attackTechniqueSelect");
  const button = document.getElementById("runSimulationBtn");
  const output = document.getElementById("attackSimulationOutput");
  const shadowConsole = document.getElementById("shadowConsole");

  button.addEventListener("click", () => {
    const simulation = simulateAttack(select.value);
    renderJson(output, simulation);
    updateRadar(simulation.impact);
    setThreatState(simulation.impact);
    appendConsoleLine(shadowConsole, "[THREAT ENGINE] " + simulation.attackPath, simulation.impact >= 75 ? "threat" : "info");
  });
}

function wireArchitectureBoard() {
  const askBtn = document.getElementById("askArchitectureBtn");
  const refreshBtn = document.getElementById("refreshArchitectureBtn");
  const question = document.getElementById("architectureQuestion");
  const title = document.getElementById("architectureAnswerTitle");
  const content = document.getElementById("architectureBoardContent");

  askBtn.addEventListener("click", () => {
    const answer = answerArchitectureQuestion(question.value, docsCache);
    title.textContent = answer.title;
    content.innerHTML = answer.html;
  });

  refreshBtn.addEventListener("click", async () => {
    await refreshBoard();
  });

  setInterval(() => {
    refreshBoard().catch(() => {});
  }, 60000);
}

function wireSocMode() {
  const button = document.getElementById("socNightMode");
  button.addEventListener("click", () => {
    document.body.classList.toggle("soc-night");
  });
}

function wirePrimaryAction() {
  const runButton = document.getElementById("runInferenceBtn");
  runButton.addEventListener("click", () => {
    runAnalysis().catch(() => {});
  });
}

export async function initEnterpriseUIController() {
  const shadowConsole = document.getElementById("shadowConsole");
  ensureRadar();
  await refreshBoard();

  monitor = createShadowMonitor((line, risk) => {
    appendConsoleLine(shadowConsole, line, risk >= 75 ? "threat" : "info");
  });
  monitor.start(20);

  wireParserValidation();
  wirePrimaryAction();
  wireCopyFix();
  wireJwt();
  wireAttackSimulation();
  wireArchitectureBoard();
  wireSocMode();

  window.analyzeArchitectureWithAI = runAnalysis;
}
