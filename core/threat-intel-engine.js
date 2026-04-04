const SEVERITY_WEIGHT = {
  critica: 100,
  critico: 100,
  critical: 100,
  alta: 82,
  high: 82,
  medio: 58,
  media: 58,
  medium: 58,
  baja: 32,
  low: 32
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number(value || 0)));
}

function normalizeArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeSeverity(item) {
  const severity = String(item?.severidad || item?.riesgo || "medium").toLowerCase();
  return SEVERITY_WEIGHT[severity] || 50;
}

function normalizeTechniqueId(value) {
  return String(value || "").trim().toUpperCase();
}

function buildSummary(items) {
  const techniqueTotals = {};
  const techniqueCounts = {};

  items.forEach((item) => {
    const score = normalizeSeverity(item);
    normalizeArray(item?.mitre_attack)
      .map((technique) => normalizeTechniqueId(technique))
      .filter(Boolean)
      .forEach((technique) => {
        techniqueTotals[technique] = Number(techniqueTotals[technique] || 0) + score;
        techniqueCounts[technique] = Number(techniqueCounts[technique] || 0) + 1;
      });
  });

  const techniqueRisk = {};
  Object.keys(techniqueTotals).forEach((technique) => {
    const avg = techniqueTotals[technique] / Math.max(1, techniqueCounts[technique]);
    const confidenceBoost = Math.min(12, techniqueCounts[technique] * 1.5);
    techniqueRisk[technique] = Math.round(clamp(avg + confidenceBoost, 0, 100));
  });

  const ranked = Object.entries(techniqueRisk)
    .map(([id, risk]) => ({ id, risk }))
    .sort((a, b) => b.risk - a.risk);

  return {
    generatedAt: new Date().toISOString(),
    itemCount: items.length,
    techniqueRisk,
    topTechnique: ranked[0] || { id: "n/a", risk: 0 },
    topTechniques: ranked.slice(0, 5)
  };
}

export async function loadThreatIntelFeed(fetchImpl = fetch) {
  const dataUrl = new URL("../data/knowledge-base.json", import.meta.url);
  const response = await fetchImpl(dataUrl, { cache: "no-store" });

  if (!response.ok) {
    throw new Error("Threat Intel feed unavailable (HTTP " + response.status + ")");
  }

  const parsed = await response.json();
  const items = Array.isArray(parsed) ? parsed : [];

  return {
    items,
    summary: buildSummary(items)
  };
}

export function getThreatTechniqueScore(summary, techniqueId) {
  const normalized = normalizeTechniqueId(techniqueId);
  return clamp(summary?.techniqueRisk?.[normalized] || 0, 0, 100);
}
