/**
 * risk-engine.js
 * Multi-dimensional composite risk scoring engine for the CSPM platform.
 * Produces a 0–100 risk score with per-dimension breakdown.
 */

// ── Dimension weights (must sum ≤ 100) ──────────────────────────────────────
const WEIGHT = {
  mfa:                  30,
  privilegedRole:       20,
  excessivePermissions: 15,
  publicExposure:       12,
  keyVaultPivot:        8,
  storagePivot:         6,
  driftAlerts:          6,
  osintRisk:            3
};

// ── Main scoring ─────────────────────────────────────────────────────────────

/**
 * @typedef {Object} RiskParams
 * @property {boolean} mfaEnabled
 * @property {boolean} hasPrivilegedRole
 * @property {boolean} hasExcessivePermissions
 * @property {boolean} hasPublicExposure
 * @property {boolean} targetsKeyVault
 * @property {boolean} targetsStorage
 * @property {number}  driftAlertCount
 * @property {"low"|"medium"|"high"|"critical"} osintLevel
 */

/**
 * @param {RiskParams} params
 * @returns {{ score: number, level: string, breakdown: Object, zeroTrustScore: number }}
 */
export function calculateCompositeRisk(params) {
  const {
    mfaEnabled            = false,
    hasPrivilegedRole      = false,
    hasExcessivePermissions = false,
    hasPublicExposure     = false,
    targetsKeyVault       = false,
    targetsStorage        = false,
    driftAlertCount       = 0,
    osintLevel            = "low"
  } = params;

  const breakdown = {
    mfa:                  mfaEnabled ? 0 : WEIGHT.mfa,
    privilegedRole:       hasPrivilegedRole ? WEIGHT.privilegedRole : 0,
    excessivePermissions: hasExcessivePermissions ? WEIGHT.excessivePermissions : 0,
    publicExposure:       hasPublicExposure ? WEIGHT.publicExposure : 0,
    keyVaultPivot:        targetsKeyVault ? WEIGHT.keyVaultPivot : 0,
    storagePivot:         targetsStorage ? WEIGHT.storagePivot : 0,
    driftAlerts:          Math.min(WEIGHT.driftAlerts, driftAlertCount * 2),
    osintRisk:            osintLevel === "critical" ? WEIGHT.osintRisk : osintLevel === "high" ? Math.ceil(WEIGHT.osintRisk * 0.6) : 0
  };

  const score = Object.values(breakdown).reduce((s, v) => s + v, 0);
  const clamped = Math.max(0, Math.min(100, score));

  return {
    score:          clamped,
    level:          riskLabel(clamped),
    breakdown,
    // Zero-Trust Score is the inverse risk (100 = fully hardened)
    zeroTrustScore: Math.max(0, 100 - clamped)
  };
}

// ── Labels ───────────────────────────────────────────────────────────────────

export function riskLabel(score) {
  if (score >= 70) return "CRITICAL";
  if (score >= 40) return "HIGH";
  if (score >= 20) return "MEDIUM";
  return "LOW";
}

export function zeroTrustLabel(score) {
  if (score >= 85) return "HARDENED";
  if (score >= 60) return "ADEQUATE";
  if (score >= 35) return "DEGRADED";
  return "CRITICAL";
}

// ── Narrative ────────────────────────────────────────────────────────────────

export function buildRiskNarrative(risk, flags) {
  const parts = [];

  if (!flags.mfaEnabled) {
    parts.push("MFA desactivada — vector primario de compromiso de identidad.");
  }
  if (flags.hasPrivilegedRole) {
    parts.push("Rol privilegiado activo — permite movimiento lateral sin restricción.");
  }
  if (flags.hasExcessivePermissions) {
    parts.push("Permisos excesivos — superficie de escalada de privilegios activa.");
  }

  const target = flags.targetsKeyVault
    ? "exfiltración de secretos via Key Vault"
    : flags.targetsStorage
      ? "pivote de datos via Storage Account"
      : "escalada de control plane";

  const steps = risk.score >= 70 ? "3" : risk.score >= 40 ? "5" : "7";
  parts.push(`Bajo configuración actual, un atacante puede lograr ${target} en ${steps} pasos.`);

  return parts.join(" ");
}

// ── Impact simulation ────────────────────────────────────────────────────────

/**
 * Simulate risk score after applying a specific fix type.
 */
export function simulateFixImpact(currentRisk, fixType) {
  const reductions = {
    "enable-mfa":          WEIGHT.mfa,
    "scope-role":          WEIGHT.privilegedRole,
    "scope-permissions":   WEIGHT.excessivePermissions,
    "network-hardening":   WEIGHT.publicExposure + Math.floor(WEIGHT.keyVaultPivot / 2),
    "keyvault-lock":       WEIGHT.keyVaultPivot,
    "full-remediation":    WEIGHT.mfa + WEIGHT.privilegedRole + WEIGHT.excessivePermissions
  };

  const reduction = reductions[fixType] ?? 10;
  const newScore  = Math.max(0, currentRisk.score - reduction);

  return {
    previousScore:    currentRisk.score,
    newScore,
    improvement:      currentRisk.score - newScore,
    newLevel:         riskLabel(newScore),
    newZeroTrust:     Math.max(0, 100 - newScore),
    newZtLabel:       zeroTrustLabel(Math.max(0, 100 - newScore))
  };
}
