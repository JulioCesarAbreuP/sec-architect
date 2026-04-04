const MEMORY_KEY = "sec_architect_memory_engine_v1";

function loadMemory() {
  try {
    const raw = localStorage.getItem(MEMORY_KEY);
    return raw ? JSON.parse(raw) : { last: null, history: [] };
  } catch {
    return { last: null, history: [] };
  }
}

function saveMemory(memory) {
  localStorage.setItem(MEMORY_KEY, JSON.stringify(memory));
}

export function persistOperationalContext(snapshot) {
  const memory = loadMemory();
  const previous = memory.last;
  const current = {
    at: new Date().toISOString(),
    affectedUser: snapshot.affectedUser,
    affectedResource: snapshot.affectedResource,
    previousRisk: previous ? previous.risk : null,
    risk: Number(snapshot.risk || 0),
    remediated: Boolean(snapshot.remediated)
  };

  memory.last = current;
  memory.history = [current].concat(memory.history).slice(0, 30);
  saveMemory(memory);

  return { current, previous };
}

export function buildOperationalNarrative(current, previous) {
  if (!previous) {
    return "Este es el primer analisis operacional persistido para esta identidad.";
  }

  const previousRisk = Number(previous.risk || 0);
  const currentRisk = Number(current.risk || 0);
  const delta = currentRisk - previousRisk;
  const direction = delta > 0 ? "aumento" : delta < 0 ? "disminuyo" : "se mantuvo";
  const absoluteDelta = Math.abs(delta).toFixed(1);

  return "Este Service Principal ya fue analizado hace 2 minutos. El riesgo " + direction + " " + absoluteDelta + "% porque cambio su exposicion sobre recursos criticos.";
}
