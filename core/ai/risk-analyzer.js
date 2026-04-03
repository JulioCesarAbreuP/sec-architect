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

  var FULL_ANALYSIS_BLOCKS = [
    "## 🧩 Explicacion tecnica",
    "## 🎯 Impacto",
    "## 🧭 NIST CSF",
    "## 📘 CIS Controls v8",
    "## 🎛️ MITRE ATT&CK",
    "## 🔐 Zero Trust",
    "## 🧱 Dependencias arquitectonicas",
    "## 🛡️ Mitigaciones recomendadas",
    "## 🧩 Riesgo asociado",
    "## 📝 Resumen ejecutivo (Staff/Lead)"
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

  function buildSecArchitectAnalysisPrompt(input, options) {
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
      if (block === "## 🧩 Explicacion tecnica") {
        lines.push("Que es, como funciona y por que es relevante.");
      } else if (block === "## 🎯 Impacto") {
        lines.push("Efecto en confidencialidad, integridad, disponibilidad y riesgo organizacional.");
      } else if (block === "## 🧭 NIST CSF") {
        lines.push("Categoria y subcategoria aplicable.");
      } else if (block === "## 📘 CIS Controls v8") {
        lines.push("Control y salvaguarda correspondiente.");
      } else if (block === "## 🎛️ MITRE ATT&CK") {
        lines.push("Tacticas y tecnicas relacionadas.");
      } else if (block === "## 🔐 Zero Trust") {
        lines.push("Impacto en identidad, dispositivo, red, aplicacion y datos.");
      } else if (block === "## 🧱 Dependencias arquitectonicas") {
        lines.push("Relacion con Command Center, Dashboard, Knowledge-Base, RBAC, Zero Trust y ADRs.");
      } else if (block === "## 🛡️ Mitigaciones recomendadas") {
        lines.push("Acciones tecnicas, administrativas y de hardening.");
      } else if (block === "## 🧩 Riesgo asociado") {
        lines.push("Probabilidad, impacto y nivel (bajo/medio/alto/critico).");
      } else if (block === "## 📝 Resumen ejecutivo (Staff/Lead)") {
        lines.push("Explicacion breve, profesional y orientada a arquitectura.");
      }
      lines.push("");
    });

    if (context) {
      lines.push("Contexto adicional:", context, "");
    }

    lines = lines.concat([
      "Reglas del motor:",
      "- Se claro, estructurado y pedagogico.",
      "- No inventes estandares inexistentes.",
      "- Manten tono profesional Staff/Lead.",
      "- Usa lenguaje arquitectonico.",
      "- No repitas texto innecesario.",
      "- No uses jerga vacia.",
      "",
      "Cierre obligatorio:",
      "Incluye una tabla final con: Prioridad | Accion | Responsable | Evidencia esperada"
    ]);

    return lines.join("\n");
  }

  function buildSecArchitectAnalysisJsonTemplate(input, options) {
    var opts = options || {};
    var mode = resolveMode(opts);
    return {
      mode: mode,
      generatedAt: new Date().toISOString(),
      input: normalizeInput(input),
      requiredBlocks: FULL_ANALYSIS_BLOCKS.slice(),
      prompt: buildSecArchitectAnalysisPrompt(input, opts)
    };
  }

  function getRiskAnalyzerSections() {
    return DEFAULT_SECTIONS.slice();
  }

  function getFullAnalysisBlocks() {
    return FULL_ANALYSIS_BLOCKS.slice();
  }

  w.SECArchitectAI = w.SECArchitectAI || {};
  ensureModeApi(w.SECArchitectAI);
  w.SECArchitectAI.buildRiskAnalyzerPrompt = buildRiskAnalyzerPrompt;
  w.SECArchitectAI.buildRiskAnalyzerJsonPack = buildRiskAnalyzerJsonPack;
  w.SECArchitectAI.buildSecArchitectAnalysisPrompt = buildSecArchitectAnalysisPrompt;
  w.SECArchitectAI.buildSecArchitectAnalysisJsonTemplate = buildSecArchitectAnalysisJsonTemplate;
  w.SECArchitectAI.getRiskAnalyzerSections = getRiskAnalyzerSections;
  w.SECArchitectAI.getFullAnalysisBlocks = getFullAnalysisBlocks;
})(window);
