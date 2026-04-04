# SECURITY_REVIEW — SEC_ARCHITECT

> Análisis técnico exhaustivo de seguridad del sitio estático SEC_ARCHITECT.
> Última revisión: 2026-04-02 (pasada final). Revisado contra OWASP Top 10, CIS Controls v8 y NIST 800-53.

---

## 1. Análisis Profundo de la CSP

### 1.1 Política Actual (pages principales)

```
default-src 'self';
script-src 'self';
style-src 'self' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com;
img-src 'self' data:;
connect-src 'self' https://formspree.io;
form-action 'self' https://formspree.io;
object-src 'none';
frame-ancestors 'none';
base-uri 'none';
upgrade-insecure-requests;
block-all-mixed-content
```

### 1.2 Análisis por Directiva

| Directiva | Valor | Evaluación | Notas |
|-----------|-------|------------|-------|
| `default-src` | `'self'` | ✅ Correcto | Fallback restrictivo para directivas no definidas |
| `script-src` | `'self'` | ✅ Correcto | Sin `unsafe-inline` ni `unsafe-eval` |
| `style-src` | `'self' fonts.googleapis.com` | ✅ Correcto | Se permite origen de fonts externo necesario |
| `font-src` | `'self' fonts.gstatic.com` | ✅ Correcto | Acotado al CDN de fuentes de Google |
| `img-src` | `'self' data:` | ⚠️ Aceptable | `data:` permite imágenes inline; monitorizar |
| `connect-src` | `'self' formspree.io` | ✅ Correcto | Fetch acotado a origen propio y Formspree |
| `form-action` | `'self' formspree.io` | ✅ Correcto | Previene redirección de formulario a orígenes maliciosos |
| `object-src` | `'none'` | ✅ Óptimo | Bloquea Flash, Shockwave y plugins |
| `frame-ancestors` | `'none'` | ✅ Óptimo | Previene clickjacking completo |
| `base-uri` | `'none'` | ✅ Óptimo | Previene ataques de base tag injection |
| `upgrade-insecure-requests` | presente | ✅ Correcto | Fuerza HTTPS en requests del navegador |
| `block-all-mixed-content` | presente | ✅ Correcto | Bloquea contenido mixto HTTP/HTTPS |

### 1.3 Diferencias por Página

| Página | Diferencia respecto a base |
|--------|---------------------------|
| `post.html` | Añade `https://cdn.jsdelivr.net` a `script-src` para marked.js |
| `blog.html` | Política idéntica a base |
| `index.html` | Política base completa |
| `blog/index.html` | CSP equivalente con ajuste de rutas relativas |

### 1.4 Limitación Estructural

Las CSP se implementan como `<meta http-equiv="Content-Security-Policy">`.
GitHub Pages **no permite configurar cabeceras HTTP personalizadas**.
Esto implica que directivas como `frame-ancestors` y `report-uri`/`report-to`
**no funcionan vía meta tag** (son ignoradas por el navegador).

Mitigación futura: desplegar detrás de Azure Front Door o Cloudflare con
cabeceras HTTP reales en la respuesta.

Estado actual: se activaron directivas `report-uri` y `report-to` en las CSP
de superficies HTML principales para estandarizar política y preparar el
cutover a cabeceras HTTP reales en reverse proxy.

---

## 2. Evaluación de Cabeceras de Seguridad

| Cabecera | Estado | Implementación | Limitación |
|----------|--------|----------------|------------|
| Content-Security-Policy | ✅ Implementada | `<meta>` | `frame-ancestors` ignorado vía meta |
| X-Content-Type-Options | ✅ Implementada | `<meta http-equiv>` | Solo orientativa sin cabecera HTTP real |
| X-Frame-Options | ✅ Implementada | `<meta http-equiv>` | No equivalente a cabecera HTTP en todos los navegadores |
| Referrer-Policy | ✅ Implementada | `<meta>` | Efectiva en navegadores modernos |
| Permissions-Policy | ✅ Implementada | `<meta>` | Soporte variable por navegador |
| Strict-Transport-Security | ⚠️ No configurable | GitHub Pages gestiona TLS | Sin control sobre HSTS max-age |
| Cross-Origin-Opener-Policy | ❌ No implementada | — | Requiere cabecera HTTP real |
| Cross-Origin-Resource-Policy | ❌ No implementada | — | Requiere cabecera HTTP real |

