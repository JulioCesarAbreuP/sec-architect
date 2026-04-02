# SECURITY REVIEW - sec-architect

## Alcance revisado
- HTML: `index.html`, `blog.html`, `post.html`, `blog/index.html`, `blog/identidad-vs-cuenta/index.html`.
- JS: `index.js`, `blog.js`, `markdown.js`, `assets/js/site.js`.
- Activos nuevos: `assets/icons/*.svg`, `assets/css/site.css`.
- Configuración CI/CD: no se detectaron workflows en `.github/workflows`.

## Riesgos detectados (estado actual)

### Mitigados
1. XSS por scripts inline.
   - Solucion aplicada: se eliminaron scripts inline en páginas auditadas y se centralizó en `assets/js/site.js`.

2. Riesgo de inyección al renderizar Markdown.
   - Solucion aplicada: `markdown.js` ahora aplica una sanitización por allowlist de etiquetas/atributos y filtra URLs peligrosas antes de insertar HTML.

3. Dependencia CDN sin control de integridad.
   - Solucion aplicada: `post.html` usa `integrity` + `crossorigin` para Marked y el script está fijado a versión exacta.

4. Riesgo tabnabbing en enlaces externos.
   - Solucion aplicada: enlaces externos generados y renderizados con `rel="noopener noreferrer"`.

5. Superficie de ataque por lógica de tema dispersa.
   - Solucion aplicada: tema oscuro por defecto + control persistente con `localStorage` en un único módulo (`assets/js/site.js`).

### Riesgo residual
1. Uso de `innerHTML` en el pipeline Markdown (`template.innerHTML` para parseo y `postContentElement.innerHTML` para render final).
   - Estado: aceptado y compensado con sanitizador estricto + CSP + validación de parámetros.
   - Recomendacion futura: migrar a sanitizador dedicado (por ejemplo DOMPurify autoalojado) con perfil de política explícita.

2. Uso de `style-src 'unsafe-inline'` en CSP por estilos embebidos existentes.
   - Estado: requerido para no romper el diseño actual.
   - Recomendacion futura: extraer CSS embebido a archivos externos para retirar `unsafe-inline`.

## Soluciones aplicadas
1. Hardening de CSP por página con `object-src 'none'`, `base-uri 'none'`, `frame-ancestors 'none'`, `block-all-mixed-content` y `upgrade-insecure-requests`.
2. Eliminación de scripts inline y consolidación de lógica global (tema + footer) en `assets/js/site.js`.
3. Sanitización reforzada en `markdown.js`:
   - allowlist de etiquetas,
   - allowlist de atributos por etiqueta,
   - bloqueo de URLs no seguras (`javascript:` y esquemas no permitidos),
   - control de enlaces externos.
4. Reducción de uso de `innerHTML` en renderizado de lista (`blog.js` usa limpieza con `textContent`).
5. Footer global reutilizable con iconos inline SVG de LinkedIn y GitHub, sin imágenes externas.

## Recomendaciones futuras
1. Autoalojar `marked.min.js` para eliminar dependencia runtime de CDN.
2. Completar extracción de CSS inline para adoptar `style-src 'self'` sin `unsafe-inline`.
3. Agregar pipeline CI de seguridad (SAST + escaneo de dependencias + revisión de headers).
4. Mantener `blog/posts.json` como inventario explícito de posts para evitar depender de listado de directorio en hosting estático.

## Cabeceras recomendadas para reverse proxy (Front Door / App Gateway)
GitHub Pages no permite configurar todas las cabeceras HTTP, pero el sitio queda preparado para migrar con esta plantilla:

```http
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=(), payment=(), usb=()
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
Content-Security-Policy: default-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'
```

## Checklist operativo
- [x] Scripts inline eliminados en páginas auditadas.
- [x] Modo oscuro por defecto y persistencia de preferencia del usuario.
- [x] Footer global reutilizable con iconos oficiales inline.
- [x] Validación + sanitización del flujo Markdown dinámico.
- [x] Integridad agregada a recursos CDN activos (Marked y fuente CSS externa usada).
- [ ] Migrar CSS inline a archivos para retirar `unsafe-inline` en `style-src`.
