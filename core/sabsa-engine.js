import { detectTechniquesFromAzureObject, getTechniqueById } from "./mitre-mapper.js";

export const SABSA_ATTRIBUTES = [
  "Confidentiality",
  "Integrity",
  "Availability",
  "Accountability",
  "Assurance"
];

export function calculateSabsaScore(findings) {
  const list = Array.isArray(findings) ? findings : [];
  const penalty = list.reduce((total, finding) => {
    if (finding.severity === "critical") {
      return total + 25;
    }
    if (finding.severity === "high") {
      return total + 15;
    }
    if (finding.severity === "medium") {
      return total + 8;
    }
    return total + 3;
  }, 0);

  const score = Math.max(0, 100 - penalty);
  return {
    score,
    riskLevel: score < 45 ? "critical" : score < 65 ? "high" : score < 80 ? "medium" : "low"
  };
}

export function inferAttributeImpacts(findings) {
  const list = Array.isArray(findings) ? findings : [];
  const base = {
    Confidentiality: 100,
    Integrity: 100,
    Availability: 100,
    Accountability: 100,
    Assurance: 100
  };

  list.forEach((finding) => {
    const drop = finding.severity === "critical" ? 20 : finding.severity === "high" ? 12 : 6;
    base.Confidentiality = Math.max(0, base.Confidentiality - drop);
    base.Integrity = Math.max(0, base.Integrity - drop);
    base.Accountability = Math.max(0, base.Accountability - Math.round(drop / 2));
  });

  return base;
}

export async function runAzureInference(azureObject, invokeAi) {
  const findings = detectTechniquesFromAzureObject(azureObject);
  const score = calculateSabsaScore(findings);
  const impacts = inferAttributeImpacts(findings);

  const prompt = [
    "Actua como un motor de inferencia. Analiza este objeto de Azure AD.",
    "Si MFA_Status = 'Disabled' y el rol = 'Contributor', calcula la probabilidad de escalada lateral hacia Produccion basandote en la tecnica T1078. Devuelve porcentaje + camino de ataque + recomendacion.",
    "",
    "Formato de salida estricto (JSON):",
    "{\"probabilidad\": number, \"tecnicaMITRE\": string, \"caminoAtaque\": string, \"recomendacion\": string}",
    "",
    "Objeto:",
    JSON.stringify(azureObject)
  ].join("\n");

  if (typeof invokeAi === "function") {
    try {
      const raw = await invokeAi(prompt);
      const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;

      return {
        ok: true,
        inference: {
          probabilidad: parsed.probabilidad,
          tecnicaMITRE: parsed.tecnicaMITRE,
          caminoAtaque: parsed.caminoAtaque,
          recomendacion: parsed.recomendacion
        },
        findings,
        score,
        impacts
      };
    } catch (_error) {
      // Fallback deterministico para entornos sin salida JSON valida.
    }
  }

  const hasCritical = findings.some((item) => item.severity === "critical");
  const technique = getTechniqueById("T1078");

  return {
    ok: true,
    inference: {
      probabilidad: hasCritical ? 87 : 41,
      tecnicaMITRE: technique ? technique.id : "T1078",
      caminoAtaque: hasCritical
        ? "Acceso con cuenta valida -> elevacion por permisos contributor -> movimiento lateral hacia workloads de produccion"
        : "Intento de acceso con cuenta valida sin condiciones suficientes para escalar",
      recomendacion: hasCritical
        ? "Aplicar MFA obligatoria, revisar privilegios contributor y habilitar alertas de sign-in risk"
        : "Mantener controles de acceso condicional y monitoreo continuo"
    },
    findings,
    score,
    impacts
  };
}
