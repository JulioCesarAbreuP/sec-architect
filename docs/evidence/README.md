# Evidence Repository

Este directorio centraliza evidencia operativa por sprint para el retiro progresivo del namespace global y validaciones de contrato IA.

## Estructura sugerida

- `docs/evidence/sprint-XX-YYYY/`
  - `deprecation-usage.json` (salida de `exportDeprecationUsageJson`)
  - `deprecation-evidence.md` (basado en `docs/deprecation-evidence-template.md`)
  - `notes.md` (hallazgos tecnicos y decisiones)

## Flujo recomendado

1. Inicio de sprint: reiniciar metrica.
   - `window.SECArchitectAI.clearDeprecationUsage();`
2. Mitad de sprint: revisar snapshot.
   - `window.SECArchitectAI.getDeprecationUsageSnapshot();`
3. Cierre de sprint: exportar evidencia.
   - `window.SECArchitectAI.exportDeprecationUsageJson();`

## Convencion de nombres

- Carpeta: `sprint-<numero>-<anio>`
- Evidencia markdown: `deprecation-evidence.md`
- Export JSON: `deprecation-usage-<YYYYMMDD>.json`

## Politica de conservacion

Mantener al menos los ultimos 4 sprints para auditoria comparativa y decision de retiro del bridge.
