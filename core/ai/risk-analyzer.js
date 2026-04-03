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

  function normalizeInput(input) {
    return (input || "").toString().trim();
  }

  function buildRiskAnalyzerPrompt(input, options) {
    var cleanInput = normalizeInput(input);
    var opts = options || {};
    var language = opts.language || "es";

    var lines = [
      "Eres un Security Architect (nivel Staff/Lead) especializado en analisis de riesgos, controles y tecnicas defensivas.",
      "Responde en " + language + " con claridad tecnica y enfoque pedagogico.",
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

  function getRiskAnalyzerSections() {
    return DEFAULT_SECTIONS.slice();
  }

  w.SECArchitectAI = w.SECArchitectAI || {};
  w.SECArchitectAI.buildRiskAnalyzerPrompt = buildRiskAnalyzerPrompt;
  w.SECArchitectAI.getRiskAnalyzerSections = getRiskAnalyzerSections;
})(window);
