import { parseAndValidateIdentity } from "./core/identity-parser.js";
import { evaluateIdentityRules } from "./core/rules-engine.js";
import { calculateZeroTrustScore, applyFixImpact } from "./core/scoring-engine.js";
import { buildAttackGraph } from "./core/graph-engine.js";
import { runSabsaInferenceLayers } from "./core/sabsa-logic.js";
import { runBackgroundThreatInference } from "./core/inference-engine.js";
import { buildDynamicRemediation } from "./core/remediation-engine.js";
import { persistOperationalContext, buildOperationalNarrative } from "./core/memory-engine.js";
import { createShadowMonitor } from "./core/telemetry-engine.js";
import { decodeJwt, validateSc300Claims } from "./core/jwt-validator.js";
import { getPanelRefs } from "./ui/ui-panels.js";
import { initAzureAuthPanel } from "./core/ui/azure-auth-panel.js";
import { appendSocLog, renderJson, renderCode, updateStatus, ensureRadarChart, updateRadar } from "./ui/ui-renderer.js";
import { loadArchitectureBoard, answerArchitectureQuestion } from "./ui/ui-architecture-board.js";
import { pushSocLogs, pushSingleLog, clearLogs } from "./ui/ui-logs.js";
import { renderAttackGraph } from "./ui/ui-graph.js";
import { renderZeroTrustScore } from "./ui/ui-score.js";

let refs;
let radarChart;
let shadowMonitor;
let docsCache = [];
let previousRisk = 0;
let currentScore = 100;

function computeRiskFromTechnique(technique) {
  if (technique === "T1556") return 88;
  if (technique === "T1078" || technique === "T1078.004") return 84;
  if (technique === "T1548") return 76;
  return 62;
}

function applyThreatState(probability) {
  updateStatus(refs.status, refs.root, probability);
  const escalated = Number(probability || 0) >= previousRisk + 8;
  refs.escalationBanner.hidden = !escalated;
  previousRisk = Number(probability || previousRisk);

  if (shadowMonitor) {
    shadowMonitor.updateRisk(probability);
  }

}

function ensureParserInputState(raw) {
  try {
    JSON.parse(String(raw || ""));
    refs.jsonInput.classList.remove("input-error");
    refs.runBtn.disabled = false;
    return true;
  } catch {
    refs.jsonInput.classList.add("input-error");
    refs.runBtn.disabled = true;
    pushSingleLog(refs.shadowConsole, "[ERROR] JSON de Identidad No Válido", "threat");
    return false;
  }
}

function buildAttackSimulation(techniqueId) {
  const syntheticPayload = {
    servicePrincipal: "spn-sim-44A2",
    role: techniqueId === "T1078" ? "Global Admin" : techniqueId === "T1548" ? "Owner" : "Conditional Access Administrator",
    resource: techniqueId === "T1556" ? "IdentityControlPlane" : "KeyVault-Prod",
    permissions: ["Contributor", "Storage Blob Data Owner"],
    mfa: techniqueId === "T1556" ? "disabled" : "enforced"
  };

  return syntheticPayload;
}

async function refreshArchitectureBoard() {
  docsCache = await loadArchitectureBoard();
  if (!docsCache.length) {
    refs.architectureContent.innerHTML = "<p>No se pudo cargar ARCHITECTURE.md y ADRs.</p>";
    return;
  }

  const rootDoc = docsCache.find((doc) => doc.path.includes("ARCHITECTURE.md")) || docsCache[0];
  refs.architectureContent.innerHTML = rootDoc.html;
}

