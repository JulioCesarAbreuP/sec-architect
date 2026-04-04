import { invokeCopilot } from "./copilot-adapter.module.js";

var MODE_SCOPE_HINT = {
  architect: "Prioriza componentes, responsabilidades y trade-offs de diseno.",
  grc: "Prioriza trazabilidad, gobierno y cumplimiento en arquitectura.",
  soc: "Prioriza operacion, deteccion y respuesta dentro de la arquitectura."
};

function resolveMode(options) {
  var candidate = (options && options.mode ? options.mode : "").toString().trim().toLowerCase();
  return MODE_SCOPE_HINT[candidate] ? candidate : "architect";
}

export function buildArchitectureExplainerPrompt(component, scope, options) {
  var cleanComponent = String(component || "").trim();
  var cleanScope = String(scope || "high-level").trim();
  var mode = resolveMode(options || {});

  return [
    "Eres el motor de analisis de SEC_ARCHITECT.",
    "Explica este componente arquitectonico:",
    '"' + cleanComponent + '"',
    "",
    "Modo activo: " + mode,
    MODE_SCOPE_HINT[mode],
    "",
    "Alcance: " + cleanScope,
    "",
    "Devuelve:",
    "- Proposito",
    "- Responsabilidades",
    "- Relacion con otros modulos",
    "- Riesgos de diseno",
    "- Decisiones arquitectonicas",
    "- Beneficios y trade-offs",
    "- Resumen ejecutivo (Staff/Lead)"
  ].join("\n");
}

export async function explainArchitecture(component, options) {
  var opts = options || {};
  var mode = resolveMode(opts);
  var scope = opts.scope || "high-level";
  var normalizedComponent = String(component || "").trim();
  var prompt = buildArchitectureExplainerPrompt(normalizedComponent, scope, opts);

  return invokeCopilot(prompt, {
    engine: "architecture-explainer",
    mode: mode,
    input: normalizedComponent,
    scope: scope
  });
}
