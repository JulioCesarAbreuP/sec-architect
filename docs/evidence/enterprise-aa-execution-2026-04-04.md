# Enterprise Command Center — Ejecucion AA Final

Fecha: 2026-04-04
Superficie: `tools/enterprise-command-center.html`
Objetivo: validar operabilidad real en navegador, registrar evidencia por pantalla y medir `Accessibility` before/after con Lighthouse.

---

## 1. Entorno de ejecucion

- Navegador automatizado: Google Chrome estable.
- Automatizacion de interaccion: Selenium con teclado real (`Tab`).
- Version baseline local: commit `d039e0a723e995b0a727f4599a8be324e2c200ef`.
- Version hardenizada local: commit de trabajo con fix final sobre `Attack Graph`.
- Servido local para comparativa:
  - Before: `http://127.0.0.1:8020/tools/enterprise-command-center.html`
  - After: `http://127.0.0.1:8019/tools/enterprise-command-center.html`

Limitacion del entorno:

- NVDA no estaba instalado en esta maquina.
- VoiceOver no aplica sobre Windows.
- La pasada AT real queda parcialmente sustituida por navegacion de teclado en Chrome, semantica DOM validada y Lighthouse Accessibility.

---

## 2. Lighthouse Accessibility — Before / After

Resultado:

- Before: `96/100`
- After: `100/100`

Hallazgo que bloqueaba el 100 en baseline:

- `aria-prohibited-attr` sobre `#attackGraph`.

Correccion aplicada:

- Se sustituyo `aria-label` directo sobre el contenedor por semantica explicita:
  - `role="group"`
  - `aria-labelledby="attackGraphTitle"`
  - `aria-describedby="attackGraphDescription"`

Artefactos generados:

- `docs/evidence/lighthouse-enterprise-before.json`
- `docs/evidence/lighthouse-enterprise-after.json`

---

## 3. Evidencia de interaccion real en navegador

Script utilizado:

- `scripts/enterprise_accessibility_pass.py`

Artefactos generados:

- `docs/evidence/enterprise-browser-pass/summary.json`
- `docs/evidence/enterprise-browser-pass/screens/01-header.png`
- `docs/evidence/enterprise-browser-pass/screens/02-parser.png`
- `docs/evidence/enterprise-browser-pass/screens/03-zero-trust.png`
- `docs/evidence/enterprise-browser-pass/screens/04-threat-intel.png`
- `docs/evidence/enterprise-browser-pass/screens/05-architecture-board.png`

Observaciones principales de la secuencia de foco:

- La navegacion por teclado alcanzó salidas criticas y paneles operativos sin bloqueo.
- El `Attack Graph` permanecio navegable en el flujo de foco tanto antes como despues.
- `Azure Connect`, `Shadow Monitor` y `Architecture Board` quedaron accesibles por teclado.
- La pasada confirma continuidad operativa del layout denso sin colapsar interaccion.

Primeros elementos registrados en la secuencia automatizada:

1. `ztFindings`
2. `tiTopTechniques`
3. `tiConfidenceTrend`
4. `tiTimeline`
5. `attackGraph`
6. `azure-client-id`
7. `azure-tenant-id`
8. `azure-connect-btn`
9. `shadowConsole`
10. `architectureQuestion`
11. `askArchitectureBtn`
12. `refreshArchitectureBtn`

---

## 4. Conclusion operativa

El Enterprise Command Center queda con evidencia ejecutada de:

- Contraste AA reforzado por tokens y superficies.
- Navegacion por teclado reproducible en navegador real.
- Capturas por pantalla de las zonas principales del panel.
- Lighthouse Accessibility elevado de `96` a `100` en comparativa local before/after.

Estado final:

- AA hardening completado sin reducir densidad de informacion ni simplificar el diseno del panel.