# AI Trace Export Schema

Version: `1.0.0`
Scope: Exportacion de trazas del panel IA para auditoria tecnica.

## Objetivo

Definir un contrato estable para los archivos JSON exportados desde el panel IA de SEC_ARCHITECT.

## Root Schema

Campos requeridos:
- `exportedAt` (string, ISO-8601)
- `app` (string, debe ser `SEC_ARCHITECT`)
- `schemaVersion` (string semver)
- `traceCount` (number)
- `traces` (array)

Ejemplo:

```json
{
  "exportedAt": "2026-04-04T18:20:00.000Z",
  "app": "SEC_ARCHITECT",
  "schemaVersion": "1.0.0",
  "traceCount": 2,
  "traces": [
    {
      "engine": "risk-analyzer",
      "status": "ok",
      "durationMs": 742,
      "inputPreview": "Evaluar ausencia de MFA para cuentas privilegiadas",
      "requestId": "req-a3f7...",
      "startedAt": "2026-04-04T18:19:58.100Z",
      "at": "20:19:58"
    }
  ]
}
```

## Trace Item Schema

Campos requeridos por traza:
- `engine` (string)
- `status` (string: `ok` | `warning` | `error`)
- `durationMs` (number)
- `inputPreview` (string)
- `requestId` (string)
- `startedAt` (string, ISO-8601)

Campos opcionales:
- `at` (string, hora local renderizada)

## Reglas de versionado

- Cambios compatibles hacia atras (agregar campos opcionales): incremento `minor`.
- Cambios incompatibles (renombrar/eliminar campos requeridos): incremento `major`.
- Correcciones de validacion sin cambiar contrato: incremento `patch`.

## Implementacion actual

- Validacion previa a exportacion en `core/ui/ai-panel.module.js`.
- Correlacion `requestId` generada por invocacion en `core/ai/copilot-adapter.module.js`.
- Persistencia de trazas de sesion con `sessionStorage`.

## Pruebas de contrato

- Fixture valido: `tests/fixtures/ai-trace-export.valid.json`
- Fixture invalido: `tests/fixtures/ai-trace-export.invalid.json`
- Script: `scripts/validate-ai-trace-schema.ps1`

Ejecucion:

```powershell
./scripts/validate-ai-trace-schema.ps1
./scripts/validate-ai-trace-schema.ps1 -FilePath tests/fixtures/ai-trace-export.invalid.json -Expect invalid
```

## Telemetria de deprecacion legacy

Mientras exista el bridge global, el uso de `window.SECArchitectAI` queda registrado en:

- `sessionStorage` key: `sec_architect_ai_global_usage_v1`
- Objeto de inspeccion runtime: `window.__SECARCHITECT_AI_DEPRECATION__`

Cada entrada guarda: API, path, contador, primera y ultima observacion.

Comandos runtime recomendados:

```javascript
window.SECArchitectAI.getDeprecationUsageSnapshot();
window.SECArchitectAI.exportDeprecationUsageJson();
window.SECArchitectAI.clearDeprecationUsage();
```
