import { selectMitreTechnique } from "./mitre-engine.js";

const DANGEROUS_ROLE = /(global\s*admin|owner|contributor|privileged\s*role\s*administrator)/i;
const ENTRA_CRITICAL_ROLE = /(global\s*administrator|global\s*admin|tenant\s*admin|privileged\s*role\s*administrator|privileged\s*authentication\s*administrator|security\s*administrator|conditional\s*access\s*administrator|exchange\s*administrator|sharepoint\s*administrator|teams\s*administrator|application\s*administrator|cloud\s*application\s*administrator|authentication\s*administrator|hybrid\s*identity\s*administrator|user\s*administrator|owner)/i;
const KEYVAULT = /(key\s*vault|kv)/i;
const STORAGE = /(storage|blob|data\s*lake)/i;

export function evaluateIdentityRules(payload) {
  const logs = [
    { level: "check", message: "[CHECK] Validating Identity Object..." }
  ];

  const role = String(payload.role || payload.assignedRole || payload.roleDefinitionName || "");
  const resource = String(payload.resource || payload.targetResource || payload.scope || "");
  const permissions = Array.isArray(payload.permissions) ? payload.permissions.map((x) => String(x)) : [];
  const mfa = String(payload.mfa || payload.authentication?.mfa || "").toLowerCase();
  const mfaEnabled = mfa === "enabled" || mfa === "enforced";

  const hasDangerousRole = DANGEROUS_ROLE.test(role);
  const hasExcessivePermissions = permissions.some((p) => DANGEROUS_ROLE.test(p));
  const targetsKeyVault = KEYVAULT.test(resource);
  const targetsStorage = STORAGE.test(resource);

  const findings = [];

  if (!mfaEnabled) {
    findings.push({
      id: "missing-mfa",
      severity: "critical",
      message: "MFA missing for privileged identity"
    });
    logs.push({ level: "fail", message: "[FAIL] Conditional Access Policy: MFA missing for Global Admin." });
  }

  if (hasDangerousRole) {
    findings.push({
      id: "dangerous-role",
      severity: "high",
      message: "Dangerous role assignment detected"
    });
    logs.push({ level: "fail", message: "[FAIL] Role assignment includes dangerous privileges." });
  }

  if (hasExcessivePermissions) {
    findings.push({
      id: "excessive-permissions",
      severity: "high",
      message: "Excessive permissions detected"
    });
    logs.push({ level: "fail", message: "[FAIL] Excessive permissions detected on identity object." });
  }

  const mitre = selectMitreTechnique({
    mfaEnforced: mfaEnabled,
    isGlobalAdmin: /global\s*admin/i.test(role),
    hasDangerousRole,
    hasExcessivePermissions,
    targetsKeyVault,
    targetsStorage
  });

  logs.push({ level: "mitre", message: "[MITRE] Mapping to " + mitre.id + " (" + mitre.name + ")." });

  return {
    findings,
    logs,
    flags: {
      mfaEnabled,
      hasDangerousRole,
      hasExcessivePermissions,
      targetsKeyVault,
      targetsStorage,
      role,
      resource,
      permissions,
      mitreTechnique: mitre.id
    }
  };
}

function normalizeRoleCandidates(payload) {
  const roles = [];
  if (payload && payload.role) roles.push(payload.role);
  if (payload && payload.directoryRole) roles.push(payload.directoryRole);
  if (payload && payload.privilege) roles.push(payload.privilege);
  if (Array.isArray(payload && payload.roles)) {
    payload.roles.forEach((role) => roles.push(role));
  }
  return roles.map((r) => String(r || "").trim()).filter(Boolean);
}

function calculateEntraRiskScore(riskReasons, isPrivilegedRole, mfaDisabled, mfaMissing, requireMfa) {
  let score = 0;
  if (isPrivilegedRole) score += 30;
  if (mfaDisabled) score += 45;
  else if (mfaMissing) score += 35;
  if (requireMfa === false) score += 25;
  if (!riskReasons.length) score = Math.max(score - 25, 0);
  return Math.min(score, 100);
}

