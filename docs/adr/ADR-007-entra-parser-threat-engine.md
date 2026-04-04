# ADR-007: Entra ID Parser and Threat Inference Engine

## Context

El Command Center enterprise requiere una entrada unica de datos (JSON Entra ID),
analisis de riesgo reproducible y remediacion contextual sin depender de UI conversacional.

## Decision

Adoptar un flujo no-chat, dirigido por parser y motor de inferencia:

- `core/enterprise/sabsa-logic.js` como capa de validacion estructural y orquestacion SABSA.
- `core/enterprise/mitre-engine.js` para seleccion de tecnica MITRE y camino de ataque.
- `ui/enterprise/ui-controller.js` para coordinacion UI, radar, monitor, board y eventos SOC.
- `main.js` queda como bootstrap puro sin logica de dominio.

La salida del motor es estrictamente:

- `probability`
- `critical_node`
- `mitre_technique`
- `attack_path`
- `terraform_fix`

## Consequences

Positivas:

- Separacion clara de responsabilidades para revision Staff.
- Trazabilidad directa entre deteccion y remediacion IaC.
- Menor ambiguedad operativa en ejecucion SOC.

Negativas:

- Mayor complejidad de coordinacion entre modulos.
- Requiere disciplina para mantener contratos de salida consistentes.
