import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { parseJsonPayload, validateConditionalAccessPolicy, buildPolicyRemediation } from "../core/json-validator.js";
import { decodeJwt, validateSc300Claims } from "../core/jwt-validator.js";
import {
  detectTechniquesFromAzureObject,
  detectTechniquesFromConditionalAccessPolicy,
  getTechniqueById
} from "../core/mitre-mapper.js";

const currentDir = path.dirname(fileURLToPath(import.meta.url));

function toBase64Url(value) {
  return Buffer.from(JSON.stringify(value), "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function buildJwt(payload) {
  const header = { alg: "none", typ: "JWT" };
  return [toBase64Url(header), toBase64Url(payload), "signature"].join(".");
}

async function loadFixture(name) {
  const filePath = path.join(currentDir, "fixtures", name);
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw);
}

async function main() {
  const noMfaPolicy = await loadFixture("enterprise-ca-policy.no-mfa.json");
  const withMfaPolicy = await loadFixture("enterprise-ca-policy.with-mfa.json");

  const parsed = parseJsonPayload(JSON.stringify(withMfaPolicy));
  assert.equal(parsed.ok, true, "valid JSON payload should parse");

  const invalidParsed = parseJsonPayload("{invalid-json}");
  assert.equal(invalidParsed.ok, false, "invalid JSON should fail parsing");

  const validationNoMfa = validateConditionalAccessPolicy(noMfaPolicy);
  assert.equal(validationNoMfa.ok, true, "policy object should validate structurally");
  assert.ok(
    validationNoMfa.findings.some((finding) => finding.techniqueId === "T1556"),
    "policy without MFA should map to T1556"
  );

  const validationWithMfa = validateConditionalAccessPolicy(withMfaPolicy);
  assert.equal(validationWithMfa.findings.length, 0, "policy with MFA should not emit findings");

  const directMitreFindings = detectTechniquesFromConditionalAccessPolicy(noMfaPolicy);
  assert.equal(directMitreFindings.length, 1, "direct MITRE detection should emit one critical finding");

  const azureObjectFindings = detectTechniquesFromAzureObject({ MFA_Status: "Disabled", role: "Contributor" });
  assert.ok(
    azureObjectFindings.some((finding) => finding.techniqueId === "T1078"),
    "disabled MFA contributor should map to T1078"
  );

  assert.equal(getTechniqueById("T1556")?.name, "Modify Authentication Process", "MITRE dictionary should resolve T1556");

  const bicepRemediation = buildPolicyRemediation(noMfaPolicy, "bicep");
  assert.match(bicepRemediation, /builtInControls/i, "Bicep remediation should require MFA");

  const terraformRemediation = buildPolicyRemediation(noMfaPolicy, "terraform");
  assert.match(terraformRemediation, /built_in_controls = \["mfa"\]/i, "Terraform remediation should require MFA");

  const validToken = buildJwt({
    scp: "User.Read",
    roles: ["SecurityReader"],
    amr: ["pwd", "mfa"],
    exp: Math.floor(Date.now() / 1000) + 3600
  });
  const decodedValid = decodeJwt(validToken);
  assert.equal(decodedValid.ok, true, "valid JWT should decode");

  const validClaims = validateSc300Claims(decodedValid.claims);
  assert.equal(validClaims.commandCenterStatus, "pass", "MFA-enabled active token should pass");
  assert.equal(validClaims.isExpired, false, "future token should not be expired");

  const expiredToken = buildJwt({
    scp: "User.Read",
    amr: ["pwd"],
    exp: Math.floor(Date.now() / 1000) - 60
  });
  const decodedExpired = decodeJwt(expiredToken);
  assert.equal(decodedExpired.ok, true, "expired JWT should still decode");

  const expiredClaims = validateSc300Claims(decodedExpired.claims);
  assert.equal(expiredClaims.commandCenterStatus, "fail", "expired token should fail SC-300 validation");
  assert.equal(expiredClaims.isExpired, true, "expired token should be marked expired");
  assert.equal(expiredClaims.hasMfa, false, "token without MFA claim should fail MFA validation");

  console.log("Enterprise smoke tests passed.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});