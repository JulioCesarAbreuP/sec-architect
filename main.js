/**
 * main.js — CSPM Platform Orchestrator
 * SEC_ARCHITECT · Cloud Security Posture Management
 * All 8 tabs: Analyzer, Attack Graph, Threat Intel, Drift Monitor,
 *             OSINT Scanner, Blueprint Architect, Digital Twin, Azure Scanner
 */

/* ── Core engine imports ──────────────────────────────────────── */
import { parseAndValidateIdentity }            from "./core/identity-parser.js";
import { evaluateIdentityRules }               from "./core/rules-engine.js";
import { calculateZeroTrustScore }             from "./core/scoring-engine.js";
import { buildAttackGraph }                    from "./core/graph-engine.js";
import { runSabsaInferenceLayers }             from "./core/sabsa-logic.js";
import { runBackgroundThreatInference }        from "./core/inference-engine.js";
import { generateContextualRemediation,
         generateBlueprint,
         listBlueprints }                      from "./core/iac-generator.js";
import { syncMitreAttack, syncCisaKev,
         getRecentKev, getTechniqueList,
         searchMitreByKeyword }                from "./core/threat-intel.js";
import { analyzeActivityLogs,
         generateSyntheticDrifts,
         buildDriftSummary }                   from "./core/drift-engine.js";
import { shodanScan, buildOsintRiskSummary,
         buildOsintNarrative }                 from "./core/osint-engine.js";
import { calculateCompositeRisk,
         buildRiskNarrative,
         simulateFixImpact }                   from "./core/risk-engine.js";
import { initiateGraphLogin, handleAuthCallback,
         fetchConditionalAccessPolicies,
         fetchAuditLogs, isAuthenticated,
         disconnect }                          from "./core/azure-connector.js";
import { DigitalTwin }                         from "./core/digital-twin.js";
import { persistOperationalContext,
         buildOperationalNarrative }           from "./core/memory-engine.js";

/* ── UI helpers ───────────────────────────────────────────────── */
import { pushSocLogs, pushSingleLog, clearLogs } from "./ui/ui-logs.js";
import { renderAttackGraph }                     from "./ui/ui-graph.js";

/* ── Module-level state ───────────────────────────────────────── */
let radarChart      = null;
let digitalTwin     = new DigitalTwin();
let currentRisk     = { score: 0, zeroTrustScore: 100, level: "low", breakdown: {} };
let lastFlags       = {};
let selectedBlueprint = null;

/* ── DOM helpers ──────────────────────────────────────────────── */
const $ = (id) => document.getElementById(id);
const log = (msg, level = "info") => {
  const el = $("shadowConsole"); if (!el) return;
  pushSingleLog(el, msg, level);
};

/* ──────────────────────────────────────────────────────────────
   TAB NAVIGATION
   ────────────────────────────────────────────────────────────── */
function initTabs() {
  const tabBtns  = document.querySelectorAll(".tab-btn[data-tab]");
  const tabPanels = document.querySelectorAll(".tab-panel");

  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.tab;
      tabBtns.forEach((b)  => { b.classList.remove("active"); b.setAttribute("aria-selected","false"); });
      tabPanels.forEach((p) => { p.hidden = true; });
      btn.classList.add("active");
      btn.setAttribute("aria-selected","true");
      const panel = document.getElementById("tab-" + target);
      if (panel) panel.hidden = false;
    });
  });
}

/* ──────────────────────────────────────────────────────────────
   SOC CONSOLE
   ────────────────────────────────────────────────────────────── */
function initConsole() {
  const toggle = $("consoleToggle");
  const console_ = $("shadowConsole");
  const clearBtn = $("clearConsoleBtn");

  toggle?.addEventListener("click", () => {
    if (!console_) return;
    console_.hidden = !console_.hidden;
  });

  clearBtn?.addEventListener("click", () => {
    if (!console_) return;
    clearLogs(console_);
    const cnt = $("consoleLogCount"); if (cnt) cnt.textContent = "0";
  });
}

/* ──────────────────────────────────────────────────────────────
   SOC NIGHT MODE
   ────────────────────────────────────────────────────────────── */
function initNightMode() {
  $("socNightBtn")?.addEventListener("click", () => {
    document.body.classList.toggle("soc-night");
  });
}

