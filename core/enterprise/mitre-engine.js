const MITRE_MAP = {
  T1078: {
    id: "T1078",
    label: "Valid Accounts",
    narrative: "Uso de cuentas validas para persistencia y movimiento lateral."
  },
  T1078_004: {
    id: "T1078.004",
    label: "Cloud Accounts",
    narrative: "Abuso de cuentas cloud con privilegios elevados."
  },
  T1556: {
    id: "T1556",
    label: "Modify Authentication Process",
    narrative: "Debilitamiento o bypass del proceso de autenticacion."
  },
  T1548: {
    id: "T1548",
    label: "Abuse Elevation Control Mechanism",
    narrative: "Elevacion de privilegios por controles mal configurados."
  }
};

export function selectMitreTechnique(flags) {
  if (!flags.mfaEnforced) {
    return MITRE_MAP.T1556;
  }
  if (flags.isGlobalAdmin && flags.targetsKeyVault) {
    return MITRE_MAP.T1078_004;
  }
  if (flags.hasExcessivePermissions) {
    return MITRE_MAP.T1548;
  }
  return MITRE_MAP.T1078;
}

export function buildAttackPathGraph(semantic) {
  return {
    user: semantic.user,
    role: semantic.role,
    resource: semantic.resource,
    exposure: semantic.exposure,
    attackPath: semantic.attackPath
  };
}

export function buildAttackPathString(graph) {
  return [graph.user, graph.role, graph.resource, graph.exposure, graph.attackPath].join(" -> ");
}
