# ADR-003: Dashboard client-side

## Contexto
SEC_ARCHITECT prioriza accesibilidad inmediata, despliegue estático y experiencia de demostración técnica sin backend obligatorio.

## Problema
Balancear velocidad de entrega y simplicidad con capacidad de evolucionar a controles enterprise.

## Opciones consideradas
1. Frontend 100% client-side.
2. Frontend con backend mínimo de soporte.
3. Arquitectura full backend-driven desde inicio.

## Decisión
Implementar dashboard client-side con diseño preparado para backend opcional.

## Justificación
Permite validar valor funcional rápido, minimiza fricción de despliegue y mantiene transparencia del flujo de evaluación.

## Consecuencias
### Positivas
- Alto time-to-value.
- Menor costo de operación inicial.
- Portabilidad máxima en entornos estáticos.

### Negativas
- Límites de auditoría y control de acceso real.
- Menor capacidad de correlación histórica centralizada.
- Riesgo de interpretar simulación como operación productiva completa.
