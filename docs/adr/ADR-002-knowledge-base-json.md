# ADR-002: Threat-Informed Remediation

## Context

El flujo defensivo debe convertir hallazgos tecnicos en acciones de remediacion concretas,
alineadas con MITRE ATT&CK y listas para ejecucion por equipos de plataforma.

## Decision

Adoptar remediacion informada por amenazas:

- Si una Conditional Access Policy no incluye MFA en `grantControls`, disparar
	`[CRITICAL] MITRE T1556 - Modify Authentication Process`.
- Exponer `Auto-Remediar` para generar Bicep o Terraform correctivo.
- En JWT, si `amr` no contiene `mfa`, marcar fallo SC-300 en estado del Command Center.
- En inferencia de riesgo, devolver exclusivamente:
	`probabilidad`, `tecnica MITRE`, `camino de ataque`, `recomendacion`.

## Consequences

Positivas:

- Respuesta accionable y no descriptiva.
- Integracion directa entre deteccion y hardening.
- Mejor priorizacion de riesgo operativo.

Negativas:

- Mayor responsabilidad en calidad del mapeo MITRE.
- Riesgo de recomendaciones incompletas ante inputs ambiguos.
