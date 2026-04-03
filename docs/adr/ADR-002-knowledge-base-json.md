# ADR-002: Knowledge-Base en JSON en lugar de API

## Contexto
El proyecto se despliega en GitHub Pages, con foco en simplicidad operativa, transparencia y versionado por repositorio.

## Problema
Se requiere una fuente de conocimiento estructurada y extensible sin introducir complejidad temprana de backend.

## Opciones consideradas
1. JSON local versionado en repositorio.
2. API backend dedicada.
3. CMS externo.

## Decisión
Usar JSON local como base primaria de conocimiento en la fase actual.

## Justificación
Reduce costo operativo, acelera iteración, simplifica contribuciones por pull request y mantiene trazabilidad completa de cambios.

## Consecuencias
### Positivas
- Despliegue simple y robusto.
- Excelente auditabilidad por Git.
- Facilidad de evolución del catálogo.

### Negativas
- Sin control de acceso granular en runtime.
- Sin telemetría nativa de consumo por usuario.
- Escalabilidad limitada para escenarios multiusuario enterprise.
