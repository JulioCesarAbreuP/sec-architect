import { parseIdentityJson, validateIdentityObject } from "../identity-validator.js";
import { evaluateEntraRules } from "../rules-engine.js";
import { generateEntraTerraformFix } from "../remediation-engine.js";

export function evaluateEntraIdentity(parsedId) {
  var parsed = typeof parsedId === "string"
    ? parseIdentityJson(parsedId)
    : { ok: true, value: parsedId || {} };

  if (!parsed.ok) {
    return {
      radarLevel: "neutral",
      status: "error",
      riskScore: 0,
      logs: [{ level: "error", message: parsed.message || "[ERROR] JSON de Identidad No Válido" }],
      findings: [],
      remediation: { hasFix: false, terraform: "", primaryRole: "unknown", principal: "unknown" }
    };
  }

  var validation = validateIdentityObject(parsed.value);
  if (!validation.ok) {
    return {
      radarLevel: "neutral",
      status: "error",
      riskScore: 0,
      logs: (validation.errors || []).map(function (err) { return { level: "error", message: "[ERROR] " + err }; }),
      findings: [],
      remediation: { hasFix: false, terraform: "", primaryRole: "unknown", principal: "unknown" }
    };
  }

  var evaluated = evaluateEntraRules(validation.value);
  var terraformFix = generateEntraTerraformFix(validation.value, evaluated);
  return {
    radarLevel: evaluated.radarLevel,
    status: evaluated.status,
    riskScore: evaluated.riskScore,
    logs: (validation.warnings || []).map(function (warn) { return { level: "info", message: "[CHECK] " + warn }; }).concat(evaluated.logs || []),
    findings: evaluated.findings || [],
    remediation: {
      hasFix: Boolean(terraformFix),
      terraform: terraformFix,
      primaryRole: evaluated.context && evaluated.context.primaryRole ? evaluated.context.primaryRole : "unknown",
      principal: evaluated.context && evaluated.context.principal ? evaluated.context.principal : "unknown"
    }
  };
}
