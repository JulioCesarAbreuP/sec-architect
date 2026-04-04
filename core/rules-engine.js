import { selectMitreTechnique } from "./mitre-engine.js";

const DANGEROUS_ROLE = /(global\s*admin|owner|contributor|privileged\s*role\s*administrator)/i;
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
