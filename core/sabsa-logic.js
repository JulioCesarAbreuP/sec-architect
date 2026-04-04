import { buildGraph, selectMitreTechnique, buildLateralVector } from "./mitre-engine.js";
import { buildDynamicRemediation } from "./remediation-engine.js";

const DANGEROUS_ROLE_PATTERN = /(global\s*admin|privileged\s*role\s*administrator|owner|contributor)/i;
const KEYVAULT_PATTERN = /(key\s*vault|kv)/i;
const STORAGE_PATTERN = /(storage|blob|data\s*lake)/i;

function isMfaEnforced(payload) {
  const mfa = String(payload.mfa || payload.authentication?.mfa || "").toLowerCase();
  if (mfa === "enforced") return true;

  const controls = payload.grantControls?.builtInControls;
  if (Array.isArray(controls)) {
    return controls.some((item) => String(item).toLowerCase() === "mfa");
  }

  return false;
}

function buildFlags(payload) {
  const role = String(payload.role || payload.assignedRole || payload.roleDefinitionName || "");
  const resource = String(payload.resource || payload.targetResource || payload.scope || "");
  const permissions = Array.isArray(payload.permissions) ? payload.permissions.map((value) => String(value)) : [];

  const hasDangerousRole = DANGEROUS_ROLE_PATTERN.test(role);
  const hasExcessivePermissions = permissions.some((value) => DANGEROUS_ROLE_PATTERN.test(value));

  return {
    role,
    resource,
    permissions,
    mfaEnforced: isMfaEnforced(payload),
    isGlobalAdmin: /global\s*admin/i.test(role),
    hasDangerousRole,
    hasExcessivePermissions,
    targetsKeyVault: KEYVAULT_PATTERN.test(resource),
    targetsStorage: STORAGE_PATTERN.test(resource)
  };
}

export function runSabsaInferenceLayers(payload, format) {
  const flags = buildFlags(payload);

  const layer1Syntactic = {
    role: flags.role,
    permissions: flags.permissions,
    mfaEnforced: flags.mfaEnforced
  };

  const layer2Semantic = {
    roleRisk: flags.hasDangerousRole ? "high" : "normal",
    exposureType: flags.targetsKeyVault || flags.targetsStorage ? "critical-resource" : "standard-resource",
    identityState: flags.mfaEnforced ? "hardened" : "weak-auth"
  };

  const layer3Graph = buildGraph(flags, payload);

  let probability = 25;
  if (!flags.mfaEnforced) probability += 18;
  if (flags.hasDangerousRole) probability += 22;
  if (flags.hasExcessivePermissions) probability += 16;
  if (flags.targetsKeyVault) probability += 18;
  if (flags.targetsStorage) probability += 10;
  probability = Math.max(1, Math.min(99, probability));

  const selectedMitre = selectMitreTechnique(flags);
  const layer4Probabilistic = {
    probability,
    critical_node: layer3Graph.resource,
    mitre_technique: selectedMitre.id,
    lateral_vector: buildLateralVector(flags)
  };

  const layer5Remediation = buildDynamicRemediation(payload, flags, format, true);

  return {
    flags,
    layers: {
      layer1Syntactic,
      layer2Semantic,
      layer3Graph,
      layer4Probabilistic,
      layer5Remediation
    },
    deterministicAnalysis: {
      probability: layer4Probabilistic.probability,
      critical_node: layer4Probabilistic.critical_node,
      mitre_technique: layer4Probabilistic.mitre_technique,
      lateral_vector: layer4Probabilistic.lateral_vector,
      attack_path: layer3Graph.orderedPath.join(" -> "),
      terraform_fix: layer5Remediation
    }
  };
}
