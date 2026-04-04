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

  return {
    radarLevel: radarLevel,
    status: radarLevel === "risk" ? "warning" : radarLevel === "safe" ? "ok" : "warning",
    logs: logs
  };
}