### 2.1 Recomendación para Reverse Proxy / Front Door

```http
Content-Security-Policy: default-src 'self'; script-src 'self' https://cdn.jsdelivr.net; ...
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=(), interest-cohort=()
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
Cache-Control: no-cache (para HTML); max-age=31536000, immutable (para assets versionados)
```

---

## 3. Riesgos del Blog Dinámico

### 3.1 Vector de Riesgo: Inyección de Contenido Markdown

**Descripción**: Un post `.md` con contenido HTML malicioso podría generar XSS
al ser renderizado por marked.js e inyectado en el DOM con `innerHTML`.

**Mitigación implementada**:
- Sanitización primaria con DOMPurify en `markdown.js` con configuración estricta.
- `FORBID_TAGS` para bloquear `svg`, `math`, `style`, `script`, `iframe`, `object`,
   `embed` y `form`.
- `FORBID_ATTR` para bloquear atributos peligrosos (`onerror`, `onload`, `style`) y
   `ALLOW_DATA_ATTR=false`.
- Validación de URL permitida (`https`, `mailto`, rutas relativas, hash y `data:image/*`)
   en `ALLOWED_URI_REGEXP`.
- Fallback defensivo al sanitizador legacy de allowlist si DOMPurify no está disponible.

**Riesgo residual**: Dependencia de tercero (CDN jsDelivr) para cargar DOMPurify en
`post.html`; se mantiene fallback local de sanitización para continuidad funcional.

**Recomendación**: Añadir SRI al script de DOMPurify en próximo hardening para cerrar
el vector de supply chain de dependencias CDN.

### 3.2 Vector de Riesgo: Path Traversal en Parámetro ?post=

**Descripción**: El parámetro `?post=nombre.md` se usa para construir la URL de fetch.
Si no se valida correctamente, podría usarse para hacer fetch de rutas no previstas.

**Mitigación implementada**:
- Validación estricta: `/^[\w\-\.]+\.md$/` — solo caracteres alfanuméricos,
  guiones, puntos y extensión `.md`.
- No se permite `../` ni rutas absolutas.

**Riesgo residual**: Bajo. El fetch fallará con 404 si el archivo no existe.
No hay riesgo de SSRF porque el fetch es del mismo origen (GitHub Pages).

---

## 4. Revisión del Formulario

| Aspecto | Estado | Detalle |
|---------|--------|---------|
| Backend | Formspree (tercero) | Sin servidor propio; datos enviados a Formspree |
| Validación client-side | ✅ Implementada | Campos requeridos; email format |
| Honeypot anti-bot | ✅ Implementado | Campo `_hp_filter` oculto |
| CSP restricción | ✅ `form-action` limitado | Solo `'self'` y `formspree.io` |
| Exposición de datos | ⚠️ Formspree almacena | Los datos se almacenan en Formspree; sin control propio |
| Rate limiting | ❌ No implementado en cliente | Formspree aplica su propio rate limit en el plan gratuito |
| CSRF | N/A para sitio estático | Sin sesiones ni cookies de autenticación propias |

**Recomendación**: Activar notificaciones de Formspree y revisar periódicamente
los envíos para detectar spam o intentos de abuso. Considerar CAPTCHA en el futuro.

---

## 5. Evaluación del Uso de SVG Inline

### 5.1 Riesgos Potenciales de SVG