/* ──────────────────────────────────────────────────────────────
   GAUGE (SVG arc)
   ────────────────────────────────────────────────────────────── */
function updateGauge(score) {
  const fill  = $("gaugeFill");
  const val   = $("gaugeValue");
  const label = $("gaugeLabelText");
  if (!fill) return;

  const clamped  = Math.max(0, Math.min(100, score));
  const totalLen = 157; // full arc length for the SVG path used
  const offset   = totalLen * (1 - clamped / 100);
  fill.style.strokeDashoffset = String(offset);
  fill.style.stroke = clamped >= 70 ? "#4ade80" : clamped >= 40 ? "#facc15" : "#f87171";
  if (val)   val.textContent   = String(Math.round(clamped));
  if (label) label.textContent = clamped >= 70 ? "HARDENED" : clamped >= 40 ? "DEGRADED" : "CRITICAL";
}

/* ──────────────────────────────────────────────────────────────
   SCORE BAR (analyzer tab)
   ────────────────────────────────────────────────────────────── */
function updateScoreBar(ztsScore) {
  const fill  = $("scoreBarFill");
  const label = $("zeroTrustScore");
  if (fill)  fill.style.width = ztsScore + "%";
  if (label) label.textContent = Math.round(ztsScore);
}

/* ──────────────────────────────────────────────────────────────
   SCORE BREAKDOWN
   ────────────────────────────────────────────────────────────── */
function renderScoreBreakdown(breakdown) {
  const el = $("scoreBreakdown"); if (!el) return;
  el.innerHTML = Object.entries(breakdown).map(([k, v]) =>
    `<div class="breakdown-row"><span>${k}</span><span>${v}</span>
     <div class="breakdown-bar"><div class="breakdown-bar-fill" style="width:${v}%"></div></div></div>`
  ).join("");
}

/* ──────────────────────────────────────────────────────────────
   RADAR CHART (Chart.js)
   ────────────────────────────────────────────────────────────── */
function initRadar() {
  const canvas = $("riskRadar"); if (!canvas || !window.Chart) return;
  radarChart = new window.Chart(canvas, {
    type: "radar",
    data: {
      labels: ["Identity Risk","Lateral Move","Data Exfil","Persistence","Priv Esc","C2"],
      datasets: [{ label: "Risk", data: [0,0,0,0,0,0],
        backgroundColor:"rgba(248,113,113,.18)", borderColor:"#f87171",
        pointBackgroundColor:"#f87171", pointRadius: 3, borderWidth: 1.5 }]
    },
    options: {
      responsive: true, maintainAspectRatio: true,
      scales: { r: { min:0, max:100, ticks: { display:false },
        grid: { color:"#21303f" }, pointLabels: { color:"#7e96ad", font:{ size:9 } } } },
      plugins: { legend: { display:false } }
    }
  });
}

function updateRadar(probability) {
  if (!radarChart) return;
  const p = Number(probability || 0);
  radarChart.data.datasets[0].data = [p, p*0.9, p*0.75, p*0.8, p*0.85, p*0.6].map(Math.round);
  radarChart.update("none");
}

/* ──────────────────────────────────────────────────────────────
   GLOBAL THREAT STATE
   ────────────────────────────────────────────────────────────── */
function applyGlobalState(riskResult) {
  const root   = $("cspmRoot");
  const status = $("globalStatus");
  const banner = $("escalationBanner");
  if (!root) return;

  root.className = "";
  const level = riskResult.level || "low";
  root.classList.add("risk-" + level);

  if (status) {
    status.textContent = level.toUpperCase();
    status.className   = "status-badge status-" + (level === "low" ? "healthy" : level === "high" ? "degraded" : "critical");
  }

  if (banner) banner.hidden = (level !== "critical");

  updateGauge(riskResult.zeroTrustScore || 100);
  updateScoreBar(riskResult.zeroTrustScore || 100);
  renderScoreBreakdown(riskResult.breakdown || {});
  updateRadar(riskResult.score || 0);
}

/* ──────────────────────────────────────────────────────────────
   TAB 1 — ANALYZER
   ────────────────────────────────────────────────────────────── */
