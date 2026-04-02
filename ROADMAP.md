# ROADMAP - SEC_ARCHITECT

## Vision
SEC_ARCHITECT evoluciona como una plataforma estatica resiliente, centrada en seguridad por defecto, operacion predecible y contenido tecnico de alto valor para arquitectura defensiva en PYMEs.

## 1) Objetivos a corto, medio y largo plazo

### Corto plazo (0-3 meses)
- Consolidar baseline de seguridad en todas las paginas HTML y JS.
- Mantener modo oscuro por defecto y consistencia visual cross-page.
- Cerrar deuda tecnica de CSP y dependencias externas.
- Formalizar pruebas manuales repetibles en TESTING.md.

### Medio plazo (3-9 meses)
- Integrar pipeline CI para validaciones de seguridad y calidad.
- Introducir versionado de contenido tecnico del blog con calidad editorial.
- Implementar politicas de cache y entrega optimizada para escala regional.
- Definir SLO operativos para disponibilidad y tiempo de recuperacion.

### Largo plazo (9-18 meses)
- Integrar capa perimetral avanzada con Azure Front Door + WAF.
- Migrar a estrategia de CDN global con controles de integridad.
- Automatizar auditorias de headers y regresion de CSP.
- Elevar modelo de gobernanza a esquema enterprise multi-equipo.

## 2) Mejoras planificadas en seguridad
- Endurecer CSP hacia politica sin excepciones innecesarias.
- Reducir dependencia de terceros con self-host de recursos criticos.
- Introducir scanner de secretos y reglas de bloqueo en pull requests.
- Revisar sanitizacion de Markdown con pruebas de payloads XSS regresivos.
- Establecer baseline de cabeceras para futura capa reverse proxy.
- Definir matriz de riesgo viva enlazada con THREAT_MODEL.md.

## 3) Mejoras planificadas en UX/UI
- Refinar sistema de tipografia y espaciado para legibilidad tecnica.
- Mejorar navegacion entre home, blog y posts con enfoque task-oriented.
- Introducir componentes reutilizables para consistencia de interfaz.
- Mejorar estados de carga, vacio y error en blog dinamico.
- Fortalecer accesibilidad: contraste, foco visible, navegacion por teclado.

## 4) Evolucion del blog dinamico
- Soporte robusto de front matter (title, date, tags, author, summary).
- Taxonomias tecnicas: categorias, etiquetas, nivel de profundidad.
- Indice de contenidos por post y lectura recomendada relacionada.
- Pre-render opcional de indice de posts para menor latencia inicial.
- Politicas editoriales y checklist de seguridad por publicacion.

## 5) Integracion futura con Azure Front Door
- Publicar sitio detras de Azure Front Door Standard/Premium.
- Activar WAF gestionado con reglas OWASP y reglas custom.
- Habilitar TLS end-to-end y redireccion forzada HTTPS.
- Definir reglas de enrutamiento, cache y failover por region.
- Instrumentar observabilidad con logs de WAF y metricas de edge.

## 6) Migracion futura a CDN global
- Estrategia de cache control por tipo de recurso.
- Hashing/asset versioning para invalidaciones seguras.
- Distribucion Anycast para reducir latencia geografica.
- Politicas de origen con minimo privilegio y control de acceso.

## 7) Automatizacion de pruebas de seguridad
- Lighthouse CI en cada PR con umbrales minimos.
- Validacion automatica de CSP esperada por pagina.
- Pruebas de payloads XSS contra parser Markdown.
- Verificacion de headers de seguridad en entorno publicado.
- SAST/regex checks para detectar patrones inseguros en JS/HTML.

## 8) Expansion del contenido tecnico
- Serie de articulos: Zero Trust, CIS v8, NIST 800-53 aplicado.
- Casos practicos de hardening para PYMEs con arquitectura real.
- Guias de resiliencia operativa y respuesta a incidentes.
- Seccion de patrones anti-patron en seguridad web estatica.

## 9) Estandares de calidad del proyecto
- Seguridad como requisito de aceptacion, no como mejora opcional.
- Cambios documentados en CHANGELOG.md bajo version semantica.
- Toda funcionalidad nueva debe incluir plan de pruebas.
- Criterios de mantenibilidad: simplicidad, trazabilidad, observabilidad.
- Revisions tecnicas por pares para cambios sensibles.

## Hitos de control sugeridos
- M1: Baseline de seguridad y pruebas manuales estables.
- M2: Automatizacion CI de seguridad y Lighthouse.
- M3: Integracion edge (Front Door/WAF) en entorno staging.
- M4: Operacion madura con monitoreo, reportes y mejora continua.
