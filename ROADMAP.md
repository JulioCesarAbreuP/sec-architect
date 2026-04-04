# ROADMAP — SEC_ARCHITECT

> Hoja de ruta técnica del proyecto. Organizada por horizontes temporales.
> Orientada a arquitectura de seguridad, UX/UI y evolución de infraestructura.

---

## 1. Objetivos a Corto Plazo (0–3 meses)

### Seguridad
- [x] Integrar DOMPurify en `markdown.js` como sanitizador de producción.
- [x] Activar CSP `report-to` con endpoint de reporte (Report URI o equivalente).
- [x] Mover scripts inline restantes en `blog/index.html` y artículos a JS externos.
- [x] Añadir SRI a hojas de estilo de Google Fonts.
- [x] Revisar y actualizar el hash SRI de marked.js trimestralmente.

### UX/UI
- [ ] Validar accesibilidad WCAG 2.1 AA con axe o Lighthouse.
- [ ] Añadir `aria-label` a todos los iconos SVG del footer y toggle.
- [ ] Optimizar tiempo de carga (LCP < 2.5s) en Lighthouse.
- [ ] Añadir animaciones de entrada suaves en las tarjetas de posts.

### Blog
- [ ] Publicar al menos 3 posts técnicos iniciales.
- [ ] Implementar paginación básica en el listado de posts.
- [ ] Añadir campo `tags` al front matter de los posts.
- [ ] Mostrar tags como filtros visuales en `blog.html`.

---

## 2. Objetivos a Medio Plazo (3–9 meses)

### Seguridad
- [ ] Desplegar detrás de Azure Front Door o Cloudflare para habilitar
      cabeceras HTTP reales (HSTS, COOP, CORP, frame-ancestors efectivo).
- [ ] Implementar `require-trusted-types-for 'script'` en CSP.
- [ ] Activar WAF básico en Front Door para filtrar tráfico automatizado.
- [ ] Realizar auditoría completa con OWASP ZAP o Nikto.
- [ ] Integrar Dependabot o Renovate para alertas de dependencias.

### UX/UI
- [ ] Añadir barra de progreso de lectura en posts individuales.
- [ ] Implementar búsqueda de posts client-side (Fuse.js o similar).
- [ ] Añadir modo de impresión optimizado para artículos.
- [ ] Responsive design completo para dispositivos <375px.

### Blog
- [ ] Automatizar la actualización de `posts.json` con un script de Node o Python.
- [ ] Soporte para categorías y posts relacionados.
- [ ] Añadir tiempo estimado de lectura a cada post.
- [ ] Soporte para código con resaltado de sintaxis (Prism.js o highlight.js con SRI).

---

## 3. Objetivos a Largo Plazo (9+ meses)

### Seguridad
- [ ] Obtener puntuación A+ en securityheaders.com.
- [ ] Implementar Certificate Transparency monitoring.
- [ ] Explorar firma GPG de commits como práctica de integridad editorial.
- [ ] Diagramar y documentar el modelo de amenazas anualmente.

### UX/UI
- [ ] Internacionalización (i18n) en inglés/español.
- [ ] Dark/light/system theme con detección de `prefers-color-scheme`.
- [ ] Tipografía variable para mayor flexibilidad de diseño.

### Infraestructura
- [ ] Migrar a CDN global multi-región con failover automático.
- [ ] Evaluar migración a Cloudflare Pages como alternativa a GitHub Pages
      por su soporte nativo de headers y Workers.
- [ ] Implementar mirror de contenido en IPFS o Arweave como respaldo inmutable.

---

## 4. Mejoras Planificadas en Seguridad

