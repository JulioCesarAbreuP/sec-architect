# THREAT MODEL — SEC_ARCHITECT

> Modelo de amenazas del sitio estático SEC_ARCHITECT.
> Metodología: STRIDE + MITRE ATT&CK for Web. Fecha: 2026-04-02.
> Revisado por: arquitecto de seguridad del proyecto.

---

## 1. Activos Protegidos

| ID | Activo | Descripción | Clasificación |
|----|--------|-------------|---------------|
| A01 | Contenido editorial | Posts Markdown, artículos técnicos, documentación | Público / Integridad crítica |
| A02 | Reputación del sitio | Imagen profesional del propietario | Alto valor subjetivo |
| A03 | Datos del formulario | Emails y mensajes enviados por contacto | Confidencial (tercero: Formspree) |
| A04 | Código fuente | HTML, JS, CSS del sitio | Público / Integridad crítica |
| A05 | Preferencia de tema | Dato en localStorage del usuario | Privacidad básica del usuario |
| A06 | Usuarios / visitantes | Lectores del sitio; posibles empleadores o clientes | Privacidad |
| A07 | Favicon y recursos SVG | Identidad visual del proyecto | Integridad de marca |

---

## 2. Actores de Amenaza

### 2.1 Externos

| Actor | Motivación | Capacidad | Probabilidad |
|-------|------------|-----------|--------------|
| Bot de scraping | Recopilar emails / datos | Baja-Media | Alta |
| Atacante automatizado | Explotar vulnerabilidades conocidas en JS | Media | Media |
| Competidor malicioso | Dañar reputación | Baja | Baja |
| Script kiddie | XSS oportunista | Baja | Media |
| Actor estatal | N/A para este perfil | Alta | Muy baja |

### 2.2 Internos / Colaboradores

| Actor | Motivación | Riesgo |
|-------|------------|--------|
| Colaborador con acceso al repo | Error en Markdown con HTML malicioso | Bajo (control editorial) |
| PR mal revisada | Introducción de dependencia externa no autorizada | Medio |

### 2.3 Automatizados

| Actor | Descripción |
|-------|-------------|
| Bots de formulario | Spam a través del formulario de contacto |
| Crawlers de CDN maliciosos | Intentos de cache poisoning en GitHub Pages |
| Scanners de vulnerabilidades | Identificación automática de endpoints JS, parámetros URL |

---

## 3. Superficies de Ataque

| Superficie | Vector | Exposición |
|------------|--------|------------|
| Parámetro `?post=` en URL | Inyección de ruta / path traversal | Externa |
| Formulario de contacto | Spam, abuso de Formspree | Externa |
| Archivos Markdown en `/blog/` | Inyección HTML/XSS en contenido editorial | Interna (repo) |
| CDN de marked.js (jsDelivr) | Supply chain attack | Tercero |
| Google Fonts CDN | Supply chain / privacidad de usuario | Tercero |
| SVG inline en footer | Script en SVG si el vector es manipulado | Interna (site.js) |
| GitHub Pages | Configuración incorrecta, CNAME takeover | Infraestructura |
| localStorage | Manipulación de preferencia de tema | Local (navegador) |
| `posts.json` | Manipulación del manifiesto de posts | Interna (repo) |

---

## 4. STRIDE Aplicado al Proyecto

### 4.1 Diagrama de Flujo de Datos (DFD)

```
[Usuario] ──HTTPS──► [GitHub Pages CDN] ──► [HTML/CSS/JS estáticos]
                                                     │
                          ┌──────────────────────────┴───────────────┐
                          │                                           │
                    [blog.js]                                  [markdown.js]
                    fetch posts.json                           fetch ?post=.md
                          │                                           │
                    [posts.json]                              [marked.js CDN]
                                                                      │
                                                              [sanitizador]
                                                                      │
                                                              [innerHTML DOM]

[index.html formulario] ──fetch──► [Formspree HTTPS]
```

### 4.2 Análisis STRIDE

