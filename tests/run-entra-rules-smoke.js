import assert from "node:assert/strict";

import { parseIdentityJson, validateIdentityObject } from "../core/identity-validator.js";
import { evaluateEntraRules } from "../core/rules-engine.js";
import { generateEntraTerraformFix } from "../core/remediation-engine.js";

function hasLog(result, prefix) {
  return result.logs.some(function (entry) {
    return typeof entry.message === "string" && entry.message.indexOf(prefix) !== -1;
  });
}

function main() {
  var disabledGlobalAdmin = {
    user: "john@contoso.com",
    role: "Global Admin",
    mfa: "disabled",
    conditionalAccess: { requireMfa: true },
    resource: "Entra Portal",
    accountType: "cloud"
  };

  var enabledGlobalAdmin = {
    user: "john@contoso.com",
    role: "Global Admin",
    mfa: "enabled",
    conditionalAccess: { requireMfa: true },
    resource: "Entra Portal",
    accountType: "cloud"
  };

  var disabledPrivilegedRoleAdmin = {
    user: "pra@contoso.com",
    role: "Privileged Role Administrator",
    mfa: "disabled",
    conditionalAccess: { requireMfa: true },
    resource: "Entra Portal",
    accountType: "cloud"
  };

  var securityAdminFromRolesArray = {
    user: "secadmin@contoso.com",
    roles: ["Security Administrator", "Reader"],
    mfa: "disabled",
    conditionalAccess: { requireMfa: true },
    resource: "Azure Portal",
    accountType: "cloud"
  };

  var parsedDisabled = parseIdentityJson(JSON.stringify(disabledGlobalAdmin));
  assert.equal(parsedDisabled.ok, true, "disabled payload JSON must parse");
  var validatedDisabled = validateIdentityObject(parsedDisabled.value);
  assert.equal(validatedDisabled.ok, true, "disabled payload object must validate");
  var resultDisabled = evaluateEntraRules(validatedDisabled.value);
  var fixDisabled = generateEntraTerraformFix(validatedDisabled.value, resultDisabled);
  assert.equal(resultDisabled.radarLevel, "risk", "Global Admin with MFA disabled should be risk");
  assert.equal(resultDisabled.status, "warning", "Global Admin with MFA disabled should be warning");
  assert.equal(hasLog(resultDisabled, "[CHECK] Validating Identity Object..."), true, "should emit dynamic check log");
  assert.equal(
    hasLog(resultDisabled, "[FAIL] Conditional Access Policy: MFA missing for Global Admin."),
    true,
    "should emit fail log for Global Admin without MFA"
  );
  assert.equal(
    hasLog(resultDisabled, "[MITRE] Mapping to T1078.004 (Cloud Accounts)."),
    true,
    "should emit MITRE mapping log"
  );
  assert.equal(Boolean(fixDisabled), true, "risk finding should generate remediation");
  assert.equal(resultDisabled.riskScore >= 70, true, "risk score should be high for privileged account without MFA");
  assert.match(
    fixDisabled,
    /resource\s+"azuread_conditional_access_policy"/i,
    "remediation should include terraform policy resource"
  );
  assert.match(fixDisabled, /built_in_controls\s*=\s*\["mfa"\]/i, "remediation should enforce MFA");
  assert.match(fixDisabled, /excluded_users\s*=\s*\["breakglass@contoso.com"\]/i, "remediation should protect breakglass user");

  var parsedEnabled = parseIdentityJson(JSON.stringify(enabledGlobalAdmin));
  assert.equal(parsedEnabled.ok, true, "enabled payload JSON must parse");
  var validatedEnabled = validateIdentityObject(parsedEnabled.value);
  assert.equal(validatedEnabled.ok, true, "enabled payload object must validate");
  var resultEnabled = evaluateEntraRules(validatedEnabled.value);
  var fixEnabled = generateEntraTerraformFix(validatedEnabled.value, resultEnabled);
  assert.equal(resultEnabled.radarLevel, "safe", "Global Admin with MFA enabled should be safe");
  assert.equal(resultEnabled.status, "ok", "Global Admin with MFA enabled should be ok");
  assert.equal(
    hasLog(resultEnabled, "[CHECK] Conditional Access Policy: MFA satisfied for john@contoso.com."),
    true,
    "should emit satisfied MFA log"
  );
  assert.equal(
    hasLog(resultEnabled, "[MITRE] Mapping to T1078.004 (Cloud Accounts)."),
    true,
    "should still emit MITRE mapping for cloud account"
  );
  assert.equal(Boolean(fixEnabled), false, "safe finding should not generate remediation");
  assert.equal(fixEnabled, "", "safe finding should return empty terraform fix");
  assert.equal(resultEnabled.riskScore <= 30, true, "safe case should produce low risk score");

  var resultPra = evaluateEntraRules(disabledPrivilegedRoleAdmin);
  assert.equal(resultPra.radarLevel, "risk", "Privileged Role Administrator with MFA disabled should be risk");
  assert.equal(
    hasLog(resultPra, "[FAIL] Conditional Access Policy: MFA missing for Privileged Role Administrator."),
    true,
    "should cover extended critical role set"
  );
  assert.equal(Boolean(generateEntraTerraformFix(disabledPrivilegedRoleAdmin, resultPra)), true, "extended critical role should generate remediation");

  var resultSecurityAdmin = evaluateEntraRules(securityAdminFromRolesArray);
  assert.equal(resultSecurityAdmin.radarLevel, "risk", "Security Administrator in roles[] with MFA disabled should be risk");
  assert.equal(
    hasLog(resultSecurityAdmin, "[FAIL] Conditional Access Policy: MFA missing for Security Administrator."),
    true,
    "roles[] input should trigger critical-role rule"
  );

  console.log("Entra rules smoke tests passed.");
}

main();
