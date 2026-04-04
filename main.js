import { parseAndValidateIdentity } from "./core/identity-parser.js";
import { evaluateIdentityRules } from "./core/rules-engine.js";
import { calculateZeroTrustScore, applyFixImpact, calculateCaZeroTrustPosture, applyThreatIntelToPosture } from "./core/scoring-engine.js";
import { buildAttackGraph } from "./core/graph-engine.js";
import { runSabsaInferenceLayers } from "./core/sabsa-logic.js";
import { runBackgroundThreatInference } from "./core/inference-engine.js";
import { calculateWeightedAttackImpact } from "./core/attack-weight-engine.js";
import { loadThreatIntelFeed } from "./core/threat-intel-engine.js";
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
import { renderZeroTrustScore, renderZeroTrustPanel } from "./ui/ui-score.js";
import { renderThreatIntelPanel } from "./ui/ui-threat-intel.js";

let refs;
let radarChart;
let shadowMonitor;
let docsCache = [];
let previousRisk = 0;
let currentScore = 100;
let latestCaPolicies = [];
let threatIntelSummary = null;
let threatIntelHistory = [];
let threatIntelTimeline = [];

function applyThreatState(probability) {
  updateStatus(refs.status, refs.root, probability);
  const escalated = Number(probability || 0) >= previousRisk + 8;
  refs.escalationBanner.hidden = !escalated;
  previousRisk = Number(probability || previousRisk);

  if (shadowMonitor) {
    shadowMonitor.updateRisk(probability);
  }

}

function appendThreatTimeline(source, message) {
  threatIntelTimeline.unshift({
    at: new Date().toISOString(),
    source,
    message
  });
  threatIntelTimeline = threatIntelTimeline.slice(0, 16);
}

function appendThreatHistory(technique, risk) {
  threatIntelHistory.push({
    at: new Date().toISOString(),
    technique: String(technique || "n/a"),
    risk: Math.max(0, Math.min(100, Number(risk || 0)))
  });
  threatIntelHistory = threatIntelHistory.slice(-10);
}

function refreshThreatIntelPanel(intelPressure = 0) {
  renderThreatIntelPanel(refs, {
    summary: threatIntelSummary || {
      generatedAt: new Date().toISOString(),
      topTechnique: { id: "n/a", risk: 0 },
      topTechniques: []
    },
    intelPressure,
    history: threatIntelHistory,
    timeline: threatIntelTimeline
  });
}

function updateZeroTrustFromPolicies(policies, source = "manual") {
  latestCaPolicies = Array.isArray(policies) ? policies : [];
  const basePosture = calculateCaZeroTrustPosture(latestCaPolicies);
  const posture = threatIntelSummary ? applyThreatIntelToPosture(basePosture, threatIntelSummary) : basePosture;
  currentScore = posture.score;
  renderZeroTrustScore(refs.zeroTrustScore, posture.score);
  renderZeroTrustPanel(refs, posture);

  appendSocLog(
    refs.shadowConsole,
    "[ZERO-TRUST] Score " + posture.score + "/100 from " + posture.metrics.policyCount + " CA policies (source=" + source + ")",
    posture.score >= 80 ? "info" : "threat"
  );

  appendThreatTimeline("scoring", "Zero-Trust updated from " + source + " | score=" + posture.score + " | pressure=" + posture.metrics.intelPressure);
  refreshThreatIntelPanel(posture.metrics.intelPressure);
}

function getWeightedImpact(techniqueId, baseImpact) {
  return calculateWeightedAttackImpact({
    techniqueId,
    baseImpact,
    zeroTrustScore: currentScore,
    intelSummary: threatIntelSummary
  });
}

