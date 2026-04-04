const MITRE_TECHNIQUES = {
  T1078: { id: "T1078", name: "Valid Accounts" },
  "T1078.004": { id: "T1078.004", name: "Cloud Accounts" },
  T1556: { id: "T1556", name: "Modify Authentication Process" },
  T1548: { id: "T1548", name: "Abuse Elevation Control Mechanism" }
};

export function selectMitreTechnique(flags) {
  if (!flags.mfaEnforced) return MITRE_TECHNIQUES.T1556;
  if (flags.isGlobalAdmin && flags.targetsKeyVault) return MITRE_TECHNIQUES["T1078.004"];
  if (flags.hasDangerousRole || flags.hasExcessivePermissions) return MITRE_TECHNIQUES.T1548;
  return MITRE_TECHNIQUES.T1078;
}

export function buildGraph(flags, payload) {
  const user = String(payload.user || payload.servicePrincipal || payload.principalId || payload.appId || "unknown-identity");
  const role = String(payload.role || payload.roleDefinitionName || payload.assignedRole || "unknown-role");
  const resource = String(payload.resource || payload.scope || payload.targetResource || "unknown-resource");

  const exposure = !flags.mfaEnforced
    ? "MFA Disabled Exposure"
    : flags.hasExcessivePermissions
      ? "Permission Escalation Exposure"
      : "Managed Identity Exposure";

  const attackPath = flags.targetsKeyVault
    ? "Lateral movement towards Key Vault secrets"
    : flags.targetsStorage
      ? "Data plane pivot over Storage"
      : "Privilege propagation through control plane";

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
  if (flags.targetsKeyVault) return "Identity -> KeyVault";
  if (flags.targetsStorage) return "Identity -> Storage";
  return "Identity -> Control Plane";
}
