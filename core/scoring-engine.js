export function calculateZeroTrustScore(flags) {
  let score = 100;

  if (!flags.mfaEnabled) score -= 55;
  if (flags.hasDangerousRole) score -= 20;
  if (flags.hasExcessivePermissions) score -= 15;
  if (flags.targetsKeyVault) score -= 8;
  if (flags.targetsStorage) score -= 6;

  return Math.max(0, Math.min(100, score));
}

export function applyFixImpact(previousScore) {
  return Math.max(0, Math.min(100, Number(previousScore || 0) + 18));
}

const PRIVILEGED_ROLE_IDS = new Set([
  "62e90394-69f5-4237-9190-012177145e10", // Global Administrator
  "194ae4cb-b126-40b2-bd5b-6091b380977d", // Security Administrator
  "729827e3-9c14-49f7-bb1b-9608f156bbb8", // Helpdesk Administrator
  "e8611ab8-c189-46e8-94e1-60213ab1f814", // Privileged Role Administrator
  "fdd7a751-b60b-444a-984c-02652fe8fa1c", // Conditional Access Administrator
  "158c047a-c907-4556-b7ef-446551a6b5f7"  // Cloud Application Administrator
]);

const PRIVILEGED_ROLE_NAME = /(global\s*admin|global\s*administrator|privileged\s*role\s*administrator|security\s*administrator|conditional\s*access\s*administrator|owner|tenant\s*admin)/i;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number(value || 0)));
}

function normalizePolicyArray(input) {
  if (Array.isArray(input)) {
    return input;
  }

  if (input && Array.isArray(input.value)) {
    return input.value;
  }

  if (input && typeof input === "object") {
    return [input];
  }

  return [];
}

function hasMfaControl(policy) {
  const controls = Array.isArray(policy?.grantControls?.builtInControls)
    ? policy.grantControls.builtInControls.map((item) => String(item || "").toLowerCase())
    : [];

  if (controls.includes("mfa")) {
    return true;
  }

  // Authentication strength can replace explicit MFA built-in control.
  return Boolean(policy?.grantControls?.authenticationStrength?.id || policy?.grantControls?.authenticationStrength?.displayName);
}

function isPrivilegedRole(role) {
  const normalized = String(role || "").trim();
  if (!normalized) return false;
  if (PRIVILEGED_ROLE_IDS.has(normalized.toLowerCase())) return true;
  return PRIVILEGED_ROLE_NAME.test(normalized);
}

function classifyPolicy(policy) {
  const state = String(policy?.state || "").toLowerCase();
  const users = policy?.conditions?.users || {};
  const apps = policy?.conditions?.applications || {};
  const locations = policy?.conditions?.locations || {};

  const includeUsers = Array.isArray(users.includeUsers) ? users.includeUsers : [];
  const includeRoles = Array.isArray(users.includeRoles) ? users.includeRoles : [];
  const includeApps = Array.isArray(apps.includeApplications) ? apps.includeApplications : [];
  const includeLocations = Array.isArray(locations.includeLocations) ? locations.includeLocations : [];

  const allUsersTargeted = includeUsers.some((item) => String(item).toLowerCase() === "all");
  const allAppsTargeted = includeApps.some((item) => String(item).toLowerCase() === "all");
  const allLocationsTargeted = includeLocations.some((item) => String(item).toLowerCase() === "all");
  const targetsExternalUsers = Boolean(users.includeGuestsOrExternalUsers);
  const targetsPrivilegedRoles = includeRoles.some((role) => isPrivilegedRole(role));

  return {
    hasMfa: hasMfaControl(policy),
    isEnabled: state === "enabled",
    isReportOnly: state === "enabledforreportingbutnotenforced",
    isDisabled: state === "disabled",
    allUsersTargeted,
    allAppsTargeted,
    allLocationsTargeted,
    targetsExternalUsers,
    targetsPrivilegedRoles,
    displayName: String(policy?.displayName || policy?.id || "Unnamed policy")
  };
}

