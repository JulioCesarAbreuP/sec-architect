const MEMORY_KEY = "sec_architect_operational_memory_v1";

function nowIso() {
  return new Date().toISOString();
}

export function loadOperationalMemory() {
  try {
    const raw = localStorage.getItem(MEMORY_KEY);
    return raw ? JSON.parse(raw) : { analyses: [], last: null };
  } catch {
    return { analyses: [], last: null };
  }
}

export function saveOperationalMemory(memory) {
  localStorage.setItem(MEMORY_KEY, JSON.stringify(memory));
}

export function rememberAnalysis(snapshot) {
  const memory = loadOperationalMemory();
  const previous = memory.last;
  const current = {
    id: "ana-" + Date.now(),
    at: nowIso(),
    affectedUser: snapshot.affectedUser || "unknown-user",
    affectedResource: snapshot.affectedResource || "unknown-resource",
    previousRisk: previous ? previous.riskScore : null,
    riskScore: snapshot.riskScore,
    remediated: Boolean(snapshot.remediated),
    analysis: snapshot.analysis
  };

  memory.analyses = [current].concat(memory.analyses).slice(0, 25);
  memory.last = current;
  saveOperationalMemory(memory);

  return { current, previous };
}

export function buildContextNarrative(current, previous) {
  if (!previous) {
    return "Primer analisis registrado para este contexto operativo.";
  }

  const previousRisk = Number(previous.riskScore || 0);
  const currentRisk = Number(current.riskScore || 0);
  const delta = currentRisk - previousRisk;
  const direction = delta > 0 ? "aumento" : delta < 0 ? "disminuyo" : "se mantuvo";
  const absDelta = Math.abs(delta).toFixed(1);

  return "Este Service Principal ya fue analizado hace pocos minutos. El riesgo " + direction + " " + absDelta + "% comparado con la corrida anterior.";
}
