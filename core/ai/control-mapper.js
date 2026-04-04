(function (w) {
  "use strict";

  var NIST_FUNCTIONS = ["Identify", "Protect", "Detect", "Respond", "Recover"];
  var MODE_FOCUS = {
    architect: "Enfocate en decisiones de diseno y dependencias de arquitectura.",
    grc: "Enfocate en trazabilidad de cumplimiento, evidencia y governance.",
    soc: "Enfocate en deteccion, telemetria y respuesta operativa."
  };

  function resolveMode(mode) {
    var candidate = (mode || "").toString().trim().toLowerCase();
    return MODE_FOCUS[candidate] ? candidate : "architect";
  }

  function buildControlMapperPrompt(input, context, options) {
    var cleanInput = (input || "").toString().trim();
    var cleanContext = (context || "").toString().trim();
    var opts = options || {};
    var mode = resolveMode(opts.mode);

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

    lines = lines.concat([
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
    ]);

    return lines.join("\n");
  }

  function buildControlMapperJsonPack(input, context, options) {
    var mode = resolveMode(options && options.mode);
    return {
      mode: mode,
      generatedAt: new Date().toISOString(),
      input: (input || "").toString(),
      context: (context || "").toString(),
      nistFunctions: getNistFunctions(),
      prompt: buildControlMapperPrompt(input, context, { mode: mode })
    };
  }

  async function mapControl(input, context, options) {
    var pack = buildControlMapperJsonPack(input, context, options);
    var adapter = w.SECArchitectAI && w.SECArchitectAI.invokeCopilot;

    if (typeof adapter === "function") {
      return adapter(pack.prompt, {
        engine: "control-mapper",
        mode: pack.mode,
        input: pack.input
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
      nistFunctions: NIST_FUNCTIONS.slice()
    };
  }

  function getNistFunctions() {
    return NIST_FUNCTIONS.slice();
  }

  w.SECArchitectAI = w.SECArchitectAI || {};
  w.SECArchitectAI.buildControlMapperPrompt = buildControlMapperPrompt;
  w.SECArchitectAI.buildControlMapperJsonPack = buildControlMapperJsonPack;
  w.SECArchitectAI.getNistFunctions = getNistFunctions;
  w.SECArchitectAI.mapControl = mapControl;
})(window);
