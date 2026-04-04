(function (w) {
  "use strict";

  var UNIFIED_BLOCKS = [
    "Explicacion tecnica",
    "Impacto",
    "NIST CSF",
    "CIS Controls v8",
    "MITRE ATT&CK",
    "Zero Trust",
    "Dependencias arquitectonicas",
    "Mitigaciones recomendadas",
    "Riesgo asociado",
    "Resumen ejecutivo"
  ];

  var DOMAIN_RULES = [
    { key: "identity", keywords: ["identidad", "identity", "mfa", "sso", "rbac", "pim", "acceso", "auth", "login", "cuenta", "privilegio"] },
    { key: "network", keywords: ["red", "network", "nsg", "firewall", "segment", "vnet", "egress", "ingress", "perimetro", "lateral"] },
    { key: "data", keywords: ["dato", "data", "cifrado", "encryption", "key vault", "secreto", "backup", "token", "dlp", "retencion"] },
    { key: "application", keywords: ["aplicacion", "application", "api", "csp", "hsts", "header", "xss", "csrf", "dependenc", "supply chain"] },
    { key: "monitoring", keywords: ["monitor", "telemetria", "telemetry", "alerta", "siem", "soc", "log", "deteccion", "incidente", "response"] },
    { key: "governance", keywords: ["gobernanza", "governance", "politica", "policy", "auditoria", "cumplimiento", "compliance", "nist", "iso", "control"] }
  ];

  var DOMAIN_LABELS = {
    identity: "Identidad y Acceso",
    network: "Red y Segmentacion",
    data: "Proteccion de Datos",
    application: "Aplicaciones y Plataforma",
    monitoring: "Monitoreo y Respuesta",
    governance: "Gobernanza y Cumplimiento"
  };

  var TYPE_RULES = {
    preventive: ["prevenir", "bloquear", "forzar", "enforce", "hardening", "deny", "minimo privilegio", "segment"],
    detective: ["detectar", "alerta", "monitor", "telemetria", "auditar", "auditoria", "siem", "visibilidad"],
    corrective: ["remediar", "corregir", "contener", "revocar", "rotar", "parche", "mitigar"],
    recovery: ["recuperar", "restore", "continuidad", "failover", "respaldo", "rto", "rpo", "resiliencia"]
  };

  var NIST_BY_DOMAIN = {
    identity: ["PR.AA", "PR.AC", "DE.CM"],
    network: ["PR.PT", "PR.AC", "DE.CM"],
    data: ["PR.DS", "DE.CM", "RC.RP"],
    application: ["PR.IP", "PR.PT", "DE.CM"],
    monitoring: ["DE.CM", "RS.AN", "RS.MI"],
    governance: ["ID.GV", "ID.RA", "PR.IP"]
  };

  var CIS_BY_DOMAIN = {
    identity: ["CIS 5 Account Management", "CIS 6 Access Control Management"],
    network: ["CIS 12 Network Infrastructure Management", "CIS 13 Network Monitoring and Defense"],
    data: ["CIS 3 Data Protection", "CIS 11 Data Recovery"],
    application: ["CIS 16 Application Software Security", "CIS 2 Software Asset Management"],
    monitoring: ["CIS 8 Audit Log Management", "CIS 17 Incident Response Management"],
    governance: ["CIS 4 Secure Configuration", "CIS 14 Security Awareness and Skills Training"]
  };

  var MITRE_BY_DOMAIN = {
    identity: ["TA0006 Credential Access", "T1078 Valid Accounts"],
    network: ["TA0008 Lateral Movement", "T1021 Remote Services"],
    data: ["TA0010 Exfiltration", "T1567 Exfiltration Over Web Service"],
    application: ["TA0001 Initial Access", "T1190 Exploit Public-Facing Application"],
    monitoring: ["TA0005 Defense Evasion", "T1070 Indicator Removal"],
    governance: ["TA0040 Impact", "T1485 Data Destruction"]
  };

  function normalizeText(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function countKeywordHits(normalized, keywords) {
    return keywords.reduce(function (total, keyword) {
      return total + (normalized.indexOf(keyword) !== -1 ? 1 : 0);
    }, 0);
  }

  function resolveDomain(normalized) {
    var best = { key: "governance", hits: 0 };

    DOMAIN_RULES.forEach(function (rule) {
      var hits = countKeywordHits(normalized, rule.keywords);
      if (hits > best.hits) {
        best = { key: rule.key, hits: hits };
      }
    });

    var confidence = best.hits >= 3 ? "alta" : best.hits >= 1 ? "media" : "baja";

    return {
      key: best.key,
      label: DOMAIN_LABELS[best.key],
      confidence: confidence,
      hits: best.hits
    };
  }

  function resolveControlType(normalized) {
    var bestType = "preventive";
    var bestHits = 0;

    Object.keys(TYPE_RULES).forEach(function (typeKey) {
      var hits = countKeywordHits(normalized, TYPE_RULES[typeKey]);
      if (hits > bestHits) {
        bestType = typeKey;
        bestHits = hits;
      }
    });

    var labels = {
      preventive: "Preventivo",
      detective: "Detectivo",
      corrective: "Correctivo",
      recovery: "Recuperacion"
    };

    return {
      key: bestType,
      label: labels[bestType],
      evidenceHits: bestHits
    };
  }

  function resolveCiaImpact(normalized, domainKey) {
    var impact = {
      confidencialidad: "media",
      integridad: "media",
      disponibilidad: "media"
    };

    if (domainKey === "identity" || normalized.indexOf("secreto") !== -1 || normalized.indexOf("mfa") !== -1) {
      impact.confidencialidad = "alta";
    }

    if (domainKey === "network" || normalized.indexOf("segment") !== -1 || normalized.indexOf("lateral") !== -1) {
      impact.integridad = "alta";
    }

    if (domainKey === "monitoring" || normalized.indexOf("continuidad") !== -1 || normalized.indexOf("resiliencia") !== -1) {
      impact.disponibilidad = "alta";
    }

    return impact;
  }

  function riskLevelFromScore(score) {
    if (score >= 80) {
      return "critico";
    }
    if (score >= 60) {
      return "alto";
    }
    if (score >= 40) {
      return "medio";
    }
    return "bajo";
  }

  function resolveRisk(normalized, typeKey, confidence) {
    var deficiencyHits = countKeywordHits(normalized, ["sin ", "ausencia", "falta", "debil", "inexistente", "no "]);
    var strengthHits = countKeywordHits(normalized, ["implementado", "forzado", "obligatorio", "automatizado", "validado"]);
    var base = typeKey === "detective" ? 58 : 52;
    var confidenceBoost = confidence === "alta" ? 6 : confidence === "media" ? 3 : 0;
    var score = Math.max(15, Math.min(95, base + (deficiencyHits * 7) - (strengthHits * 5) + confidenceBoost));

    return {
      score: score,
      likelihood: score >= 60 ? "alta" : score >= 40 ? "media" : "baja",
      impact: score >= 70 ? "alto" : score >= 45 ? "medio" : "bajo",
      level: riskLevelFromScore(score)
    };
  }

  function buildRecommendations(domainKey, typeLabel) {
    var baseline = [
      {
        priority: "P1",
        action: "Definir criterio verificable del control y su evidencia tecnica.",
        responsible: "Security Architect",
        evidence: "ADR + matriz de controles actualizada"
      },
      {
        priority: "P2",
        action: "Instrumentar monitoreo y alertas asociadas al control en el dashboard defensivo.",
        responsible: "SOC / Plataforma",
        evidence: "Reglas de alerta y registros de prueba"
      },
      {
        priority: "P3",
        action: "Ejecutar revision trimestral para validar eficacia y riesgo residual.",
        responsible: "GRC + Dueño de servicio",
        evidence: "Acta de revision y plan de remediacion"
      }
    ];

    if (domainKey === "identity") {
      baseline[0].action = "Aplicar minimo privilegio, MFA resistente a phishing y revisiones de acceso periodicas.";
    }

    if (domainKey === "network") {
      baseline[1].action = "Validar micro-segmentacion y denegacion por defecto entre zonas de confianza.";
    }

    if (typeLabel === "Recuperacion") {
      baseline[2].action = "Probar RTO/RPO mediante simulacros y evidenciar lecciones aprendidas.";
    }

    return baseline;
  }

  function buildUnifiedPrompt(controlText) {
    return [
      "Prompt Unificado SEC_ARCHITECT:",
      "Analiza el control recibido con enfoque Staff/Lead y responde con los bloques oficiales del framework.",
      "Control:",
      '"' + String(controlText || "").trim() + '"',
      "Bloques obligatorios:",
      "- " + UNIFIED_BLOCKS.join("\n- "),
      "Reglas:",
      "- Mantener trazabilidad NIST/CIS/MITRE.",
      "- Explicar impacto en Zero Trust.",
      "- Cerrar con acciones priorizadas y evidencia esperada."
    ].join("\n");
  }

  function analyzeControl(controlText) {
    var raw = String(controlText || "").trim();
    var normalized = normalizeText(raw);

    if (!raw) {
      return {
        ok: false,
        error: "empty_input",
        message: "Debes proporcionar una descripcion de control para analizar."
      };
    }

    var domain = resolveDomain(normalized);
    var type = resolveControlType(normalized);
    var ciaImpact = resolveCiaImpact(normalized, domain.key);
    var risk = resolveRisk(normalized, type.key, domain.confidence);

    return {
      ok: true,
      version: "1.0.0",
      generatedAt: new Date().toISOString(),
      input: raw,
      classification: {
        domain: domain,
        controlType: type
      },
      analysis: {
        technicalSummary: "El control se clasifica en el dominio " + domain.label + " con naturaleza " + type.label.toLowerCase() + ".",
        impact: {
          cia: ciaImpact,
          business: "Reduce exposicion operativa cuando se valida con evidencia continua."
        },
        nistCsf: NIST_BY_DOMAIN[domain.key].slice(),
        cisControlsV8: CIS_BY_DOMAIN[domain.key].slice(),
        mitreAttack: MITRE_BY_DOMAIN[domain.key].slice(),
        zeroTrust: [
          "Identidad: validar acceso explicito y contexto de sesion.",
          "Red: limitar movimiento lateral con segmentacion.",
          "Aplicacion y datos: aplicar politicas de proteccion y telemetria."
        ],
        architecturalDependencies: [
          "core/ai/risk-analyzer.js",
          "core/ai/control-mapper.js",
          "tools/control-analysis.html",
          "docs/architecture-high-level.md"
        ],
        recommendations: buildRecommendations(domain.key, type.label),
        residualRisk: risk,
        executiveSummary: "Control evaluado con enfoque de arquitectura defensiva, trazabilidad normativa y accion operativa priorizada.",
        assumptions: [
          "No se recibio evidencia tecnica adicional del entorno.",
          "El analisis aplica heuristicas del Prompt Unificado SEC_ARCHITECT."
        ]
      },
      promptPack: {
        blocks: UNIFIED_BLOCKS.slice(),
        unifiedPrompt: buildUnifiedPrompt(raw)
      }
    };
  }

  function getUnifiedBlocks() {
    return UNIFIED_BLOCKS.slice();
  }

  w.SECArchitectAI = w.SECArchitectAI || {};
  w.SECArchitectAI.analyzeControl = analyzeControl;
  w.SECArchitectAI.buildUnifiedControlPrompt = buildUnifiedPrompt;
  w.SECArchitectAI.getUnifiedPromptBlocks = getUnifiedBlocks;
})(window);
