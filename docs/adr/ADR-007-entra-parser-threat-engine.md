# ADR-007: Entra ID Parser and Threat Inference Engine

## Context

El Command Center enterprise requiere una entrada unica de datos (JSON Entra ID),
analisis de riesgo reproducible y remediacion contextual sin depender de UI conversacional.

## Decision

Adoptar un flujo no-chat, dirigido por parser y motor de inferencia:

- `core/identity-parser.js`: parser Entra ID con validacion por tipo.
- `core/sabsa-logic.js`: motor multicapas SABSA IG4.
- `core/rules-engine.js`: deteccion deterministica y logs dinamicos SOC.
- `core/scoring-engine.js`: score de confianza zero-trust.
- `core/graph-engine.js`: modelo de nodos/aristas y simulacion de ataque.
- `core/mitre-engine.js`: mapeo MITRE y grafo de ataque.
- `core/inference-engine.js`: ejecucion IA en segundo plano.
- `core/remediation-engine.js`: IaC contextual + rollback opcional.
- `core/memory-engine.js`: memoria operacional persistente.
- `core/telemetry-engine.js`: shadow monitor adaptativo.
- `ui/ui-renderer.js`, `ui/ui-panels.js`, `ui/ui-logs.js`, `ui/ui-graph.js`, `ui/ui-score.js`, `ui/ui-architecture-board.js` para capa de presentacion.
- `main.js` queda como bootstrap y orquestador de flujo.

Decision de visualizacion:

- Chart.js se reserva para series/radar de posture por su estabilidad y lectura operativa.
- D3/Cytoscape se adopta como objetivo para grafos complejos de movimiento lateral.
- El contrato actual desacopla motor y renderer para permitir cambio de libreria sin impacto en dominio.

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
- Escalabilidad de visualizacion al separar el motor de grafo de la libreria grafica.

Negativas:

- Mayor complejidad de coordinacion entre modulos.
- Requiere disciplina para mantener contratos de salida consistentes.
- Necesidad de pruebas de contrato para evitar regresiones entre parser, reglas, score y grafo.