function wireAnalyzer() {
  const inputEl   = $("graphJsonInput");
  const runBtn    = $("runInferenceBtn");
  const formatSel = $("remediationFormat");
  const copyBtn   = $("copyFixBtn");
  const autoBtn   = $("autoRemediateBtn");
  const webhookEl = $("webhookConfig");
  const sendHookBtn = $("sendWebhookBtn");

  inputEl?.addEventListener("input", () => {
    try { JSON.parse(inputEl.value); inputEl.classList.remove("input-error"); }
    catch { inputEl.classList.add("input-error"); }
  });

  runBtn?.addEventListener("click", () => runAnalysis().catch((e) => log(e.message,"threat")));

  copyBtn?.addEventListener("click", async () => {
    const text = $("remediationOutput")?.textContent || "";
    try {
      await navigator.clipboard.writeText(text);
      log("IaC fix copied to clipboard.", "ok");
    } catch { log("Clipboard unavailable.", "warn"); }
  });

  autoBtn?.addEventListener("click", () => {
    if (!webhookEl) return;
    webhookEl.hidden = !webhookEl.hidden;
    log("[AUTO-REMEDIATE] Webhook panel " + (webhookEl.hidden ? "closed." : "opened."), "info");
  });

  sendHookBtn?.addEventListener("click", () => sendWebhook());
}

async function runAnalysis() {
  const inputEl   = $("graphJsonInput");
  const runBtn    = $("runInferenceBtn");
  const formatSel = $("remediationFormat");
  const raw = inputEl?.value?.trim() || "";
  if (!raw) { log("Empty payload.", "warn"); return; }

  runBtn && (runBtn.disabled = true);
  clearLogs($("shadowConsole"));
  log("Parsing identity payload...", "info");

  try {
    const { payload, objectType } = parseAndValidateIdentity(raw);
    const typeBadge = $("objectTypeBadge");
    const typeInfo  = $("parserObjectType");
    if (typeBadge) typeBadge.textContent = objectType;
    if (typeInfo)  typeInfo.textContent  = "Schema: " + objectType;

    const rules = evaluateIdentityRules(payload);
    lastFlags = rules.flags;
    pushSocLogs($("shadowConsole"), rules.logs);

    const fmt = formatSel?.value || "terraform";
    const deterministic = runSabsaInferenceLayers(payload, fmt);
    log("Running AI inference layer...", "info");
    const aiAnalysis = await runBackgroundThreatInference(payload, deterministic.deterministicAnalysis);

    // Composite risk via new risk-engine
    currentRisk = calculateCompositeRisk({
      mfaEnabled:          !!rules.flags.mfaEnabled,
      privilegedRole:      !!rules.flags.privilegedRole,
      excessivePermissions:!!rules.flags.excessivePermissions,
      publicExposure:      !!rules.flags.publicExposure,
      keyVaultPivot:       !!rules.flags.keyVaultPivot,
      storagePivot:        !!rules.flags.storagePivot,
      driftAlerts:          0,
      osintRisk:            0
    });

    applyGlobalState(currentRisk);

    // Zero-trust from legacy scorer for tab-1 score bar
    const legacyZts = calculateZeroTrustScore(rules.flags);
    updateScoreBar(legacyZts);
    const scoreEl = $("zeroTrustScore"); if (scoreEl) scoreEl.textContent = Math.round(legacyZts);

    // Risk badge
    const riskBadge = $("riskBadge");
    if (riskBadge) {
      riskBadge.textContent = currentRisk.level.toUpperCase();
      riskBadge.className = "badge badge-" + (currentRisk.level === "low" ? "ok" : currentRisk.level === "high" ? "warn" : "crit");
    }

    // AI output
    const merged = {
      object_type:       objectType,
      risk_score:        currentRisk.score,
      zero_trust_score:  currentRisk.zeroTrustScore,
      probability:       aiAnalysis.probability,
      mitre_technique:   aiAnalysis.mitre_technique,
      lateral_vector:    aiAnalysis.lateral_vector,
      attack_path:       aiAnalysis.attack_path,
    };
    const aiOut = $("aiAnalysisOutput");
    if (aiOut) aiOut.textContent = JSON.stringify(merged, null, 2);

    const narrative = buildRiskNarrative(currentRisk, rules.flags);
    const aiNarrEl  = $("aiNarrative");
    if (aiNarrEl) aiNarrEl.textContent = narrative;

    // Contextual IaC remediation via iac-generator
    const iacFix = generateContextualRemediation(rules.flags, fmt);
    const remEl  = $("remediationOutput");
    if (remEl) remEl.textContent = iacFix;

    log("[MITRE] " + (aiAnalysis.mitre_technique || "—"), "mitre");
    log("[RISK] " + currentRisk.level.toUpperCase() + " — score " + currentRisk.score, currentRisk.level === "critical" ? "threat" : "info");

    // Memory narrative
    const memory = persistOperationalContext({
      affectedUser:     payload.user || payload.servicePrincipal || payload.principalId || "—",
      affectedResource: payload.resource || payload.targetResource || "—",
      risk:             currentRisk.score,
      remediated:       currentRisk.score < 40
    });
    const memEl = $("operationalNarrative");
    if (memEl) memEl.textContent = buildOperationalNarrative(memory.current, memory.previous);

    // Attack graph on attack-graph tab
    const graphData = buildAttackGraph(payload, rules.flags);
    renderAttackGraph($("d3GraphContainer"), graphData, onGraphNodeClick);

  } finally {
    runBtn && (runBtn.disabled = false);
  }
}

