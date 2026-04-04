import { detectTechniquesFromConditionalAccessPolicy } from "./mitre-mapper.js";

export function parseJsonPayload(rawText) {
  try {
    return {
      ok: true,
      value: JSON.parse(rawText)
    };
  } catch (error) {
    return {
      ok: false,
      error: "invalid_json",
      message: error.message
    };
  }
}

export function validateConditionalAccessPolicy(policy) {
  const findings = [];

  if (!policy || typeof policy !== "object") {
    return {
      ok: false,
      findings: [{
        severity: "critical",
        type: "schema",
        message: "La politica no es un objeto JSON valido."
      }]
    };
  }

  if (!policy.displayName) {
    findings.push({
      severity: "medium",
      type: "schema",
      message: "displayName no esta definido."
    });
  }

  const mitreFindings = detectTechniquesFromConditionalAccessPolicy(policy);
  mitreFindings.forEach((item) => findings.push({ ...item, type: "mitre" }));

  return {
    ok: true,
    findings,
    policy
  };
}

export function buildPolicyRemediation(policy, format = "bicep") {
  const policyName = String(policy?.displayName || "policy-remediated");

  if (format === "terraform") {
    return [
      "resource \"azuread_conditional_access_policy\" \"remediated\" {",
      `  display_name = \"${policyName}\"`,
      "",
      "  grant_controls {",
      "    operator          = \"OR\"",
      "    built_in_controls = [\"mfa\"]",
      "  }",
      "}"
    ].join("\n");
  }

  return [
    "resource caPolicy 'Microsoft.Graph/identity/conditionalAccessPolicies@1.0' = {",
    `  name: '${policyName}'`,
    "  properties: {",
    "    grantControls: {",
    "      operator: 'OR'",
    "      builtInControls: [",
    "        'mfa'",
    "      ]",
    "    }",
    "  }",
    "}"
  ].join("\n");
}
