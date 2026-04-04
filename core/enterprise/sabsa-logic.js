import { runGraphInferenceEngine } from "./inference-engine.js";
import { selectMitreTechnique, buildAttackPathGraph, buildAttackPathString } from "./mitre-engine.js";

const CRITICAL_ROLE_PATTERN = /(global\s*admin|privileged\s*role\s*administrator|owner|contributor)/i;
const KEY_VAULT_PATTERN = /(key\s*vault|kv)/i;
const STORAGE_PATTERN = /(storage|blob|data\s*lake)/i;

function hasMfaEnforced(payload) {
  const mfa = String(payload.mfa || payload.authentication?.mfa || "").toLowerCase();
  if (mfa === "enforced") {
    return true;
  }

  const controls = payload.grantControls?.builtInControls;
  if (Array.isArray(controls)) {
    return controls.some((item) => String(item).toLowerCase() === "mfa");
  }

  return false;
}

function inferStructure(payload) {
  const isSpn = Boolean(payload.servicePrincipal || payload.principal || payload.user);
  const hasRole = Boolean(payload.role || payload.assignedRole || payload.userRole);
  const isCaPolicy = Boolean(payload.displayName && (payload.grantControls || payload.conditions));

  return {
    isServicePrincipalPayload: isSpn && hasRole,
    isConditionalAccessPayload: isCaPolicy,
    hasRole
  };
}

export function parseEntraIdJsonOrThrow(rawText) {
  let payload;
  try {
    payload = JSON.parse(String(rawText || ""));
  } catch (error) {
    throw new Error("JSON invalido: " + error.message);
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Estructura invalida: se esperaba un objeto JSON de Entra ID.");
  }

  const structure = inferStructure(payload);
  if (!structure.isServicePrincipalPayload && !structure.isConditionalAccessPayload) {
    throw new Error("Estructura invalida: incluye campos de Service Principal (servicePrincipal/user + role) o de CA Policy (displayName + grantControls/conditions).");
  }

  return payload;
}

function getDeterministicFlags(payload) {
  const role = String(payload.role || payload.assignedRole || payload.userRole || "unknown");
  const resource = String(payload.resource || payload.targetResource || payload.keyVault || payload.storage || "unknown-resource");
  const permissions = Array.isArray(payload.permissions) ? payload.permissions.map((value) => String(value)) : [];
  const mfaEnforced = hasMfaEnforced(payload);

  const hasExcessivePermissions = permissions.some((value) => CRITICAL_ROLE_PATTERN.test(value));
  const isGlobalAdmin = /global\s*admin/i.test(role);
  const targetsKeyVault = KEY_VAULT_PATTERN.test(resource);
  const targetsStorage = STORAGE_PATTERN.test(resource);

  return {
    role,
    resource,
    permissions,
    mfaEnforced,
    hasExcessivePermissions,
    isGlobalAdmin,
    targetsKeyVault,
    targetsStorage
  };
}

function buildDeterministicRemediation(flags, format) {
  if (format === "bicep") {
    return [
      "// Deterministic Auto-Remediation",
      "resource enforceMfa 'Microsoft.Graph/identity/conditionalAccessPolicies@1.0' = {",
      "  name: 'enforce-mfa-enterprise'",
      "  properties: {",
      "    state: 'enabled'",
      "    grantControls: {",
      "      operator: 'OR'",
      "      builtInControls: [ 'mfa' ]",
      "    }",
      "  }",
      "}",
      "",
      "// limit excessive permissions",
      "resource leastPrivilege 'Microsoft.Authorization/roleAssignments@2022-04-01' = {",
      "  name: guid(subscription().id, 'least-privilege-fix')",
      "  properties: {",
      "    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', 'acdd72a7-3385-48ef-bd42-f606fba81ae7')",
      "    principalType: 'ServicePrincipal'",
      "  }",
      "}",
      "",
      "// isolate critical resources",
      "resource resourceLock 'Microsoft.Authorization/locks@2020-05-01' = {",
      "  name: 'lock-critical-resource'",
      "  properties: {",
      "    level: 'CanNotDelete'",
      "  }",
      "}",
      "",
      "// rotate credentials",
      "resource secretRotation 'Microsoft.KeyVault/vaults/secrets@2023-02-01' = {",
      "  name: 'rotation-trigger'",
      "  properties: {",
      "    attributes: {",
      "      enabled: true",
      "    }",
      "  }",
      "}"
    ].join("\n");
  }

  return [
    "# Deterministic Auto-Remediation",
    "resource \"azuread_conditional_access_policy\" \"enforce_mfa\" {",
    "  display_name = \"Enforce MFA\"",
    "  state        = \"enabled\"",
    "  grant_controls {",
    "    operator          = \"OR\"",
    "    built_in_controls = [\"mfa\"]",
    "  }",
    "}",
    "",
    "resource \"azurerm_role_assignment\" \"limit_permissions\" {",
    "  role_definition_name = \"Reader\"",
    "  principal_id         = \"service-principal-object-id\"",
    "  scope                = \"critical-resource-scope\"",
    "}",
    "",
    "resource \"azurerm_management_lock\" \"isolate_critical_resource\" {",
    "  name       = \"critical-resource-lock\"",
    "  scope      = \"critical-resource-id\"",
    "  lock_level = \"CanNotDelete\"",
    "}",
    "",
    "resource \"azuread_application_password\" \"rotate_credentials\" {",
    "  application_object_id = \"application-object-id\"",
    "  display_name          = \"rotation-by-threat-engine\"",
    "  end_date_relative     = \"240h\"",
    "}"
  ].join("\n");
}

export async function analyzeEntraIdWithSabsa(rawJsonText, format) {
  const payload = parseEntraIdJsonOrThrow(rawJsonText);
  const flags = getDeterministicFlags(payload);
  const inference = await runGraphInferenceEngine(payload, format);

  const selectedMitre = selectMitreTechnique(flags);
  const semantic = {
    user: String(payload.user || payload.servicePrincipal || payload.principal || "unknown-principal"),
    role: flags.role,
    resource: flags.resource,
    exposure: flags.hasExcessivePermissions ? "Excessive Permission Exposure" : "Managed Exposure",
    attackPath: flags.targetsKeyVault ? "Lateral movement toward Key Vault" : "Privilege abuse over data plane"
  };

  const graph = buildAttackPathGraph(semantic);
  const attackPath = buildAttackPathString(graph);

  let probability = Number(inference.analysis.probability || 0);
  if (!flags.mfaEnforced) probability = Math.min(99, probability + 12);
  if (flags.targetsKeyVault) probability = Math.min(99, probability + 8);
  if (flags.targetsStorage) probability = Math.min(99, probability + 6);

  const deterministicFix = buildDeterministicRemediation(flags, format);

  return {
    payload,
    flags,
    graph,
    analysis: {
      probability,
      critical_node: graph.resource,
      mitre_technique: selectedMitre.id,
      attack_path: attackPath,
      terraform_fix: deterministicFix,
      ai_context_message: "Detecto un patron de permisos excesivos y riesgo operacional acumulado. Recomiendo activar Just-In-Time Access y aislamiento de recursos criticos."
    }
  };
}