async function sendWebhook() {
  const url     = $("webhookUrl")?.value?.trim();
  const statusEl = $("webhookStatus");
  if (!url)  { if (statusEl) statusEl.textContent = "URL required."; return; }
  if (!url.startsWith("https://")) { if (statusEl) statusEl.textContent = "Only HTTPS URLs allowed."; return; }

  try {
    if (statusEl) statusEl.textContent = "Sending…";
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event_type: "cspm-auto-remediate", client_payload: { risk: currentRisk } })
    });
    if (statusEl) statusEl.textContent = resp.ok ? "Dispatched (" + resp.status + ")." : "Failed: " + resp.status;
    log(resp.ok ? "[WEBHOOK] Remediation dispatched." : "[WEBHOOK] Dispatch failed: " + resp.status, resp.ok ? "ok" : "threat");
  } catch (e) {
    if (statusEl) statusEl.textContent = "Network error.";
    log("[WEBHOOK] " + e.message, "threat");
  }
}

/* ──────────────────────────────────────────────────────────────
   TAB 2 — ATTACK GRAPH
   ────────────────────────────────────────────────────────────── */
function onGraphNodeClick(node) {
  const panel  = $("nodeDetail");
  const title  = $("nodeDetailTitle");
  const mitre  = $("nodeDetailMitre");
  const prob   = $("nodeDetailProb");
  if (!panel) return;
  panel.hidden = false;
  if (title) title.textContent = node.label || node.id;
  if (mitre) mitre.textContent = node.mitre  ? "MITRE: " + node.mitre : "";
  if (prob)  prob.textContent  = node.risk   ? "Risk: " + node.risk + "%" : "";
  log("[GRAPH] Node selected: " + (node.label || node.id), "info");
}

function wireAttackGraph() {
  $("simulateAttackBtn")?.addEventListener("click", () => {
    const tech = $("attackTechniqueSelect")?.value || "T1078.004";
    const synth = {
      servicePrincipal: "spn-sim-attack",
      role: "Global Administrator",
      resource: "KeyVault-Prod",
      permissions: ["Owner","Storage Blob Data Owner"],
      mfa: "disabled"
    };
    const rules    = evaluateIdentityRules(synth);
    const graphData = buildAttackGraph(synth, rules.flags);
    renderAttackGraph($("d3GraphContainer"), graphData, onGraphNodeClick);
    log("[SIM] Attack simulation: " + tech, "mitre");
    applyGlobalState({ ...currentRisk, level: "critical", score: 85, zeroTrustScore: 15, breakdown: {} });
  });

  $("nodeDetailClose")?.addEventListener("click", () => { if ($("nodeDetail")) $("nodeDetail").hidden = true; });
}

/* ──────────────────────────────────────────────────────────────
   TAB 3 — THREAT INTEL
   ────────────────────────────────────────────────────────────── */
function wireThreatIntel() {
  $("syncMitreBtn")?.addEventListener("click", () => syncMitre());
  $("syncKevBtn")?.addEventListener("click",   () => syncKev());
  $("mitreSearch")?.addEventListener("input",  (e) => filterMitre(e.target.value));
}

