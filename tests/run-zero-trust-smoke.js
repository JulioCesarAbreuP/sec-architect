import assert from "node:assert/strict";

import { calculateCaZeroTrustPosture } from "../core/scoring-engine.js";

function buildPolicy(overrides = {}) {
  return {
    displayName: "CA-Policy",
    state: "enabled",
    grantControls: {
      builtInControls: ["mfa"]
    },
    conditions: {
      users: {
        includeUsers: ["All"],
        includeRoles: []
      },
      applications: {
        includeApplications: ["All"]
      },
      locations: {
        includeLocations: ["All"]
      }
    },
    ...overrides
  };
}

function main() {
  const empty = calculateCaZeroTrustPosture([]);
  assert.equal(empty.score, 25, "empty policy feed should return critical baseline score");

  const strong = calculateCaZeroTrustPosture([
    buildPolicy({
      conditions: {
        users: { includeUsers: ["All"], includeRoles: ["62e90394-69f5-4237-9190-012177145e10"] },
        applications: { includeApplications: ["All"] },
        locations: { includeLocations: ["All"], excludeLocations: ["AllTrusted"] }
      }
    }),
    buildPolicy({
      displayName: "CA-Admins-MFA",
      conditions: {
        users: { includeUsers: [], includeRoles: ["fdd7a751-b60b-444a-984c-02652fe8fa1c"] },
        applications: { includeApplications: ["Office365"] },
        locations: { includeLocations: ["All"] }
      }
    })
  ]);

  assert.ok(strong.score >= 70, "well-protected policy set should keep a high score");
  assert.equal(strong.metrics.mfaCoverage, 100, "MFA coverage should be full");
  assert.equal(strong.metrics.privilegedRoleCoverage, 100, "privileged roles should be fully protected");

  const weak = calculateCaZeroTrustPosture([
    buildPolicy({
      displayName: "CA-Weak-1",
      state: "disabled",
      grantControls: { builtInControls: [] },
      conditions: {
        users: {
          includeUsers: ["All"],
          includeGuestsOrExternalUsers: { guestOrExternalUserTypes: "b2bCollaborationGuest" },
          includeRoles: ["62e90394-69f5-4237-9190-012177145e10"]
        },
        applications: { includeApplications: ["All"] },
        locations: { includeLocations: ["All"] }
      }
    }),
    buildPolicy({
      displayName: "CA-Weak-2",
      state: "enabledForReportingButNotEnforced",
      grantControls: { builtInControls: [] }
    })
  ]);

  assert.ok(weak.score < 50, "weak policy set should be degraded or critical");
  assert.ok(weak.findings.some((finding) => finding.message.includes("Privileged roles")), "should report privileged role gap");
  assert.ok(weak.findings.some((finding) => finding.message.includes("report-only")), "should report report-only policies");

  console.log("Zero-trust scoring smoke tests passed.");
}

main();