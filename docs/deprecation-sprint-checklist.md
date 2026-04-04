# Deprecation Sprint Checklist

Objetivo: operar medicion de uso legacy (`window.SECArchitectAI`) con disciplina de sprint y evidencia auditable.

## Inicio de Sprint

1. Limpiar medicion anterior en entorno de trabajo.

```javascript
window.SECArchitectAI.clearDeprecationUsage();
```

2. Registrar fecha de inicio y responsable tecnico.
3. Confirmar que las pantallas ESM objetivo del sprint estan definidas.
4. Confirmar que no se agregaran nuevas dependencias a API global.

## Durante el Sprint

1. Revisar semanalmente snapshot de uso residual.

```javascript
window.SECArchitectAI.getDeprecationUsageSnapshot();
```

2. Documentar endpoints con mayor `count` y plan de migracion.
3. Validar que nuevas pantallas IA usen imports ESM.
4. Confirmar que el bridge solo se usa para compatibilidad temporal.

## Cierre de Sprint

1. Exportar evidencia JSON de uso residual.

```javascript
window.SECArchitectAI.exportDeprecationUsageJson();
```

2. Completar plantilla de evidencia de sprint.
3. Adjuntar archivo exportado en evidencia del sprint.
4. Evaluar umbral ADR-006:
   - Criterio: `0` usos globales durante `2` sprints consecutivos.

## Regla de decision

- Si hay uso residual > 0: mantener bridge y priorizar migracion de los endpoints con mayor frecuencia.
- Si uso residual = 0 por dos sprints: habilitar plan de retiro del bridge en siguiente release.
