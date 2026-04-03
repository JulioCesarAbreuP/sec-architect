# Arquitectura Técnica High-Level

## Componentes client-side actuales
- Navegación y rendering de módulos.
- Evaluación y visualización del Command Center.
- Lectura de catálogo JSON para mapeos y conocimiento.
- Renderizado de blog y páginas estáticas con metadatos OG/Twitter.

## Componentes backend opcionales (futuro)
- API de reglas y perfiles con versionado y firma.
- Servicio de auditoría de ejecuciones.
- Servicio de autorización RBAC/ABAC.
- Telemetría centralizada y analítica histórica.
- API de Knowledge-Base con workflow de publicación.

## Decisiones arquitectónicas clave
- Despliegue estático para reducir complejidad operativa.
- Seguridad en capas (CSP, validaciones, sanitización, políticas de enlace).
- Modularidad por responsabilidad funcional.
- Evolución incremental hacia modelo híbrido (frontend + backend opcional).

## Backend opcional sugerido
1. Rules Service: entrega reglas, pesos, perfiles y mapeos por versión.
2. Audit Service: almacena actor, contexto, timestamp, hash y resultado.
3. AuthZ Service: aplica RBAC con políticas contextuales.
4. Telemetry Service: consolida riesgo compuesto y tendencias.
5. Content Service: gestiona curación y publicación controlada.

## Diagrama conceptual (texto)
1. Usuario autenticado solicita evaluación.
2. Frontend valida contexto y carga catálogos.
3. Motor de evaluación produce findings.
4. Findings se enriquecen con MITRE ATT&CK.
5. Se renderiza matriz de amenaza y remediación.
6. Opcional: se registra auditoría y métricas en backend.