SVG es un formato XML que puede contener:
- Scripts (`<script>` dentro de SVG).
- Handlers de eventos (`onload`, `onclick`).
- Referencias externas (`<image href="...">`, `<use href="...">`).
- CSS embebido que puede afectar al DOM padre.

### 5.2 Mitigaciones Aplicadas

- Los SVGs de LinkedIn y GitHub son SVGs **minimalistas y controlados**:
  solo contienen paths geométricos y atributos de presentación (`fill`, `xmlns`).
- No contienen `<script>`, eventos inline ni referencias externas.
- Son generados inline por `site.js` desde strings literales en el propio código,
  no cargados desde archivos externos en tiempo de ejecución.
- El favicon SVG (`assets/favicon.svg`) contiene solo formas y colores definidos.

### 5.3 Riesgo Residual

Si en el futuro se permite a usuarios subir o referenciar SVGs en posts Markdown,
el sanitizador debe tratar los SVGs como HTML peligroso y eliminarlos o filtrarlos
a nivel de etiqueta.

---

## 6. Tabla de Riesgos

| ID | Riesgo | Componente | Probabilidad | Impacto | Severidad | Estado |
|----|--------|------------|--------------|---------|-----------|--------|
| R01 | XSS via contenido Markdown | `markdown.js` | Media | Alto | Alto | Mitigado (DOMPurify + fallback) |
| R02 | Path traversal en ?post= | `markdown.js` | Baja | Medio | Medio | Mitigado (regex) |
| R03 | Supply chain CDN (marked.js) | `post.html` | Baja | Alto | Medio | Mitigado (SRI) |
| R04 | Datos de formulario en tercero | Formspree | Media | Medio | Medio | Aceptado + monitoreado |
| R05 | CSP frame-ancestors inefectiva | Todas las páginas | Media | Medio | Medio | Pendiente (Front Door) |
| R06 | Scripts inline residuales | `blog/index.html` | Baja | Medio | Bajo | Mitigado (migrado a JS externo) |
| R07 | SVG malicioso en posts futuros | `markdown.js` | Baja | Alto | Medio | Mitigado (FORBID_TAGS en DOMPurify) |
| R08 | Fuga de datos via Referrer | Todas las páginas | Baja | Bajo | Bajo | Mitigado (Referrer-Policy) |
| R09 | MIME sniffing | Todas las páginas | Baja | Bajo | Bajo | Mitigado (nosniff meta) |
| R10 | Abuse del formulario | `index.html` | Media | Bajo | Bajo | Mitigado (honeypot) |
| R11 | Falla funcional del blog por rutas relativas | `blog.js` + `blog/index.html` | Media | Medio | Medio | Mitigado (detección de contexto y manifiesto) |

---

## 7. Recomendaciones Futuras

### Prioridad Alta

1. **Añadir SRI al script de DOMPurify** en `post.html` para completar la cadena
   de integridad de dependencias CDN en el renderizador de Markdown.

2. **Migrar a cabeceras HTTP reales** desplegando detrás de Azure Front Door,
   Cloudflare o Netlify Headers para hacer efectivas `frame-ancestors`,
   `HSTS`, `COOP` y `CORP`.

### Prioridad Media

3. **Mantener la disciplina sin inline script/style** en nuevas páginas y PRs,
   con revisión obligatoria de CSP en cada cambio de UI.

4. **Implementar CSP `report-to`** con un endpoint de reporte (p.ej., Report URI)
   para monitorización continua de violaciones CSP en producción.

5. **Auditar Formspree periódicamente**: revisar envíos, activar doble opt-in
   y evaluar alternativas autogestionadas si crece el volumen.

### Prioridad Baja

6. **Añadir Subresource Integrity** a las hojas de estilo de Google Fonts.

7. **Implementar `require-trusted-types-for 'script'`** en CSP para forzar el uso
   de Trusted Types y eliminar asignaciones directas a `innerHTML`.

8. **Revisar y documentar** el inventario de dependencias externas semestralmente
   (aligned con CIS Control 2).

