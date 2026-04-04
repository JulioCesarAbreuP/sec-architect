import assert from "node:assert/strict";

import { calculateWeightedAttackImpact, baseImpactFromTechnique } from "../core/attack-weight-engine.js";
import { applyThreatIntelToPosture } from "../core/scoring-engine.js";

function main() {
  const base = baseImpactFromTechnique("T1556");
  assert.equal(base, 88, "T1556 baseline impact should match model");

  const noIntel = calculateWeightedAttackImpact({
    techniqueId: "T1556",
    zeroTrustScore: 90,
    intelSummary: null
  });

  const highIntel = calculateWeightedAttackImpact({
    techniqueId: "T1556",
    zeroTrustScore: 45,
    intelSummary: {
      techniqueRisk: {
        T1556: 95,
        "T1078.004": 88
      },
      topTechnique: { id: "T1556", risk: 95 }
    }
  });

  assert.ok(highIntel.impact > noIntel.impact, "intel + weak posture should increase attack impact");
  assert.ok(highIntel.components.intelPressure > 0, "intel pressure should be applied");
  assert.ok(highIntel.components.posturePressure > 0, "posture pressure should be applied");

  const posture = {
    score: 86,
    status: "healthy",
    statusLabel: "Healthy",
    findings: [],
    metrics: {
      policyCount: 4,
      mfaCoverage: 60,
      privilegedRoleCoverage: 50,
      exposureBreadth: 75,
      reportOnlyCount: 1,
      disabledCount: 1,
      externalUnprotectedCount: 1,
      intelPressure: 0,
      priorityTechnique: "n/a"
    }
  };

  const adjusted = applyThreatIntelToPosture(posture, {
    techniqueRisk: {
      T1556: 92,
      T1548: 84,
      "T1078.004": 90,
      T1078: 70
    },
    topTechnique: {
      id: "T1556",
      risk: 92
    }
  });

  assert.ok(adjusted.score < posture.score, "threat intel should reduce posture score when exposure intersects");
  assert.equal(adjusted.metrics.priorityTechnique, "T1556", "priority technique should be propagated");
  assert.ok(adjusted.findings.length > posture.findings.length, "intel adjustment should append findings");

  console.log("Attack weighting and threat-intel smoke tests passed.");
}

main();