export function evaluateEntraRules(payload) {
  const roleCandidates = normalizeRoleCandidates(payload);
  const primaryRole = roleCandidates[0] || "unknown";
  const principal = String(payload?.user || payload?.upn || payload?.account || payload?.identity || "unknown");
  const resource = String(payload?.resource || payload?.app || payload?.workload || "unknown");
  const accountType = String(payload?.accountType || payload?.account_type || "cloud").toLowerCase();
  const mfaRaw = typeof payload?.mfa === "undefined" ? "" : String(payload.mfa).toLowerCase();
  const policyObj = payload?.conditionalAccess || payload?.conditional_access || payload?.caPolicy || {};
  const requireMfa = typeof policyObj.requireMfa === "undefined" ? null : !!policyObj.requireMfa;

  const mfaEnabled = /^(enabled|true|on|yes|required)$/i.test(mfaRaw);
  const mfaMissing = mfaRaw === "" || /^(missing|null|unknown|n\/a)$/i.test(mfaRaw);
  const mfaDisabled = /^(disabled|false|off|no)$/i.test(mfaRaw);
  const isPrivilegedRole = roleCandidates.some((role) => ENTRA_CRITICAL_ROLE.test(String(role || "").toLowerCase()));

  const logs = [
    {
      level: "ok",
      message: "[CHECK] Validating Identity Object... principal=" + principal + ", role=" + primaryRole + ", rolesDetected=" + (roleCandidates.length || 1)
    }
  ];
  const findings = [];

  if (isPrivilegedRole && (mfaMissing || mfaDisabled)) {
    findings.push("privileged-role-without-mfa");
    logs.push({
      level: "error",
      message: "[FAIL] Conditional Access Policy: MFA missing for " + primaryRole + "."
    });
  }

  if (requireMfa === false) {
    findings.push("policy-does-not-require-mfa");
    logs.push({
      level: "error",
      message: "[FAIL] Conditional Access Policy: requireMfa=false for principal " + principal + "."
    });
  }

  let radarLevel = "neutral";
  if (!findings.length && (mfaEnabled || requireMfa === true)) {
    logs.push({
      level: "ok",
      message: "[CHECK] Conditional Access Policy: MFA satisfied for " + principal + "."
    });
    radarLevel = "safe";
  }
  if (findings.length) {
    radarLevel = "risk";
  }

  const technique = selectMitreTechnique({
    mfaEnforced: mfaEnabled,
    isGlobalAdmin: /global\s*admin(istrator)?/i.test(primaryRole),
    hasDangerousRole: isPrivilegedRole,
    hasExcessivePermissions: false,
    targetsKeyVault: /key\s*vault|kv/i.test(resource),
    targetsStorage: /storage|blob|data\s*lake/i.test(resource)
  });

  if (isPrivilegedRole || accountType === "cloud" || /azure|entra|o365|m365|cloud/i.test(resource)) {
    logs.push({
      level: findings.length ? "error" : "ok",
      message: "[MITRE] Mapping to " + technique.id + " (" + technique.name + "). principal=" + principal + ", resource=" + resource
    });
  }

  if (radarLevel === "neutral") {
    logs.push({
      level: "info",
      message: "[CHECK] Identity posture is indeterminate: mfa=" + (mfaRaw || "missing") + ", requireMfa=" + (requireMfa === null ? "undefined" : String(requireMfa))
    });
  }

  return {
    radarLevel,
    status: radarLevel === "risk" ? "warning" : radarLevel === "safe" ? "ok" : "warning",
    riskScore: calculateEntraRiskScore(findings, isPrivilegedRole, mfaDisabled, mfaMissing, requireMfa),
    findings,
    logs,
    context: {
      primaryRole,
      principal,
      resource,
      technique
    }
  };
}
