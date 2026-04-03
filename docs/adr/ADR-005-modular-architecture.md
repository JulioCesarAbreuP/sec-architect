# ADR-005: Arquitectura modular en lugar de monolítica

## Contexto
SEC_ARCHITECT integra múltiples dominios: Command Center, Knowledge-Base, Intelligence Dashboard, herramientas y contenido técnico.

## Problema
Un diseño monolítico incrementa acoplamiento, dificulta evolución incremental y amplifica impacto de cambios.

## Opciones consideradas
1. Módulos desacoplados por responsabilidad.
2. Aplicación monolítica única.
3. Microfrontends completos desde fase temprana.

## Decisión
Adoptar arquitectura modular ligera con contratos de integración claros.

## Justificación
Permite evolución independiente por módulo, reduce riesgo de regresiones cruzadas y mejora mantenibilidad a medio plazo.

## Consecuencias
### Positivas
- Escalabilidad evolutiva y técnica.
- Menor blast radius ante cambios locales.
- Mayor claridad de ownership por dominio.

### Negativas
- Riesgo de divergencia de estándares entre módulos.
- Requiere disciplina de arquitectura transversal.
- Puede introducir duplicación si no hay gobernanza común.
