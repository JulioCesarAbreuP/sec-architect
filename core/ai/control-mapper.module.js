import { invokeCopilot } from "./copilot-adapter.module.js";

var NIST_FUNCTIONS = ["Identify", "Protect", "Detect", "Respond", "Recover"];
var MODE_FOCUS = {
  architect: "Enfocate en decisiones de diseno y dependencias de arquitectura.",
  grc: "Enfocate en trazabilidad de cumplimiento, evidencia y governance.",
  soc: "Enfocate en deteccion, telemetria y respuesta operativa."
};

function resolveMode(options) {
  var candidate = (options && options.mode ? options.mode : "").toString().trim().toLowerCase();
  return MODE_FOCUS[candidate] ? candidate : "architect";
}

export function buildControlMapperPrompt(input, context, options) {
  var cleanInput = String(input || "").trim();
  var cleanContext = String(context || "").trim();
  var mode = resolveMode(options || {});

  var lines = [
    "Eres un especialista en mapeo de controles de seguridad para arquitectura defensiva.",
    "Modo activo: " + mode,
    MODE_FOCUS[mode],
    "",
    "Objetivo:",
    "- Analizar el control, riesgo o tecnica proporcionada.",
    "- Mapear de forma argumentada a NIST CSF, CIS Controls v8 y MITRE ATT&CK.",
    "- Explicar relacion con Zero Trust y residual risk.",
    "",
    "Entrada:",
    '"' + cleanInput + '"'
  ];

  if (cleanContext) {
    lines.push("", "Contexto adicional:", cleanContext);
  }

  lines.push(
    "",
    "Salida esperada:",
    "1) Control o tecnica analizada",
    "2) Mapeo NIST CSF",
    "3) Mapeo CIS v8",
    "4) Mapeo MITRE ATT&CK",
    "5) Relacion con Zero Trust",
    "6) Riesgo residual y recomendaciones",
    "",
    "Mapea NIST usando funciones:",
    "- " + NIST_FUNCTIONS.join(", ")
  );

  return lines.join("\n");
}

export async function mapControl(input, context, options) {
  var normalizedInput = String(input || "").trim();
  var mode = resolveMode(options || {});
  var prompt = buildControlMapperPrompt(normalizedInput, context, options || {});

  return invokeCopilot(prompt, {
    engine: "control-mapper",
    mode: mode,
    input: normalizedInput
  });
}
