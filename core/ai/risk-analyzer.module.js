import { invokeCopilot } from "./copilot-adapter.module.js";

var FULL_ANALYSIS_BLOCKS = [
  "## Explicacion tecnica",
  "## Impacto",
  "## NIST CSF",
  "## CIS Controls v8",
  "## MITRE ATT&CK",
  "## Zero Trust",
  "## Dependencias arquitectonicas",
  "## Mitigaciones recomendadas",
  "## Riesgo asociado",
  "## Resumen ejecutivo (Staff/Lead)"
];

var MODES = {
  architect: {
    title: "Modo Arquitecto Defensivo",
    focus: "Prioriza decisiones de arquitectura, trade-offs y roadmap tecnico defensivo."
  },
  grc: {
    title: "Modo GRC/Cumplimiento",
    focus: "Prioriza trazabilidad normativa, evidencia y cobertura de controles."
  },
  soc: {
    title: "Modo SOC/Operaciones",
    focus: "Prioriza telemetria, deteccion, respuesta y contencion operativa."
  }
};

function normalizeInput(input) {
  return String(input || "").trim();
}

function resolveMode(options) {
  var candidate = (options && options.mode ? options.mode : "").toString().trim().toLowerCase();
  return MODES[candidate] ? candidate : "architect";
}

var currentMode = "architect";

export function getModes() {
  return Object.keys(MODES);
}

export function setMode(mode) {
  var candidate = (mode || "").toString().trim().toLowerCase();
  currentMode = MODES[candidate] ? candidate : "architect";
  return currentMode;
}

export function getMode() {
  return currentMode;
}

export function buildSecArchitectAnalysisPrompt(input, options) {
  var cleanInput = normalizeInput(input);
  var opts = options || {};
  var mode = resolveMode(opts);
  var modeMeta = MODES[mode];
  var context = (opts.context || "").toString().trim();

  var lines = [
    "Eres el motor de analisis de SEC_ARCHITECT.",
    "Tu funcion es evaluar, mapear y explicar cualquier elemento de seguridad de forma clara, estructurada y util para arquitectura, documentacion y toma de decisiones.",
    "",
    "Modo activo: " + modeMeta.title,
    "Foco del modo: " + modeMeta.focus,
    "",
    "Entrada:",
    '"' + cleanInput + '"',
    "",
    "Devuelve SIEMPRE los siguientes bloques:",
    ""
  ];

  FULL_ANALYSIS_BLOCKS.forEach(function (block) {
    lines.push(block);
  });

  if (context) {
    lines.push("", "Contexto adicional:", context);
  }

  lines.push(
    "",
    "Reglas del motor:",
    "- Se claro, estructurado y pedagogico.",
    "- No inventes estandares inexistentes.",
    "- Manten tono profesional Staff/Lead.",
    "- Usa lenguaje arquitectonico.",
    "",
    "Cierre obligatorio:",
    "Incluye una tabla final con: Prioridad | Accion | Responsable | Evidencia esperada"
  );

  return lines.join("\n");
}

export function buildRiskAnalyzerPrompt(input, options) {
  return buildSecArchitectAnalysisPrompt(input, options);
}

export async function analyzeRisk(input, options) {
  var normalizedInput = normalizeInput(input);
  var mode = resolveMode(options || {});
  var prompt = buildSecArchitectAnalysisPrompt(normalizedInput, options || {});

  return invokeCopilot(prompt, {
    engine: "risk-analyzer",
    mode: mode,
    input: normalizedInput
  });
}
