(function (w) {
  "use strict";

  var DEFAULT_SECTIONS = [
    "1. Explicacion tecnica",
    "2. Impacto",
    "3. Mitigaciones recomendadas",
    "4. Mapeo NIST CSF (Identify, Protect, Detect, Respond, Recover)",
    "5. Mapeo CIS Controls v8",
    "6. Tacticas y tecnicas MITRE ATT&CK relacionadas",
    "7. Relacion con Zero Trust",
    "8. Riesgos residuales",
    "9. Recomendacion final (Staff/Lead)"
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

  function ensureModeApi(ns) {
    if (typeof ns.getModes !== "function") {
      ns.getModes = function () {
        return Object.keys(MODES);
      };
    }

    if (typeof ns.setMode !== "function") {
      ns.setMode = function (mode) {
        var candidate = (mode || "").toString().trim().toLowerCase();
        ns.__mode = MODES[candidate] ? candidate : "architect";
        return ns.__mode;
      };
    }

    if (typeof ns.getMode !== "function") {
      ns.getMode = function () {
        return ns.__mode || "architect";
      };
    }

    if (!ns.__mode) {
      ns.__mode = "architect";
    }
  }

  function normalizeInput(input) {
    return (input || "").toString().trim();
  }

  function resolveMode(options) {
    var candidate = (options && options.mode ? options.mode : "").toString().trim().toLowerCase();
    if (MODES[candidate]) {
      return candidate;
    }

    return "architect";
  }

  function buildRiskAnalyzerPrompt(input, options) {
    var cleanInput = normalizeInput(input);
    var opts = options || {};
    var language = opts.language || "es";
    var mode = resolveMode(opts);
    var modeMeta = MODES[mode];
    var context = (opts.context || "").toString().trim();

    var lines = [
      "Eres un Security Architect (nivel Staff/Lead) especializado en analisis de riesgos, controles y tecnicas defensivas.",
      "Responde en " + language + " con claridad tecnica y enfoque pedagogico.",
      "",
      "Modo activo: " + modeMeta.title,
      "Foco del modo: " + modeMeta.focus,
      "",
      "Analiza este riesgo, control o tecnica de seguridad:",
      '"' + cleanInput + '"',
      "",
      "Devuelve la informacion en formato estructurado:",
      ""
    ];

    DEFAULT_SECTIONS.forEach(function (section) {
      lines.push(section);
    });

    if (context) {
      lines.push("", "Contexto adicional:", context);
    }

    lines = lines.concat([
      "",
      "Reglas de calidad:",
      "- No inventes datos de una organizacion si no se proporcionaron.",
      "- Si falta contexto, declara supuestos explicitos.",
      "- Incluye severidad sugerida con justificacion.",
      "- Entrega recomendaciones accionables por prioridad."
    ]);

    return lines.join("\n");
  }

  function buildRiskAnalyzerJsonPack(input, options) {
    var mode = resolveMode(options || {});
    return {
      mode: mode,
      generatedAt: new Date().toISOString(),
      input: normalizeInput(input),
      sections: getRiskAnalyzerSections(),
      prompt: buildRiskAnalyzerPrompt(input, options)
    };
  }

  function getRiskAnalyzerSections() {
    return DEFAULT_SECTIONS.slice();
  }

  w.SECArchitectAI = w.SECArchitectAI || {};
  ensureModeApi(w.SECArchitectAI);
  w.SECArchitectAI.buildRiskAnalyzerPrompt = buildRiskAnalyzerPrompt;
  w.SECArchitectAI.buildRiskAnalyzerJsonPack = buildRiskAnalyzerJsonPack;
  w.SECArchitectAI.getRiskAnalyzerSections = getRiskAnalyzerSections;
})(window);