async function primeThreatIntel() {
  try {
    const intel = await loadThreatIntelFeed();
    threatIntelSummary = intel.summary;
    appendThreatHistory(intel.summary.topTechnique.id, intel.summary.topTechnique.risk);
    appendThreatTimeline("intel-feed", "Feed synced | top=" + intel.summary.topTechnique.id + " | confidence=" + intel.summary.topTechnique.risk);

    appendSocLog(
      refs.shadowConsole,
      "[THREAT-INTEL] Feed loaded: " + intel.summary.itemCount + " entries, top technique " + intel.summary.topTechnique.id + " (" + intel.summary.topTechnique.risk + "/100)",
      "info"
    );

    // Recompute score with intel pressure once the feed is available.
    updateZeroTrustFromPolicies(latestCaPolicies, "intel");
  } catch (error) {
    appendThreatTimeline("intel-feed", "Feed unavailable");
    refreshThreatIntelPanel(0);
    appendSocLog(refs.shadowConsole, "[THREAT-INTEL] Feed unavailable: " + String(error.message || error), "threat");
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

    if (objectType === "Conditional Access Policy") {
      updateZeroTrustFromPolicies([payload], "parser");
    }

    const rules = evaluateIdentityRules(payload);
    pushSocLogs(refs.shadowConsole, rules.logs);

    const deterministic = runSabsaInferenceLayers(payload, refs.formatSelect.value);
    const aiAnalysis = await runBackgroundThreatInference(payload, deterministic.deterministicAnalysis);

    const deterministicFix = buildDynamicRemediation(payload, deterministic.flags, refs.formatSelect.value, true);
    aiAnalysis.terraform_fix = aiAnalysis.terraform_fix || deterministicFix;

    const score = objectType === "Conditional Access Policy"
      ? currentScore
      : calculateZeroTrustScore(rules.flags);

    if (objectType !== "Conditional Access Policy") {
      currentScore = score;
      renderZeroTrustScore(refs.zeroTrustScore, score);
    }

    const baselineProbability = rules.flags.mfaEnabled ? Math.max(12, 100 - score) : Math.max(80, aiAnalysis.probability);
    const weighted = getWeightedImpact(aiAnalysis.mitre_technique, baselineProbability);
    appendThreatHistory(aiAnalysis.mitre_technique, weighted.components.intelScore);
    appendThreatTimeline("attack-analysis", "Technique=" + aiAnalysis.mitre_technique + " | weightedImpact=" + weighted.impact + " | intel=" + weighted.components.intelScore);
    refreshThreatIntelPanel(Math.round((weighted.components.intelScore || 0) * 0.18));

    const merged = {
      object_type: objectType,
      probability: weighted.impact,
      critical_node: aiAnalysis.critical_node,
      mitre_technique: aiAnalysis.mitre_technique,
      lateral_vector: aiAnalysis.lateral_vector,
      attack_path: aiAnalysis.attack_path,
      terraform_fix: aiAnalysis.terraform_fix,
      weighting: weighted.components
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
    appendSocLog(refs.shadowConsole, "[IA-LOG] Weighting(base/posture/intel): " + weighted.components.baseImpact + "/" + weighted.components.posturePressure + "/" + weighted.components.intelPressure, merged.probability >= 70 ? "threat" : "info");
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
    const weighted = getWeightedImpact(deterministic.deterministicAnalysis.mitre_technique);
    const risk = weighted.impact;
    appendThreatHistory(deterministic.deterministicAnalysis.mitre_technique, weighted.components.intelScore);
    appendThreatTimeline("attack-sim", "Technique=" + deterministic.deterministicAnalysis.mitre_technique + " | impact=" + weighted.impact + " | base/posture/intel=" + weighted.components.baseImpact + "/" + weighted.components.posturePressure + "/" + weighted.components.intelPressure);
    refreshThreatIntelPanel(weighted.components.intelPressure);

    const graph = buildAttackGraph(payload, rules.flags);

    const output = {
      technique: refs.attackSelect.value,
      mitre: deterministic.deterministicAnalysis.mitre_technique,
      attack_path: deterministic.deterministicAnalysis.attack_path,
      impact: risk,
      weighting: weighted.components,
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
    appendSocLog(refs.shadowConsole, "[THREAT ENGINE] Weighting(base/posture/intel): " + output.weighting.baseImpact + "/" + output.weighting.posturePressure + "/" + output.weighting.intelPressure, output.impact >= 75 ? "threat" : "info");
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
  renderZeroTrustPanel(refs, calculateCaZeroTrustPosture([]));
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
  refreshThreatIntelPanel(0);

  window.addEventListener("sa:ca-policies-loaded", (event) => {
    const policies = Array.isArray(event?.detail?.policies) ? event.detail.policies : [];
    updateZeroTrustFromPolicies(policies, "graph");
  });

  await primeThreatIntel();

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