export async function analyzeArchitectureWithAI() {
  const rawJson = refs.jsonInput.value;
  if (!ensureParserInputState(rawJson)) {
    return;
  }

  try {
    clearLogs(refs.shadowConsole);
    const { payload, objectType } = parseAndValidateIdentity(rawJson);
    refs.parserInfo.textContent = "Tipo detectado: " + objectType;

    const rules = evaluateIdentityRules(payload);
    pushSocLogs(refs.shadowConsole, rules.logs);

    const deterministic = runSabsaInferenceLayers(payload, refs.formatSelect.value);
    const aiAnalysis = await runBackgroundThreatInference(payload, deterministic.deterministicAnalysis);

    const deterministicFix = buildDynamicRemediation(payload, deterministic.flags, refs.formatSelect.value, true);
    aiAnalysis.terraform_fix = aiAnalysis.terraform_fix || deterministicFix;

    const score = calculateZeroTrustScore(rules.flags);
    currentScore = score;
    renderZeroTrustScore(refs.zeroTrustScore, score);

    const merged = {
      object_type: objectType,
      probability: rules.flags.mfaEnabled ? Math.max(12, 100 - score) : Math.max(80, aiAnalysis.probability),
      critical_node: aiAnalysis.critical_node,
      mitre_technique: aiAnalysis.mitre_technique,
      lateral_vector: aiAnalysis.lateral_vector,
      attack_path: aiAnalysis.attack_path,
      terraform_fix: aiAnalysis.terraform_fix
    };

    renderJson(refs.aiOutput, merged);
    renderCode(refs.remediationOutput, merged.terraform_fix);

    refs.aiNarrative.textContent = "Basado en los privilegios de este objeto de identidad, el atacante puede escalar lateralmente en " + (merged.probability >= 80 ? "3" : "5") + " pasos hacia activos criticos. Se recomienda contener rol y aislar superficie de acceso inmediatamente.";

    const graph = buildAttackGraph(payload, rules.flags);
    renderAttackGraph(refs.attackGraph, graph, (node) => {
      pushSingleLog(refs.shadowConsole, "[IA-LOG] Nodo seleccionado: " + node.label + " -> probabilidad de compromiso en " + (merged.probability >= 70 ? "3" : "5") + " pasos.", merged.probability >= 70 ? "mitre" : "info");
    });

    updateRadar(radarChart, merged.probability);
    applyThreatState(merged.probability);

    const memory = persistOperationalContext({
      affectedUser: payload.user || payload.servicePrincipal || payload.principalId || payload.appId,
      affectedResource: payload.resource || payload.targetResource || payload.scope,
      risk: merged.probability,
      remediated: merged.probability < 50
    });
    refs.memoryNote.textContent = buildOperationalNarrative(memory.current, memory.previous);

    appendSocLog(refs.shadowConsole, "[IA-LOG] Probabilidad de Movimiento Lateral: " + merged.probability + "%", merged.probability >= 70 ? "threat" : "info");
    appendSocLog(refs.shadowConsole, "[IA-LOG] Vector: " + merged.mitre_technique, merged.probability >= 70 ? "threat" : "info");
    appendSocLog(refs.shadowConsole, "Detecto un patron de permisos excesivos en tres objetos consecutivos. Recomiendo activar Just-In-Time Access.", "info");
  } catch (error) {
    refs.parserInfo.textContent = "Tipo detectado: error";
    renderJson(refs.aiOutput, { error: error.message });
    refs.aiNarrative.textContent = "El analisis no pudo completarse por error sintactico o semantico en el payload de identidad.";
    pushSingleLog(refs.shadowConsole, String(error.message), "threat");
  }
}

function wireJsonParser() {
  refs.jsonInput.addEventListener("input", () => {
    ensureParserInputState(refs.jsonInput.value);
  });

  refs.runBtn.addEventListener("click", () => {
    analyzeArchitectureWithAI().catch(() => {});
  });
}

function wireCopyRemediation() {
  refs.copyFixBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(refs.remediationOutput.textContent || "");
      appendSocLog(refs.shadowConsole, "IaC copiado al portapapeles.", "info");
      currentScore = applyFixImpact(currentScore);
      renderZeroTrustScore(refs.zeroTrustScore, currentScore);
    } catch {
      appendSocLog(refs.shadowConsole, "No se pudo copiar IaC al portapapeles.", "threat");
    }
  });
}

