import { getThreatTechniqueScore } from "./threat-intel-engine.js";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number(value || 0)));
}

export function baseImpactFromTechnique(techniqueId) {
  if (techniqueId === "T1556") return 88;
  if (techniqueId === "T1078" || techniqueId === "T1078.004") return 84;
  if (techniqueId === "T1548") return 76;
  return 62;
}

export function calculateWeightedAttackImpact(options) {
  const techniqueId = String(options?.techniqueId || "").toUpperCase();
  const baseImpact = clamp(options?.baseImpact || baseImpactFromTechnique(techniqueId), 1, 99);
  const zeroTrustScore = clamp(options?.zeroTrustScore || 100, 0, 100);
  const intelScore = getThreatTechniqueScore(options?.intelSummary || {}, techniqueId);

  const posturePressure = Math.round((100 - zeroTrustScore) * 0.32);
  const intelPressure = Math.round(intelScore * 0.2);
  const weighted = Math.round(clamp(baseImpact + posturePressure + intelPressure, 1, 99));

  return {
    impact: weighted,
    components: {
      baseImpact,
      posturePressure,
      intelPressure,
      zeroTrustScore,
      intelScore
    }
  };
}
