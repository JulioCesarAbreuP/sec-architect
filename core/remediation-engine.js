function normalizeToken(value, fallback) {
  const token = String(value || fallback)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return token || fallback;
}

function escapeTerraformString(value) {
  return String(value || "").replace(/[\\"]/g, "\\$&");
}

export function buildDynamicRemediation(payload, flags, format, includeRollback = true) {
  const identityToken = normalizeToken(payload.servicePrincipal || payload.user || payload.principalId || payload.appId, "identity");
  const resourceToken = normalizeToken(payload.resource || payload.targetResource || payload.scope, "resource");

  const terraform = [
    "# Auto-Remediation Block",
    "resource \"azuread_conditional_access_policy\" \"enforce_mfa\" {",
    "  display_name = \"Enforce MFA for Admins\"",
    "  state        = \"enabled\"",
    "  grant_controls {",
    "    operator          = \"OR\"",
    "    built_in_controls = [\"mfa\"]",
    "  }",
    "}",
    "",
    "resource \"azurerm_role_assignment\" \"limit_permissions\" {",
    "  scope                = \"" + resourceToken + "\"",
    "  role_definition_name = \"Reader\"",
    "  principal_id         = \"" + identityToken + "\"",
    "}",
    "",
    "resource \"azurerm_management_lock\" \"isolate_resource\" {",
    "  name       = \"lock-" + resourceToken + "\"",
    "  scope      = \"" + resourceToken + "\"",
    "  lock_level = \"CanNotDelete\"",
    "}",
    "",
    "resource \"azuread_application_password\" \"rotate_credentials\" {",
    "  application_object_id = \"" + identityToken + "\"",
    "  display_name          = \"rotation-by-threat-engine\"",
    "  end_date_relative     = \"240h\"",
    "}"
  ];

  if (includeRollback) {
    terraform.push(
      "",
      "# Rollback Plan",
      "# 1) terraform state rm azuread_conditional_access_policy.enforce_mfa",
      "# 2) terraform state rm azurerm_role_assignment.limit_permissions",
      "# 3) terraform state rm azurerm_management_lock.isolate_resource",
      "# 4) terraform state rm azuread_application_password.rotate_credentials"
    );
  }

  if (format === "bicep") {
    return terraform
      .join("\n")
      .replace(/resource \"azuread_conditional_access_policy\" \"enforce_mfa\" \{/g, "resource enforceMfa 'Microsoft.Graph/identity/conditionalAccessPolicies@1.0' = {")
      .replace(/resource \"azurerm_role_assignment\" \"limit_permissions\" \{/g, "resource limitPermissions 'Microsoft.Authorization/roleAssignments@2022-04-01' = {")
      .replace(/resource \"azurerm_management_lock\" \"isolate_resource\" \{/g, "resource isolateResource 'Microsoft.Authorization/locks@2020-05-01' = {")
      .replace(/resource \"azuread_application_password\" \"rotate_credentials\" \{/g, "resource rotateCredentials 'Microsoft.Graph/applications/federatedIdentityCredentials@1.0' = {");
  }

  return terraform.join("\n");
}

export function generateEntraTerraformFix(payload, ruleResult) {
  const hasFindings = Array.isArray(ruleResult?.findings) && ruleResult.findings.length > 0;
  if (!hasFindings) {
    return "";
  }

  const principal = String(ruleResult?.context?.principal || payload?.user || payload?.upn || "unknown");
  const roleName = String(ruleResult?.context?.primaryRole || payload?.role || payload?.directoryRole || "Unknown Role");
  const allRoles = Array.isArray(payload?.roles) && payload.roles.length
    ? payload.roles.map((role) => String(role || "").trim()).filter(Boolean)
    : [roleName];
  const policyName = "enforce_mfa_" + normalizeToken(roleName, "identity");
  const findingsText = ruleResult.findings.join(", ");
  const escapedRoleName = escapeTerraformString(roleName);
  const includedRoles = allRoles.map((role) => '"' + escapeTerraformString(role) + '"').join(", ");

  return [
    'resource "azuread_conditional_access_policy" "' + policyName + '" {',
    '  display_name = "SEC_ARCHITECT - Enforce MFA for ' + escapedRoleName + '"',
    '  state        = "enabled"',
    "",
    "  conditions {",
    "    users {",
    '      included_roles = [' + includedRoles + ']',
    '      excluded_users = ["breakglass@contoso.com"]',
    "    }",
    "",
    "    applications {",
    '      included_applications = ["All"]',
    "    }",
    "  }",
    "",
    "  grant_controls {",
    '    operator          = "OR"',
    '    built_in_controls = ["mfa"]',
    "  }",
    "}",
    "",
    "# principal: " + principal,
    "# primary_role: " + roleName,
    "# findings: " + findingsText
  ].join("\n");
}
