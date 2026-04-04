function toTerraformSafeName(value) {
  return String(value || "identity")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48) || "identity";
}

function buildTerraformRemediation(principal, role, riskReasons) {
  var roleName = role || "Unknown Role";
  var resourceName = "enforce_mfa_" + toTerraformSafeName(roleName);
  var lines = [
    'resource "azuread_conditional_access_policy" "' + resourceName + '" {',
    '  display_name = "SEC_ARCHITECT - Enforce MFA for ' + roleName.replace(/"/g, "\\\"") + '"',
    '  state        = "enabled"',
    "",
    "  conditions {",
    "    users {",
    '      included_roles = ["' + roleName.replace(/"/g, "\\\"") + '"]',
    "    }",
    "  }",
    "",
    "  grant_controls {",
    '    operator          = "OR"',
    '    built_in_controls = ["mfa"]',
    "  }",
    "}",
    "",
    "# principal: " + principal,
    "# reasons: " + (riskReasons.length ? riskReasons.join(", ") : "none")
  ];

  return lines.join("\n");
}

export function evaluateEntraIdentity(parsedId) {
  var logs = [];
  var keys = Object.keys(parsedId || {});
  var principal = String(parsedId.user || parsedId.upn || parsedId.account || parsedId.identity || "unknown");
  var role = String(parsedId.role || parsedId.directoryRole || parsedId.privilege || "unknown");
  var roleNormalized = role.toLowerCase();
  var criticalRolePatterns = [
    /global administrator/i,
    /global admin/i,
    /tenant admin/i,
    /privileged role administrator/i,
    /privileged authentication administrator/i,
    /security administrator/i,
    /conditional access administrator/i,
    /exchange administrator/i,
    /sharepoint administrator/i,
    /teams administrator/i,
    /application administrator/i,
    /cloud application administrator/i,
    /authentication administrator/i,
    /hybrid identity administrator/i,
    /user administrator/i,
    /owner/i
  ];
  var mfaRaw = typeof parsedId.mfa === "undefined" ? "" : String(parsedId.mfa).toLowerCase();
  var policyObj = parsedId.conditionalAccess || parsedId.conditional_access || parsedId.caPolicy || {};
  var requireMfa = typeof policyObj.requireMfa === "undefined" ? null : !!policyObj.requireMfa;
  var resource = String(parsedId.resource || parsedId.app || parsedId.workload || "unknown");
  var accountType = String(parsedId.accountType || parsedId.account_type || "cloud").toLowerCase();
  var isPrivilegedRole = criticalRolePatterns.some(function (pattern) {
    return pattern.test(roleNormalized);
  });
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

  var hasFix = riskReasons.length > 0;
  var terraformFix = hasFix ? buildTerraformRemediation(principal, role, riskReasons) : "";

  return {
    radarLevel: radarLevel,
    status: radarLevel === "risk" ? "warning" : radarLevel === "safe" ? "ok" : "warning",
    logs: logs,
    findings: riskReasons,
    remediation: {
      hasFix: hasFix,
      terraform: terraformFix
    }
  };
}
