# ADR-002: Threat-Informed Remediation

## Context

El flujo defensivo debe convertir hallazgos tecnicos en acciones de remediacion concretas,
alineadas con MITRE ATT&CK y listas para ejecucion por equipos de plataforma.

## Decision

Adoptar remediacion informada por amenazas:

- Consumir JSON operativo como entrada primaria para inferencia.
- Ejecutar inferencia multicapas sobre grafo `User -> Role -> Resource -> Exposure -> Attack Path`.
- Si no se detecta MFA enforced o se confirma rol Global Admin con exposicion de Key Vault, priorizar `T1556` o `T1078` segun contexto.
- Generar salida IA estricta con: `probability`, `critical_node`, `mitre_technique`, `attack_path`, `terraform_fix`.
- Exponer auto-remediacion contextual en Terraform o Bicep con accion inmediata de copia.
- Integrar narrativa historica de riesgo para comparar tendencia contra corrida anterior.

## Consequences

Positivas:

- Respuesta accionable y no descriptiva.
- Integracion directa entre deteccion y hardening.
- Mejor priorizacion de riesgo operativo.
- Vinculo directo entre documentacion ADR y decisiones ejecutables en dashboard.

Negativas:

- Mayor responsabilidad en calidad del mapeo MITRE.
- Riesgo de recomendaciones incompletas ante inputs ambiguos.