export function calculateCaZeroTrustPosture(policiesInput) {
  const policies = normalizePolicyArray(policiesInput);
  const total = policies.length;

  if (!total) {
    return {
      score: 25,
      status: "critical",
      statusLabel: "Critical",
      generatedAt: new Date().toISOString(),
      metrics: {
        policyCount: 0,
        mfaCoverage: 0,
        privilegedRoleCoverage: 0,
        exposureBreadth: 0,
        reportOnlyCount: 0,
        disabledCount: 0
      },
      findings: [{ severity: "high", message: "No Conditional Access policies were detected from the tenant feed." }]
    };
  }

  const classified = policies.map((policy) => classifyPolicy(policy));
  const mfaCount = classified.filter((item) => item.hasMfa).length;
  const reportOnlyCount = classified.filter((item) => item.isReportOnly).length;
  const disabledCount = classified.filter((item) => item.isDisabled).length;
  const privilegedPolicies = classified.filter((item) => item.targetsPrivilegedRoles);
  const privilegedProtected = privilegedPolicies.filter((item) => item.hasMfa).length;
  const broadExposure = classified.filter((item) => item.allUsersTargeted || item.allAppsTargeted || item.allLocationsTargeted).length;
  const externalUnprotected = classified.filter((item) => item.targetsExternalUsers && !item.hasMfa).length;

  const mfaCoverage = Math.round((mfaCount / total) * 100);
  const privilegedRoleCoverage = privilegedPolicies.length
    ? Math.round((privilegedProtected / privilegedPolicies.length) * 100)
    : 100;
  const exposureBreadth = Math.round((broadExposure / total) * 100);

  let risk = 0;
  risk += (100 - mfaCoverage) * 0.45;
  risk += (100 - privilegedRoleCoverage) * 0.3;
  risk += exposureBreadth * 0.2;
  risk += (reportOnlyCount / total) * 12;
  risk += (disabledCount / total) * 18;
  risk += Math.min(15, externalUnprotected * 5);

  const score = Math.round(clamp(100 - risk, 0, 100));
  const status = score >= 80 ? "healthy" : score >= 50 ? "degraded" : "critical";
  const statusLabel = score >= 80 ? "Healthy" : score >= 50 ? "Degraded" : "Critical";

  const findings = [];

  if (mfaCoverage < 90) {
    findings.push({ severity: mfaCoverage < 70 ? "high" : "medium", message: "MFA enforcement covers only " + mfaCoverage + "% of CA policies." });
  }

  if (privilegedRoleCoverage < 100) {
    findings.push({ severity: "high", message: "Privileged roles are not fully protected by MFA-backed CA controls." });
  }

  if (exposureBreadth > 60) {
    findings.push({ severity: "medium", message: "Policy scope is broad (All users/apps/locations) in " + exposureBreadth + "% of policies." });
  }

  if (reportOnlyCount > 0) {
    findings.push({ severity: "medium", message: reportOnlyCount + " policy(s) are in report-only mode and not enforcing controls." });
  }

  if (disabledCount > 0) {
    findings.push({ severity: "high", message: disabledCount + " policy(s) are disabled and leave enforcement gaps." });
  }

  if (externalUnprotected > 0) {
    findings.push({ severity: "high", message: externalUnprotected + " external-user policy scope(s) lack MFA controls." });
  }

  if (!findings.length) {
    findings.push({ severity: "info", message: "CA posture shows strong MFA and privileged-role coverage with controlled exposure scope." });
  }

  return {
    score,
    status,
    statusLabel,
    generatedAt: new Date().toISOString(),
    metrics: {
      policyCount: total,
      mfaCoverage,
      privilegedRoleCoverage,
      exposureBreadth,
      reportOnlyCount,
      disabledCount
    },
    findings
  };
}
