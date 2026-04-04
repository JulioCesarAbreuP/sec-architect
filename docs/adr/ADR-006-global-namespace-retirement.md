# ADR-006 — Retiro progresivo de namespace global SECArchitectAI

## Estado
Accepted

## Contexto

El proyecto ha iniciado una migracion controlada a ESM para motores IA y paneles UI.
Persisten consumidores legacy que usan `window.SECArchitectAI`, especialmente en superficies previas al cambio modular.

Para evitar ruptura funcional y reducir riesgo operativo, se define un retiro por fases en lugar de un corte abrupto.

## Decision

Adoptar una estrategia de retiro progresivo del namespace global en 4 fases:

1. Fase Puente (actual)
- Mantener `window.SECArchitectAI` solo como bridge de compatibilidad.
- Source of truth de motores IA: modulos ESM.

2. Fase Coexistencia
- Migrar consumidores por pantalla a imports ESM.
- Evitar nuevos desarrollos sobre API global.

3. Fase Deprecacion
- Marcar metodos globales como deprecados en consola (warning no bloqueante).
- Medir uso residual de la API global por pagina.

4. Fase Retiro
- Eliminar bridge global cuando no existan consumidores legacy.
- Mantener un fallback temporal versionado por una release para rollback controlado.

## Plan de ejecucion

- Q2 2026: migrar pantallas con mayor uso IA (Command Center y herramientas interactivas).
- Q3 2026: activar warnings de deprecacion en bridge.
- Q4 2026: remover bridge y dependencias globales residuales.

## Consecuencias

Positivas:
- Menor acoplamiento global.
- Mejor testabilidad y trazabilidad por modulo.
- Contratos de import/export mas claros.

Riesgos:
- Riesgo de ruptura en paginas no migradas.
- Necesidad de inventario permanente de consumidores legacy.

Mitigaciones:
- Bridge ESM controlado.
- Migracion incremental por pantalla.
- Validacion CI y pruebas de smoke por pagina.

## Criterios de salida

Se considera completado el retiro cuando:
- Ninguna pagina consume `window.SECArchitectAI` directamente.
- Todos los consumidores importan motores ESM.
- El bridge global se elimina sin regresiones en CI.
- Umbral operativo: `0` usos globales registrados durante `2` sprints consecutivos.

## Medicion del umbral

- Fuente primaria: `sessionStorage` key `sec_architect_ai_global_usage_v1`.
- Snapshot runtime: `window.SECArchitectAI.getDeprecationUsageSnapshot()`.
- Export auditable: `window.SECArchitectAI.exportDeprecationUsageJson()`.
- Reinicio controlado de medicion: `window.SECArchitectAI.clearDeprecationUsage()` al inicio de cada sprint.
