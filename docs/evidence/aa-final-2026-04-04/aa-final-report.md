# Informe Final AA — Enterprise Command Center

- Generado: 2026-04-04T17:16:43Z
- Browser pass timestamp: 2026-04-04T17:14:39Z
- Lighthouse before desktop fetch: 2026-04-04T17:14:46.866Z
- Lighthouse after desktop fetch: 2026-04-04T17:15:00.338Z
- Lighthouse before mobile fetch: 2026-04-04T17:15:24.110Z
- Lighthouse after mobile fetch: 2026-04-04T17:15:38.140Z

## 1) Comparativa Lighthouse Accessibility (before/after)

| Entorno | Before | After | Delta | Hallazgo Before | Hallazgo After |
|---|---:|---:|---:|---|---|
| Desktop | 96 | 100 | +4 | aria-prohibited-attr | none |
| Mobile | 96 | 100 | +4 | aria-prohibited-attr | none |

## 2) Evidencia por pantalla (capturas)

- docs/evidence/aa-final-2026-04-04/browser-pass/screens/01-header.png
- docs/evidence/aa-final-2026-04-04/browser-pass/screens/02-parser.png
- docs/evidence/aa-final-2026-04-04/browser-pass/screens/03-zero-trust.png
- docs/evidence/aa-final-2026-04-04/browser-pass/screens/04-threat-intel.png
- docs/evidence/aa-final-2026-04-04/browser-pass/screens/05-architecture-board.png

## 3) Notas de foco / rol / aria (pasada real por teclado)

Muestra de secuencia de foco (after):

| Step | Tag | Id | Role | Aria label | Aria pressed |
|---:|---|---|---|---|---|
| 1 | pre | ztFindings |  | Hallazgos del motor Zero Trust |  |
| 2 | pre | tiTopTechniques |  | Tecnicas principales detectadas |  |
| 3 | pre | tiConfidenceTrend |  | Tendencia de confianza de inteligencia |  |
| 4 | pre | tiTimeline |  | Linea temporal de eventos de inteligencia |  |
| 5 | div | attackGraph | group |  |  |
| 6 | input | azure-client-id |  | App Registration Client ID |  |
| 7 | input | azure-tenant-id |  | Azure AD Tenant ID |  |
| 8 | button | azure-connect-btn |  |  |  |
| 9 | div | shadowConsole | log |  |  |
| 10 | input | architectureQuestion |  |  |  |
| 11 | button | askArchitectureBtn |  |  |  |
| 12 | button | refreshArchitectureBtn |  |  |  |
| 13 | div | architectureBoardContent |  |  |  |
| 14 | body |  |  |  |  |
| 15 | a |  |  |  |  |
| 16 | a |  |  |  |  |
| 17 | a |  |  |  |  |
| 18 | a |  |  |  |  |

## 4) NVDA / VoiceOver

- VoiceOver: no aplica en Windows.
- NVDA: instalacion intentada 2 veces via winget y fallida por timeout de descarga (`InternetOpenUrl() failed`, `0x80072ee2`).
- Se ejecuto pasada real de teclado en Chrome y validacion automatizada ARIA/roles con Lighthouse before/after.

## 5) Artefactos fuente

- docs/evidence/aa-final-2026-04-04/lighthouse-before-desktop.json
- docs/evidence/aa-final-2026-04-04/lighthouse-after-desktop.json
- docs/evidence/aa-final-2026-04-04/lighthouse-before-mobile.json
- docs/evidence/aa-final-2026-04-04/lighthouse-after-mobile.json
- docs/evidence/aa-final-2026-04-04/browser-pass/summary.json
