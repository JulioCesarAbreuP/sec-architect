# Integración Zero Trust en SEC_ARCHITECT

## Principios aplicados
- Verificación explícita por identidad y contexto.
- Mínimo privilegio por rol y operación.
- Asunción de compromiso (no confianza implícita).
- Evaluación continua de riesgo.

## Aplicación por módulo
- Command Center: evaluación contextual por escenario/perfil/IG.
- Knowledge-Base: contenido versionado con gobernanza.
- Intelligence Dashboard: priorización por severidad y exposición.
- Herramientas: alcance acotado y controles defensivos en frontend.

## Evaluación continua
Cada ejecución recalcula riesgo compuesto y prioriza hallazgos en función del contexto operativo; no existe estado de confianza permanente.

## Identidad como perímetro
El modelo de decisión se centra en quién solicita, qué rol tiene y en qué contexto opera, no en ubicación de red o perímetro tradicional.

## Request flow (texto)
1. Request entra con identidad y claims de rol.
2. Se valida política de acceso mínimo.
3. Se ejecuta evaluación permitida.
4. Se correlaciona con MITRE y reglas del framework.
5. Se emite remediación priorizada.
6. Se registra evidencia (si backend opcional está habilitado).