function wireJwtPanel() {
  refs.jwtBtn.addEventListener("click", () => {
    const decoded = decodeJwt(refs.jwtInput.value);
    if (!decoded.ok) {
      renderJson(refs.jwtOutput, decoded);
      appendSocLog(refs.shadowConsole, "JWT invalido detectado.", "threat");
      return;
    }

    const claims = validateSc300Claims(decoded.claims);
    renderJson(refs.jwtOutput, claims);
    appendSocLog(refs.shadowConsole, "JWT evaluado: hasMfa=" + claims.hasMfa + " isExpired=" + claims.isExpired, claims.commandCenterStatus === "pass" ? "info" : "threat");
  });
}

function wireAttackSimulation() {
  refs.attackBtn.addEventListener("click", async () => {
    const payload = buildAttackSimulation(refs.attackSelect.value);
    const rules = evaluateIdentityRules(payload);
    const deterministic = runSabsaInferenceLayers(payload, refs.formatSelect.value);
    const risk = computeRiskFromTechnique(deterministic.deterministicAnalysis.mitre_technique);
    const graph = buildAttackGraph(payload, rules.flags);

    const output = {
      technique: refs.attackSelect.value,
      attack_path: deterministic.deterministicAnalysis.attack_path,
      impact: risk,
      remediation: deterministic.deterministicAnalysis.terraform_fix
    };

    renderJson(refs.attackOutput, output);
    renderCode(refs.remediationOutput, output.remediation);
    renderAttackGraph(refs.attackGraph, graph, (node) => {
      pushSingleLog(refs.shadowConsole, "[SIM-DETAIL] " + node.label + " comprometible en " + (risk >= 75 ? "2" : "4") + " pasos.", risk >= 75 ? "threat" : "info");
    });
    updateRadar(radarChart, output.impact);
    applyThreatState(output.impact);
    renderZeroTrustScore(refs.zeroTrustScore, Math.max(0, 100 - output.impact));

    appendSocLog(refs.shadowConsole, "[THREAT ENGINE] " + output.attack_path, output.impact >= 75 ? "threat" : "info");
  });
}

function wireArchitectureBoard() {
  refs.architectureAskBtn.addEventListener("click", () => {
    const answer = answerArchitectureQuestion(refs.architectureQuestion.value, docsCache);
    refs.architectureTitle.textContent = answer.title;
    refs.architectureContent.innerHTML = answer.html;
  });

  refs.architectureRefreshBtn.addEventListener("click", () => {
    refreshArchitectureBoard().catch(() => {});
  });

  setInterval(() => {
    refreshArchitectureBoard().catch(() => {});
  }, 60000);
}

function wireSocNightMode() {
  refs.socNightModeBtn.addEventListener("click", () => {
    document.body.classList.toggle("soc-night");
  });
}

async function boot() {
  refs = getPanelRefs();
  radarChart = ensureRadarChart(refs.radarCanvas);
  renderZeroTrustScore(refs.zeroTrustScore, currentScore);
  await refreshArchitectureBoard();

  shadowMonitor = createShadowMonitor((line, risk) => {
    appendSocLog(refs.shadowConsole, line, risk >= 75 ? "threat" : "info");
  });
  shadowMonitor.start(20);

  wireJsonParser();
  wireCopyRemediation();
  wireJwtPanel();
  wireAttackSimulation();
  wireArchitectureBoard();
  wireSocNightMode();

  await initAzureAuthPanel(
    (line, type) => appendSocLog(refs.shadowConsole, line, type),
    () => analyzeArchitectureWithAI()
  );

  window.analyzeArchitectureWithAI = analyzeArchitectureWithAI;
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    boot().catch(() => {});
  });
} else {
  boot().catch(() => {});
}
