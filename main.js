import { runAzureInference } from "./core/sabsa-engine.js";
import { parseJsonPayload, validateConditionalAccessPolicy, buildPolicyRemediation } from "./core/json-validator.js";
import { decodeJwt, validateSc300Claims } from "./core/jwt-validator.js";
import { renderStatusBadge, renderResultBox, renderMitreFindings } from "./ui/renderer.js";
import { initIAPanel } from "./ui/panel-ia.js";
import { initJSONPanel } from "./ui/panel-json.js";
import { initJWTPanel } from "./ui/panel-jwt.js";

function invokeInferenceEngine(prompt) {
  if (window.copilot && typeof window.copilot.invoke === "function") {
    return window.copilot.invoke(prompt);
  }
  return Promise.reject(new Error("Copilot runtime no disponible"));
}

function buildSimplePrompt(title, input) {
  return [
    "Actua como motor de inferencia enterprise.",
    "Responde en JSON con campos: probabilidad, tecnicaMITRE, caminoAtaque, recomendacion.",
    "Tarea: " + title,
    "Entrada:",
    input
  ].join("\n");
}

function setCommandCenterStatus(element, tone, label) {
  renderStatusBadge(element, label, tone);
}

function boot() {
  const statusBadge = document.getElementById("command-status");
  const iaContainer = document.getElementById("panel-ia");
  const jsonContainer = document.getElementById("panel-json");
  const jwtContainer = document.getElementById("panel-jwt");
  const iaResult = document.getElementById("result-ia");
  const jsonResult = document.getElementById("result-json");
  const jwtResult = document.getElementById("result-jwt");
  const mitreResult = document.getElementById("result-mitre");

  let commandCenterTone = "ok";

  setCommandCenterStatus(statusBadge, "ok", "OPERATIONAL");

  initIAPanel(iaContainer, {
    onControl: async (input) => {
      try {
        const response = await invokeInferenceEngine(buildSimplePrompt("Control Mapper", input));
        renderResultBox(iaResult, "Control Mapper", response);
      } catch (error) {
        renderResultBox(iaResult, "Control Mapper", { error: error.message });
      }
    },
    onRisk: async (input) => {
      const parsed = parseJsonPayload(input);
      if (!parsed.ok) {
        renderResultBox(iaResult, "Risk Analyzer", parsed);
        return;
      }

      const result = await runAzureInference(parsed.value, invokeInferenceEngine);
      renderResultBox(iaResult, "Risk Analyzer", result.inference);
      renderMitreFindings(mitreResult, result.findings);

      commandCenterTone = result.findings.some((finding) => finding.severity === "critical") ? "critical" : commandCenterTone;
      setCommandCenterStatus(statusBadge, commandCenterTone, commandCenterTone === "critical" ? "AT RISK" : "OPERATIONAL");
    },
    onArchitecture: async (input) => {
      try {
        const response = await invokeInferenceEngine(buildSimplePrompt("Architecture Explainer", input));
        renderResultBox(iaResult, "Architecture Explainer", response);
      } catch (error) {
        renderResultBox(iaResult, "Architecture Explainer", { error: error.message });
      }
    }
  });

  initJSONPanel(jsonContainer, {
    onValidate: (input) => {
      const parsed = parseJsonPayload(input);
      if (!parsed.ok) {
        renderResultBox(jsonResult, "JSON Validation", parsed);
        return;
      }

      const validation = validateConditionalAccessPolicy(parsed.value);
      renderResultBox(jsonResult, "JSON Validation", validation);
      renderMitreFindings(mitreResult, validation.findings.filter((finding) => finding.type === "mitre"));

      const hasCritical = validation.findings.some((finding) => finding.severity === "critical");
      if (hasCritical) {
        commandCenterTone = "critical";
        setCommandCenterStatus(statusBadge, "critical", "AT RISK");
      }
    },
    onRemediate: (input, format) => {
      const parsed = parseJsonPayload(input);
      if (!parsed.ok) {
        renderResultBox(jsonResult, "Auto-Remediar", parsed);
        return;
      }

      const snippet = buildPolicyRemediation(parsed.value, format);
      renderResultBox(jsonResult, "Auto-Remediar", snippet);
    }
  });

  initJWTPanel(jwtContainer, {
    onValidate: (token) => {
      const decoded = decodeJwt(token);
      if (!decoded.ok) {
        renderResultBox(jwtResult, "JWT Validation", decoded);
        return;
      }

      const claims = validateSc300Claims(decoded.claims);
      renderResultBox(jwtResult, "JWT Validation", claims);

      if (!claims.hasMfa || claims.isExpired) {
        commandCenterTone = "critical";
        setCommandCenterStatus(statusBadge, "critical", claims.isExpired ? "JWT EXPIRED" : "SC-300 FAIL");
      }
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