async function syncMitre() {
  const badge = $("mitreSyncBadge");
  if (badge) { badge.textContent = "Syncing…"; badge.className = "badge badge-warn"; }
  log("[MITRE] Starting sync from STIX repository…", "info");
  try {
    await syncMitreAttack((msg) => log("[MITRE] " + msg, "info"));
    if (badge) { badge.textContent = "Synced"; badge.className = "badge badge-ok"; }
    renderMitreList(getTechniqueList());
    log("[MITRE] Sync complete.", "ok");
  } catch (e) {
    if (badge) { badge.textContent = "Error"; badge.className = "badge badge-crit"; }
    log("[MITRE] Sync failed: " + e.message, "threat");
    // Fallback: render built-in techniques
    renderMitreList(getTechniqueList());
  }
}

async function syncKev() {
  const badge = $("kevSyncBadge");
  if (badge) { badge.textContent = "Syncing…"; badge.className = "badge badge-warn"; }
  log("[CISA KEV] Fetching known exploited vulnerabilities…", "info");
  try {
    await syncCisaKev((msg) => log("[KEV] " + msg, "info"));
    const recent = getRecentKev(30);
    const cnt = $("kevCount"); if (cnt) cnt.textContent = recent.length + " entries (30 days)";
    if (badge) { badge.textContent = "Synced (" + recent.length + ")"; badge.className = "badge badge-ok"; }
    renderKevList(recent);
    log("[CISA KEV] Sync complete: " + recent.length + " recent entries.", "ok");
  } catch (e) {
    if (badge) { badge.textContent = "Error"; badge.className = "badge badge-crit"; }
    log("[CISA KEV] Sync failed: " + e.message, "threat");
  }
}

function renderMitreList(techniques) {
  const el = $("mitreList"); if (!el) return;
  el.innerHTML = techniques.slice(0, 60).map((t) =>
    `<div class="intel-item">
      <span class="intel-item-id">${t.id}</span>
      <span class="intel-item-name">${t.name}</span>
      <div class="intel-item-tactic">${(t.tactic || "").replace(/-/g," ").toUpperCase()}</div>
    </div>`
  ).join("");
}

function filterMitre(query) {
  if (!query) { renderMitreList(getTechniqueList()); return; }
  renderMitreList(searchMitreByKeyword(query));
}

function renderKevList(entries) {
  const el = $("kevList"); if (!el) return;
  el.innerHTML = entries.slice(0, 40).map((e) =>
    `<div class="intel-item">
      <span class="intel-item-cve">${e.cveID || "—"}</span>
      <span class="intel-item-name"> ${e.vulnerabilityName || "Unknown"}</span>
      <span class="intel-item-date">${(e.dateAdded || "").slice(0,10)}</span>
    </div>`
  ).join("");
}

/* ──────────────────────────────────────────────────────────────
   TAB 4 — DRIFT MONITOR
   ────────────────────────────────────────────────────────────── */
function wireDrift() {
  $("runDriftBtn")?.addEventListener("click",       () => runDriftScan());
  $("syntheticDriftBtn")?.addEventListener("click", () => loadSyntheticDrift());
}

async function runDriftScan() {
  log("[DRIFT] Fetching Azure Activity Logs via Graph API…", "drift");
  if (!isAuthenticated()) {
    log("[DRIFT] Not authenticated — use Azure Scanner tab to connect first.", "warn");
    loadSyntheticDrift(); return;
  }
  try {
    const events = await fetchAuditLogs(48);
    const drifts = analyzeActivityLogs(events);
    renderDrift(drifts);
  } catch (e) {
    log("[DRIFT] Scan error: " + e.message, "threat");
    loadSyntheticDrift();
  }
}

function loadSyntheticDrift() {
  const drifts = generateSyntheticDrifts();
  renderDrift(drifts);
  log("[DRIFT] Loaded synthetic demo data (" + drifts.length + " events).", "drift");
}

