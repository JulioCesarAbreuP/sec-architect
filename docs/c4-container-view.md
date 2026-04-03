# C4 Container View (Textual)

## System Context
SEC_ARCHITECT es un framework de arquitectura defensiva servido como sitio estático. El usuario interactúa con módulos de evaluación, conocimiento y visualización.

## Containers
1. Web UI (Static Frontend)
- Tecnología: HTML/CSS/JavaScript.
- Responsabilidad: renderizar interfaz, ejecutar lógica client-side y mostrar hallazgos.

2. Knowledge & Rule Catalog (Static Data)
- Tecnología: JSON/Markdown versionado.
- Responsabilidad: proporcionar contenido doctrinal y mapeos MITRE consumidos por la UI.

3. Optional Governance Backend (Future)
- Tecnología sugerida: API REST con AuthZ y auditoría.
- Responsabilidad: RBAC runtime, telemetría centralizada, trazabilidad de decisiones.

4. CI/CD Security Gate
- Tecnología: GitHub Actions.
- Responsabilidad: validar metadatos OG, políticas de seguridad, SAST (CodeQL) y build de contenedor.

## Container Relationships
- Usuario -> Web UI: interacción directa en navegador.
- Web UI -> Knowledge Catalog: lectura de datos locales para evaluaciones.
- Web UI -> Optional Backend (future): consulta de reglas, registro de auditoría y controles de acceso.
- Repo -> CI/CD Gate: validación continua antes de promoción.

## Architecture Notes
- Diseño actual prioriza simplicidad operacional y claridad pedagógica.
- Evolución recomendada: backend opcional para controles enterprise sin romper la experiencia actual.