| Amenaza STRIDE | Componente | Descripción | Mitigación |
|----------------|------------|-------------|------------|
| **S**poofing | GitHub Pages | Suplantación de dominio si DNS comprometido | HTTPS + HSTS (GitHub gestiona) |
| **S**poofing | CDN marked.js | Entrega de versión comprometida | SRI (integrity hash) |
| **T**ampering | posts.json | Modificación del manifiesto de posts | Control de acceso en GitHub (repo privado/PR review) |
| **T**ampering | Archivos .md | Inyección HTML en post editorial | Sanitizador allowlist en markdown.js |
| **T**ampering | localStorage | Manipulación del valor de tema | Sin impacto de seguridad real (solo preferencia visual) |
| **R**epudiation | Formulario | Sin log de envíos en cliente | Formspree conserva registro; sin control propio |
| **I**nformation Disclosure | Referrer | Fuga de URL de referencia a terceros | Referrer-Policy: strict-origin-when-cross-origin |
| **I**nformation Disclosure | Google Fonts | IP del usuario expuesta a Google | Aceptado; fuentes como fallback de sistema posible |
| **D**enial of Service | GitHub Pages | Saturación del CDN | Sin control propio; depende de SLA de GitHub |
| **D**enial of Service | Formspree | Flood de formulario | Honeypot + rate limit de Formspree |
| **E**levation of Privilege | DOM via XSS | Ejecución de JS en contexto del sitio | CSP sin unsafe-inline + sanitizador |
| **E**levation of Privilege | ?post= param | Path traversal para servir contenido ajeno | Regex validation + fetch de mismo origen |

---

## 5. MITRE ATT&CK Relevante (Web)

| Táctica | Técnica | ID | Aplicación en SEC_ARCHITECT | Estado |
|---------|---------|----|-----------------------------|----|
| Initial Access | Drive-by Compromise | T1189 | XSS via contenido MD comprometido | Mitigado (CSP + sanitizador) |
| Execution | Client-Side Script Execution | T1059.007 | JS malicioso via CDN comprometido | Mitigado (SRI) |
| Persistence | Browser Storage Modification | T1185 | Manipulación de localStorage | Sin impacto real |
| Collection | Data from Local System | T1005 | Exfiltración de datos del formulario | Mitigado (CSP connect-src) |
| Exfiltration | Exfiltration via Web Service | T1567 | Envío a endpoint externo no autorizado | Mitigado (CSP form-action) |
| Defense Evasion | Obfuscated Files or Information | T1027 | JS ofuscado en CDN comprometido | Mitigado (SRI) |
| Resource Development | Compromise Infrastructure | T1584 | GitHub Pages CNAME takeover | Mitigado por configuración de repo |
| Reconnaissance | Active Scanning | T1595 | Scanners automáticos de parámetros | CSP + validación input |

---

## 6. Análisis de Amenazas del Blog Dinámico

### 6.1 Escenario: Post con HTML Malicioso

**Precondición**: Un colaborador (o atacante con acceso al repo) introduce un archivo
`.md` con contenido HTML malicioso.

**Flujo de ataque**:
1. Post `.md` contiene `<script>alert(1)</script>` o evento inline `<img onerror="...">`
2. `markdown.js` convierte a HTML con marked.js
3. El sanitizador filtra `<script>` y eventos inline
4. El HTML resultante es inyectado via `innerHTML`

**Resultado con mitigaciones**: El script o evento es eliminado por el sanitizador.
La CSP sin `unsafe-inline` impide ejecución aunque llegue al DOM.

**Resultado sin mitigaciones**: XSS potencial en el navegador del visitante.

### 6.2 Escenario: Path Traversal

**Flujo**: `post.html?post=../../assets/js/site.js`

**Respuesta**:
- El regex `/^[\w\-\.]+\.md$/` rechaza: el parámetro no termina en `.md`.
- Si el regex falla, el fetch retorna 404 (archivo no existe en /blog/).
- El origen del fetch es el mismo origen, por lo que no hay SSRF hacia externos.

---

## 7. Análisis de Amenazas del Formulario

### 7.1 Escenario: Flood de Spam

**Flujo**: Bot automatizado envía POST masivo al formulario.
**Mitigaciones**: Honeypot `_hp_filter` detecta bots; Formspree aplica rate limiting.
**Riesgo residual**: Posible degradación del quota gratuito de Formspree ante flood sostenido.

### 7.2 Escenario: Inyección en Campos

**Flujo**: Usuario introduce HTML o scripts en campos de nombre/mensaje.
**Mitigaciones**: Formspree escapa el contenido en su plataforma; sin renderizado HTML en el sitio.
**Riesgo**: Bajo. Los datos nunca se muestran de vuelta en el sitio.