function renderDrift(drifts) {
  const summary = buildDriftSummary(drifts);
  const summaryEl = $("driftSummary");
  if (summaryEl) {
    summaryEl.hidden = false;
    summaryEl.innerHTML = `
      <div class="drift-sum-card crit"><span class="count">${summary.critical}</span>Critical</div>
      <div class="drift-sum-card high"><span class="count">${summary.high}</span>High</div>
      <div class="drift-sum-card med"> <span class="count">${summary.medium}</span>Medium</div>
      <div class="drift-sum-card total"><span class="count">${summary.total}</span>Total</div>`;
  }

  const feed = $("driftFeed"); if (!feed) return;
  feed.innerHTML = drifts.length ? "" : "<p class='muted-label'>No drift detected.</p>";
  drifts.forEach((d) => {
    const item = document.createElement("div");
    item.className = "drift-item " + (d.severity || "medium").toLowerCase();
    item.innerHTML = `
      <span class="drift-sev ${d.severity.toLowerCase()}">${d.severity}</span>
      <div class="drift-body">
        <div class="drift-msg">${d.message || d.pattern || "—"}</div>
        <div class="drift-meta">${d.resource || ""} &nbsp;·&nbsp; ${d.timestamp || ""} &nbsp;·&nbsp; ${d.callerIp || ""}</div>
      </div>`;
    feed.appendChild(item);
    log("[DRIFT] " + (d.severity || "").toUpperCase() + " — " + (d.message || d.pattern), "drift");
  });

  if (drifts.some((d) => d.severity === "critical")) {
    applyGlobalState({ ...currentRisk, level: "critical", score: 88, zeroTrustScore: 12, breakdown: {} });
  }
}

/* ──────────────────────────────────────────────────────────────
   TAB 5 — OSINT SCANNER
   ────────────────────────────────────────────────────────────── */
function wireOsint() {
  $("runOsintBtn")?.addEventListener("click", () => runOsint().catch((e) => log("[OSINT] " + e.message, "threat")));
}

async function runOsint() {
  const target  = $("osintTarget")?.value?.trim();
  const apiKey  = $("shodanKey")?.value?.trim();
  const proxy   = $("osintProxy")?.value?.trim();

  if (!target) { log("[OSINT] Target IP/domain required.", "warn"); return; }
  if (!apiKey)  { log("[OSINT] Shodan API key required.", "warn"); return; }

  log("[OSINT] Scanning " + target + " via Shodan API…", "info");
  const resultsPanel = $("osintResultsPanel");
  const narrativeEl  = $("osintNarrative");

  try {
    const result   = await shodanScan(target, apiKey, proxy || undefined);
    const summary  = buildOsintRiskSummary(result);
    const narrative = buildOsintNarrative(result, summary);

    if (narrativeEl) narrativeEl.textContent = narrative;
    if (resultsPanel) {
      resultsPanel.hidden = false;
      const titleEl = $("osintResultTitle");
      if (titleEl) titleEl.textContent = "OSINT: " + (result.ip || target);
      renderOsintResults($("osintResults"), result, summary);
    }

    log("[OSINT] Risk level: " + summary.riskLevel + " | Open ports: " + (result.data?.length || 0), summary.riskLevel === "critical" ? "threat" : "info");
  } catch (e) {
    if (narrativeEl) narrativeEl.textContent = "Scan failed: " + e.message + ". Check API key and proxy configuration.";
    log("[OSINT] " + e.message, "threat");
  }
}

function renderOsintResults(container, result, summary) {
  if (!container) return;
  const ports = (result.data || []).map((s) => s.port);
  container.innerHTML = `
    <div class="osint-stat-grid">
      <div class="osint-stat"><strong>${summary.openPorts}</strong>Open Ports</div>
      <div class="osint-stat"><strong>${summary.vulnCount}</strong>CVEs</div>
      <div class="osint-stat"><strong>${result.country_code || "—"}</strong>Country</div>
    </div>
    <div class="port-list">${ports.map((p) =>
      `<span class="port-tag ${[22,23,3389,445,1433].includes(p)?"danger":""}">${p}</span>`).join("")}
    </div>
    ${summary.findings.map((f) =>
      `<div class="osint-finding ${f.severity.toLowerCase()}">
         <div class="osint-finding-title">${f.title}</div>
         <div class="osint-finding-mitre">${f.mitre || ""}</div>
       </div>`).join("")}`;
}

/* ──────────────────────────────────────────────────────────────
   TAB 6 — BLUEPRINT ARCHITECT
   ────────────────────────────────────────────────────────────── */
