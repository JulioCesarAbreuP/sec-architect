(function (w) {
  "use strict";

  var MODE_SCOPE_HINT = {
    architect: "Prioriza componentes, responsabilidades y trade-offs de diseno.",
    grc: "Prioriza trazabilidad, gobierno y cumplimiento en arquitectura.",
    soc: "Prioriza operacion, deteccion y respuesta dentro de la arquitectura."
  };

  function resolveMode(mode) {
    var candidate = (mode || "").toString().trim().toLowerCase();
    return MODE_SCOPE_HINT[candidate] ? candidate : "architect";
  }

  function buildArchitectureExplainerPrompt(topic, scope, options) {
    var cleanTopic = (topic || "arquitectura de seguridad").toString().trim();
    var cleanScope = (scope || "high-level").toString().trim();
    var mode = resolveMode(options && options.mode);

    var lines = [
      "Eres un Security Architect con enfoque Staff/Lead.",
      "Modo activo: " + mode,
      MODE_SCOPE_HINT[mode],
      "Explica el tema solicitado de forma clara, estructurada y orientada a toma de decisiones.",
      "",
      "Tema:",
      cleanTopic,
      "",
      "Alcance:",
      cleanScope,
      "",
      "Formato de salida:",
      "1) Contexto y objetivo arquitectonico",
      "2) Componentes principales y responsabilidades",
      "3) Flujo entre componentes",
      "4) Decisiones de diseno y trade-offs",
      "5) Riesgos y controles recomendados",
      "6) Relacion con Zero Trust, NIST, CIS y MITRE",
      "7) Recomendacion final para equipo tecnico y liderazgo"
    ];

    return lines.join("\n");
  }

  function buildArchitectureExplanationPack(topic, scope, options) {
    var mode = resolveMode(options && options.mode);
    return {
      topic: (topic || "").toString(),
      scope: (scope || "high-level").toString(),
      mode: mode,
      prompt: buildArchitectureExplainerPrompt(topic, scope, { mode: mode })
    };
  }

  async function explainArchitecture(component, options) {
    var scope = (options && options.scope) || "high-level";
    var pack = buildArchitectureJsonPack(component, scope, options);
    var adapter = w.SECArchitectAI && w.SECArchitectAI.invokeCopilot;

    if (typeof adapter === "function") {
      return adapter(pack.prompt, {
        engine: "architecture-explainer",
        mode: pack.mode,
        input: pack.topic,
        scope: pack.scope
      });
    }

    if (w.copilot && typeof w.copilot.invoke === "function") {
      return w.copilot.invoke(pack.prompt);
    }

    return {
      ok: false,
      source: "local-fallback",
      reason: "window.copilot.invoke no disponible en este entorno.",
      prompt: pack.prompt,
      topic: pack.topic,
      scope: pack.scope
    };
  }

  function buildArchitectureJsonPack(topic, scope, options) {
    var mode = resolveMode(options && options.mode);
    return {
      mode: mode,
      generatedAt: new Date().toISOString(),
      topic: (topic || "").toString(),
      scope: (scope || "high-level").toString(),
      prompt: buildArchitectureExplainerPrompt(topic, scope, { mode: mode })
    };
  }

  w.SECArchitectAI = w.SECArchitectAI || {};
  w.SECArchitectAI.buildArchitectureExplainerPrompt = buildArchitectureExplainerPrompt;
  w.SECArchitectAI.buildArchitectureJsonPack = buildArchitectureJsonPack;
  w.SECArchitectAI.buildArchitectureExplanationPack = buildArchitectureExplanationPack;
  w.SECArchitectAI.explainArchitecture = explainArchitecture;
})(window);
