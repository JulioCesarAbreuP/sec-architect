/**
 * mitre-engine.js
 * MITRE ATT&CK technique catalog + graph/path constructor.
 * Covers cloud-focused techniques (Azure/Entra ID attack surface).
 */

const MITRE_TECHNIQUES = {
  "T1078":     { id: "T1078",     tactic: "initial-access",           name: "Valid Accounts",                                 risk: 75 },
  "T1078.004": { id: "T1078.004", tactic: "initial-access",           name: "Cloud Accounts",                                 risk: 84 },
  "T1556":     { id: "T1556",     tactic: "credential-access",        name: "Modify Authentication Process",                  risk: 88 },
  "T1556.006": { id: "T1556.006", tactic: "credential-access",        name: "Multi-Factor Authentication",                    risk: 90 },
  "T1548":     { id: "T1548",     tactic: "privilege-escalation",     name: "Abuse Elevation Control Mechanism",              risk: 76 },
  "T1548.005": { id: "T1548.005", tactic: "privilege-escalation",     name: "Temporary Elevated Cloud Access",                risk: 78 },
  "T1098":     { id: "T1098",     tactic: "persistence",              name: "Account Manipulation",                           risk: 72 },
  "T1098.001": { id: "T1098.001", tactic: "persistence",              name: "Additional Cloud Credentials",                   risk: 80 },
  "T1098.003": { id: "T1098.003", tactic: "persistence",              name: "Additional Cloud Roles",                         risk: 82 },
  "T1584":     { id: "T1584",     tactic: "resource-development",     name: "Compromise Infrastructure",                      risk: 65 },
  "T1136":     { id: "T1136",     tactic: "persistence",              name: "Create Account",                                 risk: 68 },
  "T1136.003": { id: "T1136.003", tactic: "persistence",              name: "Cloud Account",                                  risk: 72 },
  "T1530":     { id: "T1530",     tactic: "collection",               name: "Data from Cloud Storage",                        risk: 70 },
  "T1552":     { id: "T1552",     tactic: "credential-access",        name: "Unsecured Credentials",                          risk: 78 },
  "T1552.001": { id: "T1552.001", tactic: "credential-access",        name: "Credentials in Files",                           risk: 74 },
  "T1537":     { id: "T1537",     tactic: "exfiltration",             name: "Transfer Data to Cloud Account",                 risk: 73 },
  "T1190":     { id: "T1190",     tactic: "initial-access",           name: "Exploit Public-Facing Application",              risk: 85 },
  "T1526":     { id: "T1526",     tactic: "discovery",                name: "Cloud Service Discovery",                        risk: 48 },
  "T1580":     { id: "T1580",     tactic: "discovery",                name: "Cloud Infrastructure Discovery",                 risk: 52 },
  "T1538":     { id: "T1538",     tactic: "discovery",                name: "Cloud Service Dashboard",                        risk: 45 },
  "T1619":     { id: "T1619",     tactic: "discovery",                name: "Cloud Storage Object Discovery",                 risk: 50 },
  "T1021.007": { id: "T1021.007", tactic: "lateral-movement",         name: "Cloud Services (lateral movement)",             risk: 78 },
  "T1046":     { id: "T1046",     tactic: "discovery",                name: "Network Service Discovery",                      risk: 44 },
  "T1090":     { id: "T1090",     tactic: "command-and-control",      name: "Proxy",                                          risk: 60 },
  "T1567":     { id: "T1567",     tactic: "exfiltration",             name: "Exfiltration Over Web Service",                  risk: 68 },
  "T1485":     { id: "T1485",     tactic: "impact",                   name: "Data Destruction",                               risk: 92 },
  "T1489":     { id: "T1489",     tactic: "impact",                   name: "Service Stop",                                   risk: 80 },
  "T1562":     { id: "T1562",     tactic: "defense-evasion",          name: "Impair Defenses",                                risk: 75 },
  "T1562.008": { id: "T1562.008", tactic: "defense-evasion",          name: "Disable Cloud Logs",                             risk: 82 },
  "T1599":     { id: "T1599",     tactic: "defense-evasion",          name: "Network Boundary Bridging",                      risk: 66 }
};

export function selectMitreTechnique(flags) {
  if (!flags.mfaEnforced && flags.isGlobalAdmin) return MITRE_TECHNIQUES["T1556.006"];
  if (!flags.mfaEnforced) return MITRE_TECHNIQUES["T1556"];
  if (flags.isGlobalAdmin && flags.targetsKeyVault) return MITRE_TECHNIQUES["T1078.004"];
  if (flags.hasExcessivePermissions && flags.targetsKeyVault) return MITRE_TECHNIQUES["T1098.003"];
  if (flags.hasExcessivePermissions && flags.targetsStorage) return MITRE_TECHNIQUES["T1530"];
  if (flags.hasDangerousRole || flags.hasExcessivePermissions) return MITRE_TECHNIQUES["T1548"];
  return MITRE_TECHNIQUES["T1078"];
}

export function getTechnique(id) {
  return MITRE_TECHNIQUES[id] ?? null;
}

export function listTechniques() {
  return Object.values(MITRE_TECHNIQUES);
}

export function buildGraph(flags, payload) {
  const user = String(payload.user || payload.servicePrincipal || payload.principalId || payload.appId || "unknown-identity");
  const role = String(payload.role || payload.roleDefinitionName || payload.assignedRole || "unknown-role");
  const resource = String(payload.resource || payload.scope || payload.targetResource || "unknown-resource");

  const exposure = !flags.mfaEnforced
    ? "MFA Bypass Gate"
    : flags.hasExcessivePermissions
      ? "Permission Escalation Gate"
      : "Identity Control Plane";

  const attackPath = flags.targetsKeyVault
    ? "Key Vault Exfiltration"
    : flags.targetsStorage
      ? "Storage Data Pivot"
      : "Control Plane Pivot";

  return {
    user,
    role,
    resource,
    exposure,
    attackPath,
    orderedPath: [user, role, resource, exposure, attackPath]
  };
}

export function buildLateralVector(flags) {
  if (flags.targetsKeyVault) return "Identity → KeyVault → Secrets";
  if (flags.targetsStorage)  return "Identity → Storage → DataPlane";
  return "Identity → ControlPlane → Subscription";
}

export function getRiskForTechnique(techniqueId) {
  return MITRE_TECHNIQUES[techniqueId]?.risk ?? 50;
}