function wireBlueprint() {
  const listEl = $("blueprintList");
  const blueprints = listBlueprints();

  if (listEl) {
    listEl.innerHTML = blueprints.map((b) =>
      `<div class="blueprint-item" data-id="${b.id}">
         ${b.name}
         <div class="blueprint-item-desc">${b.description}</div>
       </div>`
    ).join("");

    listEl.querySelectorAll(".blueprint-item").forEach((item) => {
      item.addEventListener("click", () => {
        listEl.querySelectorAll(".blueprint-item").forEach((i) => i.classList.remove("active"));
        item.classList.add("active");
        selectedBlueprint = item.dataset.id;
        renderBlueprint();
      });
    });
  }

  $("blueprintFormat")?.querySelector("select")?.addEventListener("change", () => renderBlueprint());
  $("copyBlueprintBtn")?.addEventListener("click", async () => {
    const text = $("blueprintOutput")?.textContent || "";
    try { await navigator.clipboard.writeText(text); log("[BLUEPRINT] Copied to clipboard.", "ok"); }
    catch { log("[BLUEPRINT] Clipboard unavailable.", "warn"); }
  });

  // Auto-select first
  if (blueprints.length) {
    selectedBlueprint = blueprints[0].id;
    listEl?.querySelector(".blueprint-item")?.classList.add("active");
    renderBlueprint();
  }
}

function renderBlueprint() {
  if (!selectedBlueprint) return;
  const fmt = $("blueprintFormat")?.querySelector("select")?.value || "terraform";
  const code = generateBlueprint(selectedBlueprint, fmt);
  const out  = $("blueprintOutput"); if (!out) return;
  out.textContent = code;

  // Update title/desc
  const bp   = listBlueprints().find((b) => b.id === selectedBlueprint);
  const title = $("blueprintTitle");
  const desc  = $("blueprintDesc");
  if (title && bp) title.textContent = bp.name;
  if (desc  && bp) desc.textContent  = bp.description;
  log("[BLUEPRINT] Loaded: " + selectedBlueprint + " (" + fmt + ")", "info");
}

/* ──────────────────────────────────────────────────────────────
   TAB 7 — DIGITAL TWIN
   ────────────────────────────────────────────────────────────── */
function wireTwin() {
  $("twinEnableMfa")?.addEventListener("click",     () => twinAction("enable-mfa"));
  $("twinScopeRole")?.addEventListener("click",     () => twinAction("scope-role"));
  $("twinRestrictPerm")?.addEventListener("click",  () => twinAction("restrict-permissions"));
  $("twinReset")?.addEventListener("click",         () => { digitalTwin.reset(); renderTwinState(); log("[TWIN] Reset.", "info"); });
  $("twinSimulateAttack")?.addEventListener("click",() => {
    const tech = $("twinAttackTech")?.value || "T1078.004";
    const result = digitalTwin.simulateAttack(tech);
    const resEl  = $("twinAttackResult");
    if (resEl) {
      resEl.innerHTML = `
        <div class="twin-prob">${Math.round(result.compromiseProbability * 100)}%</div>
        <div class="muted-label">Compromise probability for ${tech}</div>
        ${(result.attackSteps || []).map((s) => `<div class="twin-attack-step">${s}</div>`).join("")}`;
    }
    log("[TWIN] Attack simulated: " + tech + " — prob " + Math.round(result.compromiseProbability*100) + "%", "mitre");
  });

  // Load initial state from last analysis if available
  renderTwinState();
}

function twinAction(type) {
  const result = digitalTwin.simulateChange(type);
  const resEl  = $("twinSimResult");
  if (resEl) {
    resEl.textContent = result.message || "Change applied.";
    resEl.hidden = false;
  }
  renderTwinState();
  log("[TWIN] " + type + " applied. New score: " + result.newState?.zeroTrustScore, "ok");
}

function renderTwinState() {
  const stateEl     = $("twinState");
  const scoreValEl  = $("twinScoreValue");
  const state = digitalTwin.getState();
  if (!state || !stateEl) return;

  const identities = state.identities || [];
  stateEl.innerHTML = identities.slice(0, 6).map((id) =>
    `<div class="twin-identity">
      <span class="twin-identity-id">${id.id || id.principalId || "—"}</span>
      <span class="twin-identity-role"> / ${id.role || "—"}</span>
      <span class="${id.mfa ? "twin-identity-mfa-ok" : "twin-identity-mfa-bad"}"> MFA:${id.mfa ? "✓" : "✗"}</span>
    </div>`
  ).join("") || "<p class='muted-label'>Run Analyzer first to load identity data into the Twin.</p>";

  if (scoreValEl) scoreValEl.textContent = Math.round(state.zeroTrustScore || 100);
}

