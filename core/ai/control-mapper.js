(function (w) {
  "use strict";

  var NIST_FUNCTIONS = ["Identify", "Protect", "Detect", "Respond", "Recover"];

  function buildControlMapperPrompt(input, context) {
    var cleanInput = (input || "").toString().trim();
    var cleanContext = (context || "").toString().trim();

    var lines = [
      "Eres un especialista en mapeo de controles de seguridad para arquitectura defensiva.",
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

  function getNistFunctions() {
    return NIST_FUNCTIONS.slice();
  }

  w.SECArchitectAI = w.SECArchitectAI || {};
  w.SECArchitectAI.buildControlMapperPrompt = buildControlMapperPrompt;
  w.SECArchitectAI.getNistFunctions = getNistFunctions;
})(window);
