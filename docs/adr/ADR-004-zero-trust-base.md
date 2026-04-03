# ADR-004: Zero Trust como modelo base

## Contexto
El framework aborda identidad, acceso, evaluación continua y resiliencia en arquitectura cloud.

## Problema
Se requiere un marco de decisión consistente para evitar confianza implícita y diseño basado en perímetro estático.

## Opciones consideradas
1. Zero Trust por defecto.
2. Modelo perimetral tradicional.
3. Híbrido sin principio rector explícito.

## Decisión
Adoptar Zero Trust como paradigma base del framework.

## Justificación
Alinea verificación explícita, mínimo privilegio y evaluación continua con los objetivos de seguridad moderna y operación distribuida.

## Consecuencias
### Positivas
- Mejor postura ante credenciales comprometidas.
- Coherencia entre módulos técnicos y narrativa de riesgo.
- Alineación con prácticas enterprise actuales.

### Negativas
- Requiere mayor madurez de gobernanza de identidad.
- Mayor complejidad inicial para equipos no habituados.
- Necesidad de reglas y revisiones periódicas más estrictas.
