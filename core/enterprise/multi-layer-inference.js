import { buildContextualRemediation } from "./remediation-engine.js";

export function runSyntacticLayer(payload) {
  const isObject = payload && typeof payload === "object" && !Array.isArray(payload);
  return {
    ok: isObject,
    summary: isObject ? "JSON sintacticamente valido." : "Payload invalido; se esperaba objeto JSON."
  };
}

export function runSemanticLayer(payload) {
  const role = String(payload.role || payload.assignedRole || payload.userRole || "Unknown");
  const resource = String(payload.resource || payload.targetResource || payload.keyVault || "UnknownResource");
  const user = String(payload.user || payload.servicePrincipal || payload.principal || "UnknownPrincipal");
  const mfa = String(payload.mfa || payload.authentication?.mfa || "unknown").toLowerCase();

  const semanticFlags = {
    isGlobalAdmin: /global\s*admin/i.test(role),
    mfaEnforced: mfa === "enforced",
    highValueResource: /key\s*vault|kv|vault/i.test(resource)
  };

  return {
    role,
    resource,
    user,
    semanticFlags
  };
}

export function runGraphLayer(semantic) {
  const exposure = semantic.semanticFlags.isGlobalAdmin
    ? "Privilege concentration over high-value control plane"
    : "Role exposure under review";

  const attackPath = [
    semantic.user,
    semantic.role,
    semantic.resource,
    exposure,
    semantic.semanticFlags.isGlobalAdmin ? "Lateral movement to secrets exfiltration" : "Privilege misuse containment"
  ];

  return {
    graph: {
      nodes: {
        user: semantic.user,
        role: semantic.role,
        resource: semantic.resource,
        exposure,
        attackPath: attackPath[4]
      },
      orderedPath: attackPath
    }
  };
}

export function runProbabilisticLayer(semantic, graph) {
  let probability = 24;
  if (semantic.semanticFlags.isGlobalAdmin) probability += 38;
  if (semantic.semanticFlags.highValueResource) probability += 24;
  if (!semantic.semanticFlags.mfaEnforced) probability += 18;

  probability = Math.max(1, Math.min(99, probability));
  const mitre = !semantic.semanticFlags.mfaEnforced ? "T1556" : semantic.semanticFlags.isGlobalAdmin ? "T1078" : "T1548";

  return {
    probability,
    mitreTechnique: mitre,
    criticalNode: graph.graph.nodes.resource,
    attackPath: graph.graph.orderedPath.join(" -> ")
  };
}

export function runContextualRemediationLayer(semantic, format) {
  return buildContextualRemediation(
    {
      user: semantic.user,
      role: semantic.role,
      resource: semantic.resource
    },
    format
  );
}
