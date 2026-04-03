(function (w) {
  "use strict";

  function buildArchitectureExplainerPrompt(topic, scope) {
    var cleanTopic = (topic || "arquitectura de seguridad").toString().trim();
    var cleanScope = (scope || "high-level").toString().trim();

    var lines = [
      "Eres un Security Architect con enfoque Staff/Lead.",
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

  function explainArchitecture(topic, scope) {
    return {
      topic: (topic || "").toString(),
      scope: (scope || "high-level").toString(),
      prompt: buildArchitectureExplainerPrompt(topic, scope)
    };
  }

  w.SECArchitectAI = w.SECArchitectAI || {};
  w.SECArchitectAI.buildArchitectureExplainerPrompt = buildArchitectureExplainerPrompt;
  w.SECArchitectAI.explainArchitecture = explainArchitecture;
})(window);
