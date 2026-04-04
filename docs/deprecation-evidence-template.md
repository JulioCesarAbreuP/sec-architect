# Deprecation Evidence Template

Fecha de registro: YYYY-MM-DD
Sprint: SXX-YYYY
Responsable: Nombre / Rol

## 1. Resumen ejecutivo

- Estado de migracion ESM: 
- Riesgo actual de dependencia global: Bajo | Medio | Alto
- Decision del sprint: Continuar migracion | Mantener bridge | Preparar retiro

## 2. Snapshot de uso (runtime)

Comando utilizado:

```javascript
window.SECArchitectAI.getDeprecationUsageSnapshot();
```

Resultado resumido:
- totalEntries:
- totalCalls:
- APIs legacy con mayor uso:
  - api@path:

## 3. Evidencia exportada

Comando utilizado:

```javascript
window.SECArchitectAI.exportDeprecationUsageJson();
```

Archivo generado:
- Nombre archivo:
- Ruta de almacenamiento:
- Hash (opcional):

## 4. Hallazgos

- Pantallas aun dependientes de namespace global:
- Bloqueadores tecnicos:
- Acciones tomadas:

## 5. Validacion de umbral ADR-006

Criterio oficial: `0` usos globales en `2` sprints consecutivos.

- Sprint actual cumple 0 usos: Si | No
- Sprint anterior cumple 0 usos: Si | No
- Se cumple condicion de retiro: Si | No

## 6. Plan del siguiente sprint

1. 
2. 
3. 