/* ──────────────────────────────────────────────────────────────
   TAB 8 — AZURE SCANNER (Graph API / PKCE)
   ────────────────────────────────────────────────────────────── */
function wireAzureScanner() {
  $("connectAzureBtn")?.addEventListener("click", () => connectAzure());
  $("disconnectAzureBtn")?.addEventListener("click", () => {
    disconnect();
    updateAzureStatus("disconnected");
    const panel = $("azureDataPanel"); if (panel) panel.hidden = true;
    log("[AZURE] Disconnected.", "info");
  });
}

function connectAzure() {
  const tenantId   = $("azTenantId")?.value?.trim();
  const clientId   = $("azClientId")?.value?.trim();
  const redirectUri = $("azRedirectUri")?.value?.trim() || window.location.href;

  if (!tenantId || !clientId) {
    log("[AZURE] Tenant ID and Client ID required.", "warn");
    updateAzureStatus("error");
    return;
  }
  updateAzureStatus("connecting");
  log("[AZURE] Initiating PKCE OAuth2 flow…", "info");
  initiateGraphLogin(clientId, tenantId, redirectUri);
}

async function handleAzureCallback() {
  if (!window.location.hash.includes("access_token") && !window.location.search.includes("code")) return;
  log("[AZURE] Auth callback detected — processing tokens…", "info");
  try {
    await handleAuthCallback({
      tenantId:    $("azTenantId")?.value?.trim()  || "",
      clientId:    $("azClientId")?.value?.trim()  || "",
      redirectUri: $("azRedirectUri")?.value?.trim() || window.location.href
    });
    updateAzureStatus("connected");
    log("[AZURE] Authentication successful.", "ok");
    await loadAzureResources();
  } catch (e) {
    updateAzureStatus("error");
    log("[AZURE] Auth failed: " + e.message, "threat");
  }
}

async function loadAzureResources() {
  log("[AZURE] Fetching Conditional Access Policies…", "info");
  try {
    const policies = await fetchConditionalAccessPolicies();
    renderCAPolicies(policies.value || []);
    const panel = $("azureDataPanel"); if (panel) panel.hidden = false;
    log("[AZURE] Loaded " + (policies.value?.length || 0) + " CA policies.", "ok");
  } catch (e) {
    log("[AZURE] " + e.message, "threat");
  }
}

function renderCAPolicies(policies) {
  const el = $("caPoliciesList"); if (!el) return;
  el.innerHTML = policies.map((p) => {
    const state = (p.state || "unknown").toLowerCase();
    return `<div class="ca-item">
      <span class="ca-item-name">${p.displayName || "—"}</span>
      <span class="ca-item-state ${state === "enabled" ? "enabled" : state === "disabled" ? "disabled" : "report"}">${state}</span>
      <div class="ca-item-grants">${JSON.stringify(p.grantControls?.builtInControls || [])}</div>
    </div>`;
  }).join("") || "<p class='muted-label'>No policies found.</p>";
}

function updateAzureStatus(status) {
  const el = $("azureStatus"); if (!el) return;
  el.className = "azure-status " + status;
  el.textContent = { connected: "Connected to Microsoft Graph API", disconnected: "Not connected",
    connecting: "Connecting…", error: "Authentication failed" }[status] || status;
}

/* ──────────────────────────────────────────────────────────────
   BOOT
   ────────────────────────────────────────────────────────────── */
async function boot() {
  initTabs();
  initConsole();
  initNightMode();
  initRadar();

  wireAnalyzer();
  wireAttackGraph();
  wireThreatIntel();
  wireDrift();
  wireOsint();
  wireBlueprint();
  wireTwin();
  wireAzureScanner();

  // Check if returning from Azure auth redirect
  await handleAzureCallback().catch(() => {});

  // Expose for inline onclick in HTML (legacy compat)
  window._cspm = { runAnalysis, onGraphNodeClick };

  log("[CSPM] Platform ready. Select a tab to begin.", "ok");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => boot().catch(() => {}));
} else {
  boot().catch(() => {});
}

