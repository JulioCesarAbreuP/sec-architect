# Enterprise Command Center — Verificacion WCAG 2.1 AA en 15 Minutos

> Objetivo: validar manualmente el Enterprise Command Center en modo de alta densidad visual, sin introducir simplificaciones de layout.
> Alcance: [tools/enterprise-command-center.html](tools/enterprise-command-center.html)
> Duracion estimada: 15 minutos.

---

## 1. Preparacion

1. Abrir el Enterprise Command Center en entorno local o GitHub Pages.
2. Activar navegacion por teclado solamente.
3. Si hay lector de pantalla disponible, activar NVDA o VoiceOver.
4. Confirmar viewport desktop principal y repetir una pasada breve en ancho reducido.

---

## 2. Tokens de contraste a validar

Referencia en [assets/css/enterprise.css](assets/css/enterprise.css):

- `--text`: texto principal.
- `--text-soft`: links y texto secundario interactivo.
- `--muted`: metadatos y labels pequenos.
- `--accent`: enfasis tecnico y acciones primarias.
- `--healthy`, `--degraded`, `--critical`: estados operativos.
- `--surface-0` a `--surface-3`: fondos y capas del panel.
- `--line-soft`, `--line-strong`: bordes visibles.

Resultado esperado:

- Ningun texto pequeno debe perder legibilidad contra fondos oscuros.
- Los cambios de estado deben seguir siendo comprensibles sin depender solo del color.

---

## 3. Evidencia por pantalla

### Pantalla 1: Header y estado global

Ruta: cabecera superior y hero.

Pasos:

1. Pulsar `Tab` desde el inicio.
2. Confirmar que aparece el `skip link`.
3. Activarlo y verificar salto a `#enterpriseRoot`.
4. Continuar tabulando sobre links de cabecera y `SOC Night Mode`.
5. Activar `SOC Night Mode` con teclado.

Resultado esperado:

- Foco visible y consistente en cada control.
- `SOC Night Mode` cambia estado y mantiene legibilidad.
- Lector de pantalla anuncia boton con estado pulsado/no pulsado.
- Badge `HEALTHY/DEGRADED/CRITICAL` sigue siendo legible y comprensible.

Evidencia a registrar:

- Observacion del foco visible en `skip link`, nav y toggle.
- Texto anunciado por lector para `SOC Night Mode`.
- Captura opcional del estado global.

### Pantalla 2: Entra ID Parser, AI Analysis y JWT

Ruta: primera fila de paneles.

Pasos:

1. Tabular hacia `graphJsonInput`, selector de formato y `Analyze Payload`.
2. Confirmar que cada control tiene nombre accesible.
3. Tabular a la salida `AI Attack Path Analysis` y comprobar foco sobre `pre`.
4. Repetir en panel JWT.

Resultado esperado:

- Textareas y selects son identificables sin depender del placeholder.
- El foco en salidas `pre` no rompe el layout.
- El contenido en `pre` es legible a contraste AA.

Evidencia a registrar:

- Lectura del nombre accesible de `graphJsonInput`, `remediationFormat` y `jwtInput`.
- Confirmacion visual de foco en `aiAnalysisOutput` y `jwtOutput`.

### Pantalla 3: Risk Radar, Auto-Remediation y Attack Simulation

Ruta: segunda fila.

Pasos:

1. Navegar al canvas `riskRadar` y escuchar su etiqueta accesible.
2. Tabular sobre salida de remediacion y boton de copiado.
3. Tabular al selector MITRE y salida de simulacion.

Resultado esperado:

- Canvas tiene descripcion operativa suficiente.
- Controles mantienen contraste y foco visible.
- Informacion de simulacion/remediacion se lee sin ambiguedad.

Evidencia a registrar:

- Etiqueta anunciada para el radar.
- Foco visible sobre `terraformFixOutput` y `attackSimulationOutput`.

### Pantalla 4: Zero-Trust y Threat Intel

Ruta: filas `zero-trust-row` y `threat-intel-row`.

Pasos:

1. Recorrer metricas y textos auxiliares.
2. Verificar lectura y contraste de labels pequenos.
3. Tabular sobre `ztFindings`, `tiTopTechniques`, `tiConfidenceTrend` y `tiTimeline`.

Resultado esperado:

- Labels pequenos siguen siendo legibles a simple vista.
- Salidas navegables anuncian su proposito.
- La semantica no depende solo del color dorado/cian/rojo.

Evidencia a registrar:

- Observacion del contraste de `zt-label`, `ti-label`, `ti-status`, `ti-updated`.
- Confirmacion de foco y lectura en las cuatro salidas `pre`.

