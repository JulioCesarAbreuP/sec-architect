# Modelo RBAC — Command Center

## Roles
- Viewer
- Analyst
- Architect
- Admin

## Matriz de permisos por módulo
| Módulo | Viewer | Analyst | Architect | Admin |
|---|---|---|---|---|
| Command Center (vista) | Leer | Leer/Ejecutar | Leer/Ejecutar | Total |
| Reglas y perfiles | No | Lectura | Crear/Editar | Aprobar/Publicar |
| MITRE Mapping | Lectura | Lectura/Análisis | Diseñar mapeos | Versionar/Bloquear |
| Knowledge Base | Lectura | Lectura | Curar contenido | Control de cambios |
| Reportes | Lectura | Generar | Diseñar plantilla | Política de retención |
| Configuración global | No | No | Parcial técnica | Total |

## Riesgos mitigados
- Cambios no autorizados en lógica de evaluación.
- Manipulación de severidades o mapeos MITRE.
- Exposición de configuración por exceso de privilegios.
- Falta de trazabilidad sobre decisiones y cambios.

## Relación con Zero Trust
- Verificación explícita por identidad y contexto.
- Mínimo privilegio por función real.
- Segmentación de capacidades críticas.
- Revisión continua de asignaciones de rol.

## Justificación de diseño
El modelo separa operación táctica (Analyst), diseño arquitectónico (Architect) y gobierno de plataforma (Admin), reduciendo conflicto de interés y mejorando control interno.
