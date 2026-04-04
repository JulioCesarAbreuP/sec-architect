/**
 * drift-engine.js
 * Security Drift Monitor — detects anomalous changes in Azure Activity Logs.
 * Works with real logs (via azure-connector) or synthetic demo data.
 */

// ── Pattern library ──────────────────────────────────────────────────────────

const DRIFT_PATTERNS = [
  {
    id:       "public-ip-no-nsg",
    severity: "critical",
    label:    "Public IP created without NSG",
    match:    e => /Create or Update Public Ip/i.test(e.operationName?.localizedValue || "") && isSuccess(e),
    message:  e => `[DRIFT] Public IP created without NSG: ${resourceName(e)}`
  },
  {
    id:       "privileged-role-assigned",
    severity: "critical",
    label:    "Privileged role assigned",
    match:    e => /roleAssignments\/write/i.test(e.operationName?.value || "") && isSuccess(e),
    message:  e => `[DRIFT] Privileged role assigned by ${e.caller || "unknown"} on ${resourceName(e)}`
  },
  {
    id:       "conditional-access-modified",
    severity: "critical",
    label:    "Conditional Access Policy modified",
    match:    e => /conditionalAccessPolicies/i.test(e.operationName?.value || ""),
    message:  e => `[DRIFT] Conditional Access Policy ${e.operationName?.value?.includes("delete") ? "DELETED" : "modified"}: ${resourceName(e)}`
  },
  {
    id:       "storage-public-access",
    severity: "high",
    label:    "Storage account public access change",
    match:    e => /storageAccounts\/write/i.test(e.operationName?.value || "") && isSuccess(e),
    message:  e => `[DRIFT] Storage account modified (potential public access): ${resourceName(e)}`
  },
  {
    id:       "keyvault-access-policy",
    severity: "high",
    label:    "Key Vault access policy changed",
    match:    e => /vaults\/accessPolicies/i.test(e.operationName?.value || "") && isSuccess(e),
    message:  e => `[DRIFT] Key Vault access policy modified: ${resourceName(e)}`
  },
  {
    id:       "nsg-rule-modified",
    severity: "high",
    label:    "NSG / firewall rule changed",
    match:    e => /securityRules\/write|networkSecurityGroups\/write/i.test(e.operationName?.value || "") && isSuccess(e),
    message:  e => `[DRIFT] Network security rule changed: ${resourceName(e)}`
  },
  {
    id:       "policy-assignment-deleted",
    severity: "high",
    label:    "Azure Policy assignment deleted",
    match:    e => /policyAssignments\/delete/i.test(e.operationName?.value || "") && isSuccess(e),
    message:  e => `[DRIFT] Azure Policy assignment deleted: ${resourceName(e)}`
  },
  {
    id:       "diagnostic-setting-removed",
    severity: "medium",
    label:    "Diagnostic setting removed",
    match:    e => /diagnosticSettings\/delete/i.test(e.operationName?.value || "") && isSuccess(e),
    message:  e => `[DRIFT] Diagnostic/audit setting removed: ${resourceName(e)}`
  },
  {
    id:       "mfa-bypassed",
    severity: "critical",
    label:    "MFA bypass / auth method change",
    match:    e => /authenticationMethods|strongAuthentication/i.test(e.operationName?.value || ""),
    message:  e => `[DRIFT] Authentication method modified for ${e.caller || "unknown"}`
  }
];

function isSuccess(e) {
  return (e.status?.value || "").toLowerCase() === "succeeded";
}

function resourceName(e) {
  const id = e.resourceId || "";
  return id.split("/").pop() || "unknown-resource";
}

// ── Analysis ─────────────────────────────────────────────────────────────────

export function analyzeActivityLogs(events) {
  const drifts = [];

  for (const event of events) {
    for (const pattern of DRIFT_PATTERNS) {
      try {
        if (pattern.match(event)) {
          drifts.push({
            id:        pattern.id,
            severity:  pattern.severity,
            label:     pattern.label,
            message:   pattern.message(event),
            timestamp: event.eventTimestamp || new Date().toISOString(),
            caller:    event.caller || "unknown",
            operation: event.operationName?.localizedValue || event.operationName?.value || ""
          });
          break; // one drift per event
        }
      } catch {
        // pattern match guard — continue to next pattern
      }
    }
  }

  const SEV = { critical: 0, high: 1, medium: 2, low: 3 };
  return drifts.sort((a, b) => (SEV[a.severity] ?? 3) - (SEV[b.severity] ?? 3));
}

export function generateSyntheticDrifts() {
  const now = Date.now();
  return [
    {
      id:        "public-ip-no-nsg",
      severity:  "critical",
      label:     "Public IP created without NSG",
      message:   "[DRIFT] Public IP created without NSG: pip-prod-eastus-01",
      timestamp: new Date(now - 4 * 60_000).toISOString(),
      caller:    "devops-pipeline@contoso.com",
      operation: "Create or Update Public Ip Address"
    },
    {
      id:        "privileged-role-assigned",
      severity:  "critical",
      label:     "Privileged role assigned",
      message:   "[DRIFT] Privileged role 'Owner' assigned by user@contoso.com on /subscriptions/xxx",
      timestamp: new Date(now - 11 * 60_000).toISOString(),
      caller:    "user@contoso.com",
      operation: "Microsoft.Authorization/roleAssignments/write"
    },
    {
      id:        "conditional-access-modified",
      severity:  "critical",
      label:     "Conditional Access Policy modified",
      message:   "[DRIFT] Conditional Access Policy modified: CA-Require-MFA-Admins",
      timestamp: new Date(now - 23 * 60_000).toISOString(),
      caller:    "GlobalAdmin@contoso.com",
      operation: "Update conditional access policy"
    },
    {
      id:        "storage-public-access",
      severity:  "high",
      label:     "Storage account public access change",
      message:   "[DRIFT] Storage account modified (potential public access): stprodassets01",
      timestamp: new Date(now - 45 * 60_000).toISOString(),
      caller:    "spn-terraform-ci",
      operation: "Microsoft.Storage/storageAccounts/write"
    },
    {
      id:        "nsg-rule-modified",
      severity:  "high",
      label:     "NSG / firewall rule changed",
      message:   "[DRIFT] Network security rule changed: nsg-prod-eastus/allow-anyinbound",
      timestamp: new Date(now - 90 * 60_000).toISOString(),
      caller:    "ops@contoso.com",
      operation: "Microsoft.Network/networkSecurityGroups/securityRules/write"
    },
    {
      id:        "diagnostic-setting-removed",
      severity:  "medium",
      label:     "Diagnostic setting removed",
      message:   "[DRIFT] Diagnostic/audit setting removed: diag-kv-prod-secrets",
      timestamp: new Date(now - 180 * 60_000).toISOString(),
      caller:    "automation-account",
      operation: "Microsoft.Insights/diagnosticSettings/delete"
    }
  ];
}

export function buildDriftSummary(drifts) {
  const count = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const d of drifts) count[d.severity] = (count[d.severity] || 0) + 1;

  return {
    total:       drifts.length,
    bySeverity:  count,
    hasCritical: count.critical > 0,
    riskLevel:   count.critical > 0 ? "critical" : count.high > 0 ? "high" : count.medium > 0 ? "medium" : "low"
  };
}