| Mejora | Prioridad | Complejidad | Impacto |
|--------|-----------|-------------|---------|
| DOMPurify | Alta | Baja | Muy alto |
| CSP report-to | Alta | Media | Alto |
| Front Door / Cloudflare | Alta | Alta | Muy alto |
| SRI en Google Fonts | Media | Baja | Medio |
| Trusted Types | Media | Alta | Alto |
| WAF básico | Media | Media | Alto |
| Auditoría OWASP ZAP | Media | Media | Alto |
| Dependabot | Baja | Baja | Medio |

---

## 5. Mejoras Planificadas en UX/UI

| Mejora | Estado | Notas |
|--------|--------|-------|
| Accesibilidad WCAG 2.1 AA | Pendiente | Revisión con axe |
| Búsqueda de posts | Pendiente | Fuse.js sin servidor |
| Paginación del blog | Pendiente | Client-side simple |
| Filtro por tags | Pendiente | DOM dinámico |
| Barra de progreso de lectura | Pendiente | JS nativo con IntersectionObserver |
| Resaltado de sintaxis | Pendiente | Prism.js con SRI |

---

## 6. Evolución del Blog Dinámico

**Fase actual**: Manifiesto `posts.json` manual + renderizador Markdown client-side.

**Fase 1**: Script de generación automática de `posts.json` a partir de archivos `.md`.

**Fase 2**: Añadir metadatos (tags, categorías, tiempo de lectura) al manifiesto.

**Fase 3**: Búsqueda client-side sobre el manifiesto JSON.

**Fase 4** (largo plazo): Evaluar generador de sitios estáticos (11ty, Hugo)
si el volumen de posts supera los 50 artículos y la complejidad de gestión crece.

---

## 7. Integración Futura con Azure Front Door

```
Usuario
  │
  ▼
Azure Front Door (WAF, TLS, cabeceras HTTP, caché global)
  │
  ├─► Reglas WAF: bloqueo de scanners, rate limiting, geofencing
  ├─► Cabeceras HTTP custom: HSTS, COOP, CORP, CSP real
  ├─► Caché de assets estáticos con TTL largo
  └─► Failover a origen secundario (Cloudflare Pages)
  │
  ▼
GitHub Pages (origen primario)
```

Beneficios sobre GitHub Pages puro:
- Cabeceras HTTP reales (no meta tags).
- WAF gestionado con reglas OWASP.
- Analytics de tráfico sin cookies.
- Aceleración global con PoPs de Azure.

---

## 8. Migración Futura a CDN Global

| Fase | Acción |
|------|--------|
| Evaluación | Comparar GitHub Pages vs Cloudflare Pages vs Netlify vs Azure Static Web Apps |
| Piloto | Mirror en Cloudflare Pages con headers custom habilitados |
| Migración | DNS cutover con TTL reducido; monitorización 48h |
| Post-migración | Validar CSP real, HSTS preloading, performance en regiones objetivo |

---

## 9. Automatización de Pruebas de Seguridad

- **CI/CD con GitHub Actions**: Lighthouse CI en cada PR para validar no regresión.
- **Escaneo de links rotos**: lychee o broken-link-checker en pipeline.
- **Validación de CSP**: CSP Evaluator en pipeline vía API.
- **Escaneo OWASP ZAP**: modo AJAX Spider en staging antes de producción.
- **Renovate/Dependabot**: alertas semanales de dependencias desactualizadas.

---

## 10. Expansión del Contenido Técnico

**Áreas de contenido planificadas**:
- Arquitectura Zero Trust en entornos Azure.
- Comparativas de marcos de seguridad (NIST, CIS, ISO 27001, SABSA).
- Guías de hardening para GitHub Pages y Azure Static Web Apps.
- Posts sobre certificaciones AZ-305, SC-300 y AZ-104.
- Casos de estudio de modelos de amenazas en proyectos reales.
- Tutoriales de implementación de CSP en distintos frameworks.

---

> El roadmap sigue una visión arquitectónica basada en capas, coherente con marcos
> como SABSA: desde los objetivos de negocio y seguridad (capa contextual) hasta
> las acciones técnicas específicas por componente (capa física).
