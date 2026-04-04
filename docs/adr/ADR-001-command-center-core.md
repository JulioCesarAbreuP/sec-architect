# ADR-001: Decoupled Logic for SABSA-MITRE Engine

## Context

El Command Center requiere separar logica de negocio, deteccion MITRE, validacion de artefactos,
presentacion UI y orquestacion para evitar acoplamiento y reducir deuda tecnica.

## Decision

Adoptar arquitectura modular ES6 con responsabilidades estrictas:

- `core/enterprise/inference-engine.js`: inferencia IA con prompt oculto y salida estructurada.
- `core/enterprise/multi-layer-inference.js`: 5 capas (sintactica, semantica, grafo, probabilidad, remediacion).
- `core/enterprise/operational-memory.js`: memoria operacional persistente de analisis.
- `core/enterprise/shadow-monitor.js`: telemetria viva con frecuencia adaptativa al riesgo.
- `core/enterprise/architecture-board.js`: board documental vivo para ARCHITECTURE y ADR.
- `core/enterprise/attack-simulation.js`: simulacion MITRE T1078/T1556/T1548 con impacto dinamico.
- `ui/enterprise/*.js`: panel IA, panel JSON, panel JWT y renderer de estado.
- `main.js`: patron central `analyzeArchitectureWithAI()` como nucleo de orquestacion.

## Consequences

Positivas:

- Testabilidad por modulo.
- Menor impacto cruzado entre paneles.
- Escalabilidad enterprise del Command Center.
- Trazabilidad explicita entre grafo de ataque y accion correctiva.
- Estado operativo persistente con contexto historico por corrida.

Negativas:

- Mayor cantidad de contratos entre modulos.
- Mayor disciplina requerida para evolucion de interfaces.
