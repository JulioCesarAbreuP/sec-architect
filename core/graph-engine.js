export function buildAttackGraph(payload, flags) {
  const userNode = String(payload.user || payload.servicePrincipal || payload.principalId || payload.appId || "Identity");
  const roleNode = String(payload.role || payload.assignedRole || payload.roleDefinitionName || "Role");
  const resourceNode = String(payload.resource || payload.targetResource || payload.scope || "Resource");
  const exposureNode = !flags.mfaEnabled ? "MFA Disabled" : flags.hasExcessivePermissions ? "Permission Drift" : "Identity Exposure";
  const attackPathNode = flags.targetsKeyVault
    ? "Key Vault Pivot"
    : flags.targetsStorage
      ? "Storage Pivot"
      : "Control Plane Pivot";

  const nodes = [
    { id: "n1", label: userNode, type: "user" },
    { id: "n2", label: roleNode, type: "role" },
    { id: "n3", label: resourceNode, type: "resource" },
    { id: "n4", label: exposureNode, type: "exposure" },
    { id: "n5", label: attackPathNode, type: "path" }
  ];

  const edges = [
    { source: "n1", target: "n2" },
    { source: "n2", target: "n3" },
    { source: "n3", target: "n4" },
    { source: "n4", target: "n5" }
  ];

  return {
    nodes,
    edges,
    pathText: nodes.map((n) => n.label).join(" -> ")
  };
}