---

## 9. Hallazgos y Correcciones Concretas (Pasada Final)

### 9.1 Hallazgos confirmados

1. **Estructura HTML inválida en home**: existían cierres duplicados de `</body>`/`</html>`.
2. **Acoplamiento UX/CSP en formulario**: estados de envío dependían de estilos inline dinámicos.
3. **Blog publicado con fallo funcional**: `blog/index.html` no mantenía una landing consistente y
   `blog.js` resolvía rutas de forma frágil según ubicación.
4. **Metadatos de seguridad engañosos en páginas heredadas**: presencia de cabeceras obsoletas
   o no efectivas vía `<meta>` en contenido legado.
5. **Accesibilidad mejorable en controles globales**: feedback parcial en toggle de tema y foco en iconos.

### 9.2 Correcciones aplicadas

1. **Home saneada y validada** (`index.html`): estructura final consistente, sin cierres duplicados.
2. **Formulario desacoplado de inline styles** (`index.js`, `assets/css/index.page.css`):
   estados de éxito/error migrados a clases CSS compatibles con CSP estricta.
3. **Blog dinámico estabilizado** (`blog.js`, `blog/index.html`, `blog/posts.json`):
   detección de contexto (`/` vs `/blog/`), prioridad a manifiesto estático y fallback controlado.
4. **Contenido de post publicado y ruta consistente** (`blog/identidad-vs-cuenta.md`):
   permite verificación funcional en producción de listado + renderizado Markdown.
5. **Limpieza de páginas heredadas** (`blog/identidad-vs-cuenta/index.html`, `blog/assets/article.page.css`):
   eliminación de cabeceras meta obsoletas y ajuste de rutas/carga segura de recursos.
6. **UX/A11y global reforzada** (`assets/js/site.js`, `assets/css/site.css`):
   toggle de tema con `aria-pressed` y foco visible en iconos del footer.

### 9.3 Estado operativo tras corrección

- Blog dinámico funcional en raíz y subruta.
- Footer global e iconos SVG visibles con estilos consistentes.
- Modo oscuro por defecto y toggle operativo sin romper CSP.
- No se detectan residuos activos de `unsafe-inline` en páginas revisadas.

---

## 8. Relación con OWASP, CIS y NIST

### OWASP Top 10 (2021)

| OWASP | Relevancia | Control |
|-------|------------|---------|
| A03 — Injection (XSS) | Alta | Sanitizador MD, CSP sin unsafe-inline |
| A05 — Security Misconfiguration | Alta | CSP, cabeceras, SRI |
| A06 — Vulnerable Components | Media | SRI en marked.js, versión fijada |
| A08 — Software Integrity Failures | Media | SRI, versionado Git |
| A09 — Logging & Monitoring Failures | Media | Sin logging propio; pendiente CSP report-to |

### CIS Controls v8

| Control | Implementación |
|---------|----------------|
| CIS 2.2 — Inventario de software | Dependencias declaradas en HTML |
| CIS 4.1 — Configuración segura | CSP, cabeceras, modo HTTPS |
| CIS 16.1 — Seguridad de aplicaciones web | Sanitización, validación, honeypot |

### NIST 800-53

| Familia | Control | Implementación |
|---------|---------|----------------|
| SI | SI-10 (Validación de input) | Regex en parámetro ?post=; allowlist en sanitizador |
| SC | SC-28 (Protección en reposo) | Git como almacenamiento versionado |
| SC | SC-8 (Confidencialidad en tránsito) | TLS + upgrade-insecure-requests |
| CM | CM-7 (Funcionalidad mínima) | object-src none; Permissions-Policy mínima |

---

> Este análisis sigue un enfoque de trazabilidad de controles inspirado en marcos
> como SABSA, donde cada control técnico implementado es trazable a un riesgo de
> negocio identificado y a un objetivo de seguridad definido.
