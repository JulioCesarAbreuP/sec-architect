import { analyzeRisk } from "../ai/risk-analyzer.module.js";
import { mapControl } from "../ai/control-mapper.module.js";
import { explainArchitecture } from "../ai/architecture-explainer.module.js";

var TRACE_STORAGE_KEY = "sec_architect_ai_trace_v1";
var MAX_TRACE_ITEMS = 8;
var TRACE_EXPORT_SCHEMA = {
  type: "object",
  required: ["exportedAt", "app", "traceCount", "schemaVersion", "traces"]
};

function byId(id) {
  return document.getElementById(id);
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeResult(result) {
  if (typeof result === "string") {
    return result;
  }

  try {
    return JSON.stringify(result, null, 2);
  } catch (_error) {
    return String(result);
  }
}

function safeStorage() {
  try {
    return window.sessionStorage;
  } catch (_error) {
    return null;
  }
}

function loadTraceStore() {
  var storage = safeStorage();

  if (!storage) {
    return [];
  }

  try {
    var raw = storage.getItem(TRACE_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    var parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter(function (item) {
        return item && typeof item.engine === "string" && typeof item.status === "string";
      })
      .slice(0, MAX_TRACE_ITEMS);
  } catch (_error) {
    return [];
  }
}

function saveTraceStore(traceStore) {
  var storage = safeStorage();

  if (!storage) {
    return;
  }

  try {
    storage.setItem(TRACE_STORAGE_KEY, JSON.stringify(traceStore.slice(0, MAX_TRACE_ITEMS)));
  } catch (_error) {
    // Ignore storage failures to keep panel interactive.
  }
}

function createLocalRequestId() {
  return "ui-req-" + Date.now() + "-" + Math.floor(Math.random() * 1000000);
}

function showAIModal(content) {
  var modal = document.createElement("div");
  var normalized = normalizeResult(content);

  modal.className = "ai-modal";
  modal.innerHTML = [
    '<div class="ai-modal-content" role="dialog" aria-modal="true" aria-label="Resultado IA">',
    "<h2>Resultado IA</h2>",
    "<pre>" + escapeHtml(normalized) + "</pre>",
    '<button type="button" class="ai-modal-close" id="close-ai-modal">Cerrar</button>',
    "</div>"
  ].join("");

  document.body.appendChild(modal);

  var closeBtn = byId("close-ai-modal");
  if (closeBtn) {
    closeBtn.onclick = function () {
      modal.remove();
    };
  }

  modal.addEventListener("click", function (event) {
    if (event.target === modal) {
      modal.remove();
    }
  });
}

function exportTraceStore(traceStore) {
  if (!traceStore.length) {
    showAIModal({
      ok: false,
      error: "trace_empty",
      message: "No hay trazas para exportar."
    });
    return;
  }

  var payload = {
    exportedAt: new Date().toISOString(),
    app: "SEC_ARCHITECT",
    schemaVersion: "1.0.0",
    traceCount: traceStore.length,
    traces: traceStore
  };

  var validation = validateTraceExportSchema(payload);
  if (!validation.valid) {
    showAIModal({
      ok: false,
      error: "trace_schema_invalid",
      message: "No se pudo exportar: el esquema de trazas no es valido.",
      details: validation.errors
    });
    return;
  }

  var blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  var url = window.URL.createObjectURL(blob);
  var link = document.createElement("a");

  link.href = url;
  link.download = "sec-architect-ai-traces-" + Date.now() + ".json";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

function validateTraceExportSchema(payload) {
  var errors = [];

  if (!payload || typeof payload !== "object") {
    return {
      valid: false,
      errors: ["El payload de exportacion no es un objeto valido."]
    };
  }

  TRACE_EXPORT_SCHEMA.required.forEach(function (field) {
    if (typeof payload[field] === "undefined") {
      errors.push("Falta campo requerido: " + field);
    }
  });

  if (typeof payload.exportedAt !== "string") {
    errors.push("exportedAt debe ser string ISO.");
  }

  if (payload.app !== "SEC_ARCHITECT") {
    errors.push("app debe ser SEC_ARCHITECT.");
  }

  if (typeof payload.traceCount !== "number") {
    errors.push("traceCount debe ser numerico.");
  }

  if (!Array.isArray(payload.traces)) {
    errors.push("traces debe ser un arreglo.");
  } else {
    payload.traces.forEach(function (trace, idx) {
      if (!trace || typeof trace !== "object") {
        errors.push("traces[" + idx + "] no es un objeto valido.");
        return;
      }

      ["engine", "status", "durationMs", "inputPreview", "requestId", "startedAt"].forEach(function (field) {
        if (typeof trace[field] === "undefined") {
          errors.push("traces[" + idx + "] falta campo: " + field);
        }
      });
    });
  }

  return {
    valid: errors.length === 0,
    errors: errors
  };
}

function resolveEngineName(activeTab) {
  if (activeTab === "risk") {
    return "risk-analyzer";
  }

  if (activeTab === "arch") {
    return "architecture-explainer";
  }

  return "control-mapper";
}

function renderTraceList(traceStore, filterStatus) {
  var traceList = byId("ai-trace-list");
  var visibleTraces = traceStore.filter(function (trace) {
    return !filterStatus || filterStatus === "all" ? true : trace.status === filterStatus;
  });

  if (!traceList) {
    return;
  }

  traceList.textContent = "";

  if (!visibleTraces.length) {
    var empty = document.createElement("li");
    empty.className = "ai-trace-empty";
    empty.textContent = "Sin ejecuciones aun.";
    traceList.appendChild(empty);
    return;
  }

  visibleTraces.forEach(function (trace) {
    var item = document.createElement("li");
    item.className = "ai-trace-item";

    var status = document.createElement("span");
    status.className = "ai-trace-status ai-trace-status-" + trace.status;
    status.textContent = trace.status.toUpperCase();

    var summary = document.createElement("span");
    summary.className = "ai-trace-summary";
    summary.textContent =
      "[" + trace.engine + "] " + trace.durationMs + "ms - " + trace.inputPreview +
      " (" + (trace.at || "N/D") + ") | requestId: " + (trace.requestId || "N/D");

    item.appendChild(status);
    item.appendChild(summary);
    traceList.appendChild(item);
  });
}

function resolveHandler(activeTab) {
  if (activeTab === "risk") {
    return analyzeRisk;
  }

  if (activeTab === "arch") {
    return explainArchitecture;
  }

  return mapControl;
}

function updateEntraRadar(level) {
  var fill   = byId("entra-arc-fill");
  var needle = byId("entra-needle");
  var label  = byId("entra-radar-label");
  if (!fill || !needle || !label) { return; }
  if (level === "safe") {
    fill.setAttribute("stroke", "#4ade80"); fill.setAttribute("stroke-dashoffset", "0");
    needle.setAttribute("x2", "20"); needle.setAttribute("y2", "90"); needle.setAttribute("stroke", "#4ade80");
    label.textContent = "MFA ENABLED \u2014 HARDENED"; label.className = "entra-radar-label entra-label-ok";
  } else if (level === "risk") {
    fill.setAttribute("stroke", "#f87171"); fill.setAttribute("stroke-dashoffset", "0");
    needle.setAttribute("x2", "140"); needle.setAttribute("y2", "90"); needle.setAttribute("stroke", "#f87171");
    label.textContent = "MFA DISABLED \u2014 CRITICAL RISK"; label.className = "entra-radar-label entra-label-crit";
  } else {
    fill.setAttribute("stroke", "#7e96ad"); fill.setAttribute("stroke-dashoffset", "102");
    needle.setAttribute("x2", "80"); needle.setAttribute("y2", "30"); needle.setAttribute("stroke", "#7e96ad");
    label.textContent = "AWAITING PAYLOAD"; label.className = "entra-radar-label";
  }
}

function logEntraConsole(message, level) {
  var list = byId("entra-console");
  if (!list) { return; }
  var li = document.createElement("li");
  li.className = "entra-console-line entra-console-" + (level || "info");
  var ts = new Date().toLocaleTimeString("es-ES", { hour12: false });
  li.textContent = "[" + ts + "] " + message;
  list.insertBefore(li, list.firstChild);
  while (list.children.length > 10) { list.removeChild(list.lastChild); }
}

function setEntraMode(active) {
  var entraEngine = byId("entra-engine");
  var runBtnEl    = byId("ai-run");
  var inputEl     = byId("ai-input");
  if (entraEngine) { entraEngine.hidden = !active; }
  if (inputEl) {
    if (active) {
      inputEl.classList.add("entra-active");
      inputEl.placeholder = 'Pega un objeto Entra ID (JSON)\n\nEjemplo:\n{"user":"john@contoso.com","role":"Global Administrator","mfa":"disabled","resource":"KeyVault-Prod"}';
    } else {
      inputEl.classList.remove("entra-active");
      inputEl.placeholder = "Introduce un control, riesgo o componente...";
    }
  }
  if (runBtnEl) { runBtnEl.textContent = active ? "Analyze Payload" : "Ejecutar IA"; }
  if (!active) { updateEntraRadar("neutral"); }
}

function evaluateEntraIdentity(parsedId) {
  var logs = [];
  var keys = Object.keys(parsedId || {});
  var principal = String(parsedId.user || parsedId.upn || parsedId.account || parsedId.identity || "unknown");
  var role = String(parsedId.role || parsedId.directoryRole || parsedId.privilege || "unknown");
  var mfaRaw = typeof parsedId.mfa === "undefined" ? "" : String(parsedId.mfa).toLowerCase();
  var policyObj = parsedId.conditionalAccess || parsedId.conditional_access || parsedId.caPolicy || {};
  var requireMfa = typeof policyObj.requireMfa === "undefined" ? null : !!policyObj.requireMfa;
  var resource = String(parsedId.resource || parsedId.app || parsedId.workload || "unknown");
  var accountType = String(parsedId.accountType || parsedId.account_type || "cloud").toLowerCase();
  var isPrivilegedRole = /(global admin|administrator|privileged|owner|security admin|tenant admin)/i.test(role);
  var mfaEnabled = /^(enabled|true|on|yes|required)$/i.test(mfaRaw);
  var mfaMissing = mfaRaw === "" || /^(missing|null|unknown|n\/a)$/i.test(mfaRaw);
  var mfaDisabled = /^(disabled|false|off|no)$/i.test(mfaRaw);
  var riskReasons = [];
  var radarLevel = "neutral";

  logs.push({
    level: "ok",
    message: "[CHECK] Validating Identity Object... principal=" + principal + ", role=" + role + ", keys=" + keys.length
  });

  if (isPrivilegedRole && (mfaMissing || mfaDisabled)) {
    riskReasons.push("privileged-role-without-mfa");
    logs.push({
      level: "error",
      message: "[FAIL] Conditional Access Policy: MFA missing for " + role + "."
    });
  }

  if (requireMfa === false) {
    riskReasons.push("policy-does-not-require-mfa");
    logs.push({
      level: "error",
      message: "[FAIL] Conditional Access Policy: requireMfa=false for principal " + principal + "."
    });
  }

  if (!riskReasons.length && (mfaEnabled || requireMfa === true)) {
    logs.push({
      level: "ok",
      message: "[CHECK] Conditional Access Policy: MFA satisfied for " + principal + "."
    });
    radarLevel = "safe";
  }

  if (riskReasons.length) {
    radarLevel = "risk";
  }

  if (isPrivilegedRole || accountType === "cloud" || /azure|entra|o365|m365|cloud/i.test(resource)) {
    logs.push({
      level: riskReasons.length ? "error" : "ok",
      message: "[MITRE] Mapping to T1078.004 (Cloud Accounts). principal=" + principal + ", resource=" + resource
    });
  }

  if (radarLevel === "neutral") {
    logs.push({
      level: "info",
      message: "[CHECK] Identity posture is indeterminate: mfa=" + (mfaRaw || "missing") + ", requireMfa=" + (requireMfa === null ? "undefined" : String(requireMfa))
    });
  }

  return {
    radarLevel: radarLevel,
    status: radarLevel === "risk" ? "warning" : radarLevel === "safe" ? "ok" : "warning",
    logs: logs
  };
}

export function initAIPanel() {
  var container = byId("ai-panel-container");
  var traceStore = loadTraceStore();
  var traceFilter = "all";

  if (!container) {
    return;
  }

  container.innerHTML = [
    '<div class="ai-panel">',
    '<div class="ai-tabs" role="tablist" aria-label="Motores IA">',
    '<button type="button" class="ai-tab active" data-tab="control" role="tab" aria-selected="true">Control Mapper</button>',
    '<button type="button" class="ai-tab" data-tab="risk" role="tab" aria-selected="false">Risk Analyzer</button>',
    '<button type="button" class="ai-tab" data-tab="arch" role="tab" aria-selected="false">Architecture Explainer</button>',
    '<button type="button" class="ai-tab" data-tab="entra" role="tab" aria-selected="false">Entra ID</button>',
    "</div>",
    '<div class="ai-content">',
    '<textarea id="ai-input" placeholder="Introduce un control, riesgo o componente..." aria-label="Entrada para IA"></textarea>',
    '<button type="button" id="ai-run">Ejecutar IA</button>',
    '<div id="entra-engine" class="entra-engine" hidden>',
    '<div class="entra-radar-shell">',
    '<svg class="entra-radar-svg" viewBox="0 0 160 90" aria-hidden="true">',
    '<path d="M 15 90 A 65 65 0 0 1 145 90" fill="none" stroke="#1a2530" stroke-width="10" stroke-linecap="round"/>',
    '<text x="10" y="86" font-size="8" fill="#4ade80" font-family="monospace">SAFE</text>',
    '<text x="124" y="86" font-size="8" fill="#f87171" font-family="monospace">RISK</text>',
    '<path id="entra-arc-fill" d="M 15 90 A 65 65 0 0 1 145 90" fill="none" stroke="#7e96ad" stroke-width="8" stroke-linecap="round" stroke-dasharray="204" stroke-dashoffset="102"/>',
    '<line id="entra-needle" x1="80" y1="90" x2="80" y2="30" stroke="#7e96ad" stroke-width="2.5" stroke-linecap="round"/>',
    '<circle cx="80" cy="90" r="4" fill="#e0e0e0"/>',
    '</svg>',
    '<div class="entra-radar-label" id="entra-radar-label">AWAITING PAYLOAD</div>',
    '</div>',
    '<ul class="entra-console" id="entra-console"></ul>',
    '</div>',
    "</div>",
    '<div class="ai-trace">',
    '<div class="ai-trace-header">',
    "<h3>Trazabilidad</h3>",
    '<div class="ai-trace-controls">',
    '<label for="ai-trace-filter">Filtro</label>',
    '<select id="ai-trace-filter">',
    '<option value="all">Todos</option>',
    '<option value="ok">OK</option>',
    '<option value="warning">Warning</option>',
    '<option value="error">Error</option>',
    "</select>",
    '<button type="button" id="ai-trace-clear" class="ai-trace-clear">Limpiar</button>',
    '<button type="button" id="ai-trace-export" class="ai-trace-export">Exportar JSON</button>',
    "</div>",
    "</div>",
    '<ul id="ai-trace-list" class="ai-trace-list"></ul>',
    "</div>",
    "</div>"
  ].join("");

  var activeTab = "control";
  var tabs = container.querySelectorAll(".ai-tab");
  var runBtn = byId("ai-run");
  var input = byId("ai-input");
  var traceFilterSelect = byId("ai-trace-filter");
  var traceClearBtn = byId("ai-trace-clear");
  var traceExportBtn = byId("ai-trace-export");

  if (traceFilterSelect) {
    traceFilterSelect.value = traceFilter;
    traceFilterSelect.onchange = function () {
      traceFilter = traceFilterSelect.value || "all";
      renderTraceList(traceStore, traceFilter);
    };
  }

  if (traceClearBtn) {
    traceClearBtn.onclick = function () {
      traceStore = [];
      saveTraceStore(traceStore);
      renderTraceList(traceStore, traceFilter);
    };
  }

  if (traceExportBtn) {
    traceExportBtn.onclick = function () {
      exportTraceStore(traceStore);
    };
  }

  renderTraceList(traceStore, traceFilter);

  tabs.forEach(function (tab) {
    tab.onclick = function () {
      activeTab = tab.getAttribute("data-tab") || "control";

      tabs.forEach(function (t) {
        t.classList.remove("active");
        t.setAttribute("aria-selected", "false");
      });

      tab.classList.add("active");
      tab.setAttribute("aria-selected", "true");
      setEntraMode(activeTab === "entra");
    };
  });

  if (runBtn) {
    runBtn.onclick = async function () {
      var inputValue = String((input && input.value) || "").trim();
      var startedAt = Date.now();
      var engine = resolveEngineName(activeTab);

      if (!inputValue) {
        return;
      }

      if (activeTab === "entra") {
        var parsedId;
        var evaluation;
        var i;
        try {
          parsedId = JSON.parse(inputValue);
        } catch (_e) {
          logEntraConsole("[ERROR] JSON de Identidad No V\u00e1lido", "error");
          updateEntraRadar("neutral");
          traceStore.unshift({ engine: "entra-id-validator", status: "error", durationMs: Date.now() - startedAt, inputPreview: inputValue.slice(0, 90), at: new Date().toLocaleTimeString("es-ES"), requestId: createLocalRequestId(), startedAt: new Date(startedAt).toISOString() });
          traceStore = traceStore.slice(0, MAX_TRACE_ITEMS); saveTraceStore(traceStore); renderTraceList(traceStore, traceFilter);
          return;
        }

        evaluation = evaluateEntraIdentity(parsedId);
        updateEntraRadar(evaluation.radarLevel);
        for (i = 0; i < evaluation.logs.length; i += 1) {
          logEntraConsole(evaluation.logs[i].message, evaluation.logs[i].level);
        }

        traceStore.unshift({ engine: "entra-id-validator", status: evaluation.status, durationMs: Date.now() - startedAt, inputPreview: inputValue.slice(0, 90), at: new Date().toLocaleTimeString("es-ES"), requestId: createLocalRequestId(), startedAt: new Date(startedAt).toISOString() });
        traceStore = traceStore.slice(0, MAX_TRACE_ITEMS); saveTraceStore(traceStore); renderTraceList(traceStore, traceFilter);
        return;
      }

      runBtn.disabled = true;
      runBtn.textContent = "Ejecutando...";

      try {
        var handler = resolveHandler(activeTab);
        var result = await handler(inputValue);

        traceStore.unshift({
          engine: engine,
          status: result && result.ok === false ? "warning" : "ok",
          durationMs: Date.now() - startedAt,
          inputPreview: inputValue.slice(0, 90),
          at: new Date().toLocaleTimeString("es-ES"),
          requestId: (result && result.requestId) || createLocalRequestId(),
          startedAt: (result && result.startedAt) || new Date(startedAt).toISOString()
        });
        traceStore = traceStore.slice(0, MAX_TRACE_ITEMS);
        saveTraceStore(traceStore);
        renderTraceList(traceStore, traceFilter);

        showAIModal(result);
      } catch (error) {
        traceStore.unshift({
          engine: engine,
          status: "error",
          durationMs: Date.now() - startedAt,
          inputPreview: inputValue.slice(0, 90),
          at: new Date().toLocaleTimeString("es-ES"),
          requestId: createLocalRequestId(),
          startedAt: new Date(startedAt).toISOString()
        });
        traceStore = traceStore.slice(0, MAX_TRACE_ITEMS);
        saveTraceStore(traceStore);
        renderTraceList(traceStore, traceFilter);

        showAIModal({
          ok: false,
          error: "ai_execution_failed",
          message: "No fue posible completar la ejecucion del motor.",
          detail: error && error.message ? error.message : "unknown"
        });
      } finally {
        runBtn.disabled = false;
        runBtn.textContent = "Ejecutar IA";
      }
    };
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAIPanel);
} else {
  initAIPanel();
}