### Pantalla 5: Attack Graph, Azure Connect, Shadow Monitor y Architecture Board

Ruta: filas finales.

Pasos:

1. Navegar al contenedor `attackGraph` y confirmar foco perceptible.
2. Recorrer los campos de Azure Connect.
3. Navegar al `Shadow Monitor` y verificar que el lector interpreta un log vivo.
4. Navegar a `Architecture Board`, campo de pregunta y acciones.

Resultado esperado:

- `attackGraph` tiene foco visible y nombre accesible.
- Inputs de Azure Connect mantienen contraste legible y labels correctos.
- `Shadow Monitor` anuncia nuevas entradas si se generan eventos.
- `Architecture Board` es operable sin raton.

Evidencia a registrar:

- Lectura del nombre accesible de `attackGraph`.
- Confirmacion de labels en `azure-client-id` y `azure-tenant-id`.
- Observacion del comportamiento de `role=log` en `shadowConsole`.

---

## 4. Criterios de salida

La pasada se considera satisfactoria cuando:

1. No hay bloqueos de teclado.
2. El foco es visible en todos los puntos interactivos y navegables.
3. Los textos pequenos siguen siendo legibles sobre fondos oscuros.
4. Los cambios de estado se entienden por texto, semantica y color.
5. El diseño conserva densidad de informacion sin overlays o espaciados excesivos.

---

## 5. Limitaciones aceptadas

- Esta guia no sustituye una medicion automatizada de contraste por pixel.
- El canvas del radar requiere etiqueta accesible porque su contenido no es semantico por defecto.
- Si no hay NVDA o VoiceOver disponibles, registrar la pasada como validacion de teclado y foco, dejando pendiente la capa AT.

---

## 6. Ejecucion Final Registrada (2026-04-04)

### 6.1 Timestamps de ejecucion

- Browser pass (real Chrome + teclado): `2026-04-04T17:14:39Z`
- Lighthouse before desktop: `2026-04-04T17:14:46.866Z`
- Lighthouse after desktop: `2026-04-04T17:15:00.338Z`
- Lighthouse before mobile: `2026-04-04T17:15:24.110Z`
- Lighthouse after mobile: `2026-04-04T17:15:38.140Z`

### 6.2 Comparativa Lighthouse Accessibility (before/after)

| Entorno | Before | After | Delta | Hallazgo Before | Hallazgo After |
|---|---:|---:|---:|---|---|
| Desktop | 96 | 100 | +4 | `aria-prohibited-attr` | none |
| Mobile | 96 | 100 | +4 | `aria-prohibited-attr` | none |

### 6.3 Capturas por pantalla

- [01-header](aa-final-2026-04-04/browser-pass/screens/01-header.png)
- [02-parser](aa-final-2026-04-04/browser-pass/screens/02-parser.png)
- [03-zero-trust](aa-final-2026-04-04/browser-pass/screens/03-zero-trust.png)
- [04-threat-intel](aa-final-2026-04-04/browser-pass/screens/04-threat-intel.png)
- [05-architecture-board](aa-final-2026-04-04/browser-pass/screens/05-architecture-board.png)

### 6.4 Notas foco / rol / aria (pasada real por teclado)

Muestra de secuencia registrada (after):

| Step | Tag | Id | Role | Aria label |
|---:|---|---|---|---|
| 1 | `pre` | `ztFindings` | — | Hallazgos del motor Zero Trust |
| 2 | `pre` | `tiTopTechniques` | — | Tecnicas principales detectadas |
| 3 | `pre` | `tiConfidenceTrend` | — | Tendencia de confianza de inteligencia |
| 4 | `pre` | `tiTimeline` | — | Linea temporal de eventos de inteligencia |
| 5 | `div` | `attackGraph` | `group` | — |
| 6 | `input` | `azure-client-id` | — | App Registration Client ID |
| 7 | `input` | `azure-tenant-id` | — | Azure AD Tenant ID |
| 8 | `button` | `azure-connect-btn` | — | — |
| 9 | `div` | `shadowConsole` | `log` | — |
| 10 | `input` | `architectureQuestion` | — | — |
| 11 | `button` | `askArchitectureBtn` | — | — |
| 12 | `button` | `refreshArchitectureBtn` | — | — |

### 6.5 NVDA / VoiceOver

- VoiceOver: no aplica en Windows.
- NVDA: se intentó instalar 2 veces via `winget`, fallando por timeout de descarga (`InternetOpenUrl() failed`, `0x80072ee2`).
- Resultado: se ejecutó pasada real en navegador con teclado y validacion ARIA/roles con Lighthouse before/after.

### 6.6 Informe consolidado

- [Informe final AA](aa-final-2026-04-04/aa-final-report.md)