import {
  runSyntacticLayer,
  runSemanticLayer,
  runGraphLayer,
  runProbabilisticLayer,
  runContextualRemediationLayer
} from "./multi-layer-inference.js";

const HIDDEN_SYSTEM_PROMPT = "Eres un motor de inferencia de ataques. Analiza este JSON de Azure Entra ID. Si detectas que el rol es 'Global Admin', calcula la probabilidad de desplazamiento lateral hacia el Key Vault. Responde unicamente en formato JSON con los campos: probability, critical_node, mitre_technique, attack_path, terraform_fix.";

function safeParseModelJson(rawText) {
  try {
    const jsonStart = String(rawText || "").indexOf("{");
    const jsonEnd = String(rawText || "").lastIndexOf("}");
    if (jsonStart >= 0 && jsonEnd > jsonStart) {
      return JSON.parse(String(rawText).slice(jsonStart, jsonEnd + 1));
    }
  } catch {
    return null;
  }
  return null;
}

async function invokeCopilot(payload) {
  if (!window.copilot || typeof window.copilot.invoke !== "function") {
    return null;
  }

  const userPrompt = [
    "JSON input:",
    JSON.stringify(payload)
  ].join("\n");

  const response = await window.copilot.invoke(HIDDEN_SYSTEM_PROMPT + "\n" + userPrompt);
  const parsed = safeParseModelJson(response);
  return parsed;
}

export async function runGraphInferenceEngine(payload, format) {
  const syntactic = runSyntacticLayer(payload);
  if (!syntactic.ok) {
    throw new Error("Payload JSON invalido para motor de inferencia.");
  }

  const semantic = runSemanticLayer(payload);
  const graph = runGraphLayer(semantic);
  const probabilistic = runProbabilisticLayer(semantic, graph);
  const terraformFix = runContextualRemediationLayer(semantic, format);

  const fallback = {
    probability: probabilistic.probability,
    critical_node: probabilistic.criticalNode,
    mitre_technique: probabilistic.mitreTechnique,
    attack_path: probabilistic.attackPath,
    terraform_fix: terraformFix
  };

  const aiResult = await invokeCopilot(payload);
  const normalized = aiResult && typeof aiResult === "object"
    ? {
        probability: Number(aiResult.probability || fallback.probability),
        critical_node: String(aiResult.critical_node || fallback.critical_node),
        mitre_technique: String(aiResult.mitre_technique || fallback.mitre_technique),
        attack_path: String(aiResult.attack_path || fallback.attack_path),
        terraform_fix: String(aiResult.terraform_fix || fallback.terraform_fix)
      }
    : fallback;

  return {
    layers: {
      syntactic,
      semantic,
      graph,
      probabilistic
    },
    analysis: normalized
  };
}