### 7.3 Escenario: Redirección de Formulario

**Flujo**: Ataque para modificar el `action` del formulario y redirigir datos a endpoint malicioso.
**Mitigaciones**: `form-action` en CSP limita el destino a `'self'` y `formspree.io`.

---

## 8. Análisis de Amenazas del Uso de SVG

### 8.1 SVG Inline en site.js

Los SVGs de LinkedIn y GitHub se generan programáticamente como strings en `site.js`.
Riesgos:
- Si `site.js` es comprometido (supply chain del repo), los SVGs podrían contener
  payloads. **Mitigación**: el repo es privado; las PRs deben ser revisadas.
- Los SVGs no contienen `<script>`, eventos ni `<use href>` externos.

### 8.2 SVG del Favicon

El favicon es un SVG estático servido desde `/assets/favicon.svg`.
Los navegadores modernos cargan favicons en un contexto separado y no ejecutan
scripts dentro de SVG favicon. **Riesgo: Muy bajo.**

### 8.3 SVG en Posts Markdown Futuros

Si futuros posts incluyen `<img src="...svg">` o SVG inline en Markdown:
- El sanitizador actual bloquea SVG inline (no está en la allowlist).
- Las imágenes SVG referenciadas via `<img>` son cargadas como imágenes (no ejecutan JS).
**Riesgo: Bajo con controles actuales.**

---

## 9. Riesgos Derivados de GitHub Pages

| Riesgo | Descripción | Severidad | Mitigación |
|--------|-------------|-----------|------------|
| CNAME Takeover | Si el repo es eliminado y el dominio apunta a Pages | Alto | Mantener el repo activo; documentar el dominio |
| Sin cabeceras HTTP custom | No se pueden configurar HSTS, COOP, CORP | Medio | Migrar a Front Door / Cloudflare |
| Exposición de historial Git | El repo público expone todos los commits | Bajo | Sin secretos en código; `.gitignore` revisado |
| Sin WAF nativo | GitHub Pages no filtra tráfico malicioso | Medio | No aplicable para sitio estático sin backend |
| Dependencia de SLA de GitHub | Sin control sobre disponibilidad | Bajo | Aceptado; evaluar mirror en Cloudflare Pages |
| Sin logs de acceso | No hay logs HTTP accesibles para el propietario | Bajo | Integrar analytics privacy-friendly si se necesita |

---

## 10. Mitigaciones Aplicadas y Futuras

### Aplicadas

| Mitigación | Componente | Estado |
|------------|------------|--------|
| CSP estricta sin unsafe-inline | Todas las páginas | ✅ Activo |
| SRI en marked.js | `post.html` | ✅ Activo |
| Sanitizador allowlist en MD | `markdown.js` | ✅ Activo |
| Validación regex de ?post= | `markdown.js` | ✅ Activo |
| Honeypot en formulario | `index.html` | ✅ Activo |
| CSP form-action limitado | `index.html` | ✅ Activo |
| rel noopener noreferrer | Todos los enlaces externos | ✅ Activo |
| Referrer-Policy | Todas las páginas | ✅ Activo |
| Sin inline scripts | Páginas principales | ✅ Activo |
| frame-ancestors none | CSP (meta; limitación GitHub Pages) | ⚠️ Parcialmente efectivo |

### Futuras (Recomendadas)

| Mitigación | Prioridad | Beneficio |
|------------|-----------|-----------|
| DOMPurify como sanitizador | Alta | Cobertura de vectores XSS probada |
| Azure Front Door / Cloudflare | Alta | Cabeceras HTTP reales, WAF, HSTS real |
| CSP report-to endpoint | Media | Monitorización de violaciones en producción |
| SRI en Google Fonts CSS | Media | Protección supply chain de estilos |
| Trusted Types en CSP | Media | Eliminación segura de innerHTML |
| Mirror en Cloudflare Pages | Baja | Resiliencia ante caída de GitHub Pages |
| CAPTCHA en formulario | Baja | Protección adicional anti-bot |

---

> El modelo se estructura siguiendo una lógica contextual → conceptual → lógica,
> alineada con marcos como SABSA: primero se identifican los activos y actores
> (contexto), luego los flujos de riesgo (conceptual) y finalmente los controles
> técnicos específicos (lógico-físico).
