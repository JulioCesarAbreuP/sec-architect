const HIDDEN_SYSTEM_PROMPT = "Eres un motor de inferencia de ataques. Analiza este JSON de Azure Entra ID. Si detectas que el rol es 'Global Admin', calcula la probabilidad de desplazamiento lateral hacia el Key Vault. Responde unicamente en formato JSON con los campos: probability, critical_node, mitre_technique, attack_path, terraform_fix.";

function parseModelJson(rawText) {
  try {
    const text = String(rawText || "");
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start < 0 || end <= start) return null;
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

function normalizeAnalysis(candidate, deterministic) {
  const merged = candidate && typeof candidate === "object" ? candidate : {};
  return {
    probability: Number(merged.probability || deterministic.probability),
    critical_node: String(merged.critical_node || deterministic.critical_node),
    mitre_technique: String(merged.mitre_technique || deterministic.mitre_technique),
    attack_path: String(merged.attack_path || deterministic.attack_path),
    lateral_vector: String(merged.lateral_vector || deterministic.lateral_vector),
    terraform_fix: String(merged.terraform_fix || deterministic.terraform_fix)
  };
}

async function invokeBackgroundAI(payload) {
  if (!window.copilot || typeof window.copilot.invoke !== "function") {
    return null;
  }

  const prompt = [
    HIDDEN_SYSTEM_PROMPT,
    "JSON input:",
    JSON.stringify(payload)
  ].join("\n");

  try {
    const response = await window.copilot.invoke(prompt);
    return parseModelJson(response);
  } catch {
    return null;
  }
}

export async function runBackgroundThreatInference(payload, deterministicAnalysis) {
  const aiCandidate = await invokeBackgroundAI(payload);
  return normalizeAnalysis(aiCandidate, deterministicAnalysis);
}
