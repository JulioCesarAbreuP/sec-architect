# CHANGELOG — SEC_ARCHITECT

> Registro de cambios del proyecto SEC_ARCHITECT.
> Sigue el formato [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/).
> Versiones siguiendo [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

### Planned
- Integración de DOMPurify como sanitizador de producción.
- CSP `report-to` con endpoint de monitorización.
- Cabeceras HTTP reales vía Azure Front Door o Cloudflare.
- SRI en hoja de estilos de Google Fonts.
- Paginación del listado de posts.

---

## [1.4.0] — 2026-04-02

### Added
- `ARCHITECTURE.md`: documentación técnica exhaustiva de la arquitectura del sitio.
- `SECURITY_REVIEW.md`: análisis profundo de CSP, cabeceras, riesgos y tabla de controles.
- `THREAT_MODEL.md`: modelo de amenazas STRIDE + MITRE ATT&CK aplicado al proyecto.
- `ROADMAP.md`: hoja de ruta técnica a corto, medio y largo plazo.
- `CONTRIBUTING.md`: guía completa para colaboradores técnicos.
- `TESTING.md`: estrategia de pruebas de seguridad, rendimiento y accesibilidad.
- `GOVERNANCE.md`: marco de gobernanza formal con principios y criterios de aceptación.
- `DIAGRAMS.md`: diagramas ASCII de arquitectura, flujo del blog, CSP e instrucciones drawio.
- `GLOSARIO.md`: glosario técnico con definiciones, riesgos y relevancia en el proyecto.
- `CHANGELOG.md`: este archivo; historial completo desde v1.0.0.

### Security
- Todos los documentos de gobernanza incluyen trazabilidad a OWASP, CIS, NIST y Zero Trust.
- Referencia a marcos como SABSA para trazabilidad arquitectónica.

---

## [1.3.0] — 2026-04-02

### Added
- `assets/favicon.svg`: favicon SVG personalizado (compás minimalista azul sobre fondo oscuro).
- Favicon referenciado en todas las páginas HTML con rutas relativas correctas por nivel.

### Changed
- Footer global mejorado: fallback HTML estático inline en `index.html` para visibilidad sin JS.
- Toggle de tema: ahora usa exclusivamente icono de sol; sin icono de LinkedIn en header.

### Fixed
- Resolución de conflicto de merge en `blog/index.html` (mantenido hardening de seguridad).
- Rutas relativas del favicon en `blog/index.html` (`../assets/favicon.svg`) y
  `blog/identidad-vs-cuenta/index.html` (`../../assets/favicon.svg`).

### Security
- Eliminado icono de LinkedIn del header superior (reducción de superficie de confusión visual).
- Footer con iconos LinkedIn y GitHub centralizados en zona semánticamente correcta.

---

## [1.2.0] — 2026-04-02

### Added
- `assets/css/index.page.css`: estilos específicos de la home extraídos del HTML.
- `assets/css/blog.page.css`: estilos específicos del listado de posts.
- `assets/css/post.page.css`: estilos específicos del renderizador de posts.
- `blog/assets/article.page.css`: estilos de artículos pre-renderizados.

### Changed
- Eliminados todos los bloques `<style>` inline de las páginas HTML principales.
- Eliminados atributos `style="..."` inline en elementos HTML.
- CSP actualizada: eliminado `unsafe-inline` de `style-src` en todas las páginas.

### Security
- CSP sin `unsafe-inline` en `style-src`: reducción significativa de superficie XSS.
- Hardening completado en `index.html`, `blog.html`, `post.html`, `blog/index.html`
  y `blog/identidad-vs-cuenta/index.html`.

---

## [1.1.0] — 2026-04-02

### Added
- `assets/icons/linkedin.svg`: icono SVG oficial minimalista de LinkedIn.
- `assets/icons/github.svg`: icono SVG oficial minimalista de GitHub.
- `assets/css/site.css`: estilos globales para tema, footer, toggle e iconos.
  Variables CSS: `--bg`, `--fg`, `--accent`, `--muted`, `--border`.
  Clases reutilizables: `.site-icon`, `.icon-sm`, `.icon-md`, `.icon-lg`.
- `assets/js/site.js`: módulo JS global para toggle de tema y footer dinámico.
  - Modo oscuro por defecto con persistencia en `localStorage`.
  - Toggle con icono SVG de sol inyectado en `document.body`.
  - Footer con iconos LinkedIn y GitHub inyectado en `[data-site-footer]`.
- `index.js`: lógica específica de la home (formulario, honeypot, validación).
- Footer con iconos SVG inline integrado en todas las páginas HTML.

### Changed
- Eliminados scripts inline de `index.html` y movidos a `index.js`.
- CSP endurecida: eliminado `unsafe-inline` de `script-src` en páginas principales.
- `post.html`: marked.js fijado con SRI (`integrity` + `crossorigin`).
- Todos los enlaces externos con `rel="noopener noreferrer"`.

### Security
- Reducción de superficie XSS: sin scripts inline en páginas principales.
- SRI activado para marked.js en `post.html`.
- CSP reforzada con `frame-ancestors 'none'`, `base-uri 'none'`, `object-src 'none'`.
- Metas de seguridad añadidas: `X-Content-Type-Options`, `X-Frame-Options`,
  `Referrer-Policy`, `Permissions-Policy`.

---

## [1.0.0] — 2026-04-02

### Added
- `blog.html`: página de listado dinámico de posts del blog.
- `post.html`: renderizador de posts Markdown individuales.
- `blog.js`: módulo JS para generación de listado (fetch `posts.json`, ordenación por fecha).
- `markdown.js`: módulo JS para carga, parseo y sanitización de Markdown.
  - Sanitizador de allowlist (etiquetas, atributos, URLs).
  - Validación estricta del parámetro `?post=` con regex.
  - Soporte de front matter YAML (título y fecha).
- `blog/posts.json`: manifiesto de posts para despliegue estático (respaldo de listado).
- `blog/assets/`: carpeta para imágenes asociadas a posts del blog.
- Enlace al blog añadido en el header de `index.html`.
- CSP inicial en todas las páginas con directivas base de seguridad.

### Security
- Sanitizador de Markdown con allowlist de etiquetas y atributos.
- Validación de parámetro `?post=` contra regex estricta.
- CSP inicial con `object-src 'none'` y `upgrade-insecure-requests`.

---

> Los cambios de este proyecto mantienen coherencia con la arquitectura por capas
> inspirada en marcos como SABSA: cada versión es trazable a una capa arquitectónica
> (contextual, conceptual, lógica o física) y a un objetivo de seguridad o resiliencia
> definido en la documentación del proyecto.
