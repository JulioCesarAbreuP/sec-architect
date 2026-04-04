# ADR-001: Decoupled Logic for SABSA-MITRE Engine

## Context

El Command Center requiere separar logica de negocio, deteccion MITRE, validacion de artefactos,
presentacion UI y orquestacion para evitar acoplamiento y reducir deuda tecnica.

## Decision

Adoptar arquitectura modular ES6 con responsabilidades estrictas:

- `core/sabsa-engine.js`: scoring SABSA e inferencia de riesgo.
- `core/mitre-mapper.js`: mapeo y deteccion MITRE ATT&CK.
- `core/json-validator.js`: validacion de policies JSON y remediacion.
- `core/jwt-validator.js`: validacion JWT con foco SC-300.
- `ui/*.js`: render y paneles sin logica de negocio.
- `main.js`: orquestador de flujos.

## Consequences

Positivas:

- Testabilidad por modulo.
- Menor impacto cruzado entre paneles.
- Escalabilidad enterprise del Command Center.

Negativas:

- Mayor cantidad de contratos entre modulos.
- Mayor disciplina requerida para evolucion de interfaces.
