# ADR-007: Entra ID Parser and Threat Inference Engine

## Context

El Command Center enterprise requiere una entrada unica de datos (JSON Entra ID),
analisis de riesgo reproducible y remediacion contextual sin depender de UI conversacional.

## Decision

Adoptar un flujo no-chat, dirigido por parser y motor de inferencia:

- `core/identity-parser.js`: parser Entra ID con validacion por tipo.
- `core/sabsa-logic.js`: motor multicapas SABSA IG4.
- `core/mitre-engine.js`: mapeo MITRE y grafo de ataque.
- `core/inference-engine.js`: ejecucion IA en segundo plano.
- `core/remediation-engine.js`: IaC contextual + rollback opcional.
- `core/memory-engine.js`: memoria operacional persistente.
- `core/telemetry-engine.js`: shadow monitor adaptativo.
- `ui/ui-renderer.js`, `ui/ui-panels.js`, `ui/ui-architecture-board.js` para capa de presentacion.
- `main.js` queda como bootstrap y orquestador de flujo.

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
