export const MITRE_TECHNIQUES = {
  T1078: {
    id: "T1078",
    name: "Valid Accounts",
    tactic: "Defense Evasion / Initial Access",
    description: "Uso de cuentas validas para acceso y movimiento lateral."
  },
  T1556: {
    id: "T1556",
    name: "Modify Authentication Process",
    tactic: "Credential Access",
    description: "Manipulacion o debilitamiento del proceso de autenticacion."
  },
  T1110: {
    id: "T1110",
    name: "Brute Force",
    tactic: "Credential Access",
    description: "Intentos repetidos de autenticacion para comprometer credenciales."
  }
};

export function getTechniqueById(id) {
  return MITRE_TECHNIQUES[id] || null;
}

export function detectTechniquesFromAzureObject(azureObject) {
  const findings = [];
  const normalized = azureObject || {};
  const mfaDisabled = String(normalized.MFA_Status || "").toLowerCase() === "disabled";
  const role = String(normalized.role || normalized.Role || "").toLowerCase();

  if (mfaDisabled && role === "contributor") {
    findings.push({
      severity: "critical",
      techniqueId: "T1078",
      message: "Cuenta contributor sin MFA habilita riesgo de uso de cuentas validas."
    });
  }

  if (mfaDisabled) {
    findings.push({
      severity: "high",
      techniqueId: "T1556",
      message: "Proceso de autenticacion debilitado por ausencia de MFA."
    });
  }

  return findings;
}

export function detectTechniquesFromConditionalAccessPolicy(policy) {
  const rawGrantControls = policy?.grantControls;
  const grantControls = Array.isArray(rawGrantControls)
    ? rawGrantControls.map((value) => String(value).toLowerCase())
    : Array.isArray(rawGrantControls?.builtInControls)
      ? rawGrantControls.builtInControls.map((value) => String(value).toLowerCase())
      : [];

  if (!grantControls.includes("mfa")) {
    return [{
      severity: "critical",
      techniqueId: "T1556",
      message: "[CRITICAL] MITRE T1556 - Modify Authentication Process"
    }];
  }

  return [];
}
