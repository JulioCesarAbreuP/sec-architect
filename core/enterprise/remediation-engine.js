function normalizeName(value, fallback) {
  const cleaned = String(value || fallback)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned || fallback;
}

export function buildContextualRemediation(graphContext, format) {
  const userNode = graphContext.user || "service-principal";
  const resourceNode = graphContext.resource || "keyvault-prod";
  const userName = normalizeName(userNode, "service-principal");
  const resourceName = normalizeName(resourceNode, "keyvault-prod");

  if (format === "bicep") {
    return [
      "// Auto-Remediation: Identity Hardening",
      "resource caPolicy 'Microsoft.Graph/identity/conditionalAccessPolicies@1.0' = {",
      "  name: 'enforce-mfa-global-admin'",
      "  properties: {",
      "    state: 'enabled'",
      "    grantControls: {",
      "      operator: 'OR'",
      "      builtInControls: [ 'mfa' ]",
      "    }",
      "  }",
      "}",
      "",
      "resource roleCleanup 'Microsoft.Authorization/roleAssignments@2022-04-01' = {",
      "  name: guid(subscription().id, '" + userName + "', 'reader')",
      "  properties: {",
      "    principalId: '" + userName + "'",
      "    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', 'acdd72a7-3385-48ef-bd42-f606fba81ae7')",
      "    principalType: 'ServicePrincipal'",
      "  }",
      "}",
      "",
      "// isolate high-value resource",
      "resource kvLock 'Microsoft.Authorization/locks@2020-05-01' = {",
      "  name: 'lock-" + resourceName + "'",
      "  properties: {",
      "    level: 'CanNotDelete'",
      "    notes: 'Applied by enterprise auto-remediation graph engine'",
      "  }",
      "}"
    ].join("\n");
  }

  return [
    "# Auto-Remediation: Identity Hardening",
    "resource \"azuread_conditional_access_policy\" \"enforce_mfa\" {",
    "  display_name = \"Enforce MFA for Admins\"",
    "  state        = \"enabled\"",
    "  conditions {",
    "    users {",
    "      included_roles = [\"62e90394-69f5-4237-9190-012177145e10\"]",
    "    }",
    "  }",
    "  grant_controls {",
    "    operator          = \"OR\"",
    "    built_in_controls = [\"mfa\"]",
    "  }",
    "}",
    "",
    "resource \"azurerm_role_assignment\" \"least_privilege_fix\" {",
    "  scope                = data.azurerm_key_vault." + resourceName + ".id",
    "  role_definition_name = \"Reader\"",
    "  principal_id         = azuread_service_principal." + userName + ".object_id",
    "}",
    "",
    "resource \"azuread_application_password\" \"rotate_credentials\" {",
    "  application_object_id = azuread_service_principal." + userName + ".application_id",
    "  display_name          = \"rotated-by-enterprise-engine\"",
    "  end_date_relative     = \"240h\"",
    "}"
  ].join("\n");
}
