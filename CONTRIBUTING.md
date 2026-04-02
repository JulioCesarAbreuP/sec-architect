# CONTRIBUTING — SEC_ARCHITECT

> Guía de contribución para colaboradores técnicos del proyecto SEC_ARCHITECT.
> Lee este documento antes de abrir cualquier Issue o Pull Request.

---

## 1. Reglas para Contribuir

- **Respeta la arquitectura existente**: cualquier cambio debe ser coherente con
  los principios definidos en `ARCHITECTURE.md` y `GOVERNANCE.md`.
- **Sin dependencias externas no revisadas**: no añadir CDNs, scripts ni fuentes
  sin aprobación explícita del mantenedor y sin SRI configurado.
- **Sin datos sensibles**: no commitear claves, tokens, emails ni datos personales.
- **Sin regresiones de seguridad**: cualquier PR que debilite la CSP, introduzca
  `eval`, `unsafe-inline` o `innerHTML` sin sanitización será rechazado.
- **Estilo consistente**: sigue el estilo visual existente (modo oscuro, paleta
  `#0A0A0A` / `#00AEEF`, tipografía de sistema).
- **Commits atómicos**: un commit = un cambio lógico. No mezcles refactorizaciones
  con correcciones de bugs en el mismo commit.

---

## 2. Estándares de Código

### HTML
- Usar HTML5 semántico (`<main>`, `<article>`, `<section>`, `<nav>`, `<footer>`).
- Todos los atributos con valores entre comillas dobles.
- Sin estilos inline (`style="..."`); usar clases CSS.
- Sin scripts inline (`<script>` embebido); usar archivos JS externos.
- Meta CSP al inicio del `<head>`, antes de cualquier recurso externo.
- Favicon referenciado con ruta relativa correcta por nivel de carpeta.

### CSS
- Variables CSS en `:root` para colores, tipografía y espaciados.
- Mobile-first: estilos base para móvil, media queries para desktop.
- Sin `!important` salvo en casos excepcionales justificados.
- Cada página tiene su CSS específico en `assets/css/[página].page.css`.
- Los estilos globales van en `assets/css/site.css`.

### JavaScript
- Sin `eval()`, `new Function()`, `setTimeout("string")`.
- Uso mínimo de `innerHTML`; preferir `textContent`, `createElement` y `appendChild`.
- Cuando se use `innerHTML`, el contenido **debe** pasar por el sanitizador antes.
- Módulos con responsabilidad única: `site.js` (global), `blog.js` (listado),
  `markdown.js` (renderizado), `index.js` (formulario home).
- Variables con `const`/`let`; sin `var`.
- Sin dependencias no declaradas en el HTML correspondiente.

### Markdown (posts)
- Front matter YAML al inicio (título, fecha, descripción).
- Sin HTML raw salvo que sea estrictamente necesario y haya sido revisado.
- Imágenes referenciadas con rutas relativas: `./assets/nombre.png`.
- Longitud de línea máxima recomendada: 100 caracteres.

---

## 3. Estilo de Commits

Seguimos la convención **Conventional Commits**:

```
<tipo>(<ámbito>): <descripción corta en imperativo>

[cuerpo opcional — explicación del por qué, no del qué]

[footer opcional — refs a issues, breaking changes]
```

### Tipos permitidos

| Tipo | Uso |
|------|-----|
| `feat` | Nueva funcionalidad |
| `fix` | Corrección de bug |
| `security` | Mejora o corrección de seguridad |
| `docs` | Cambios en documentación |
| `style` | Cambios de estilo (CSS, formato) sin lógica |
| `refactor` | Refactorización sin cambio de funcionalidad |
| `test` | Adición o modificación de pruebas |
| `chore` | Mantenimiento (deps, configuración) |

### Ejemplos

```
feat(blog): añadir filtro por tags en listado de posts
fix(markdown): corregir validación de parámetro ?post= con puntos en nombre
security(csp): añadir SRI a hoja de estilos de Google Fonts
docs(architecture): actualizar diagrama ASCII con flujo de Formspree
```

---

## 4. Reglas para Pull Requests

- **Una PR = un objetivo**: no mezclar seguridad, UX y contenido en la misma PR.
- **Descripción obligatoria**: explicar qué cambia, por qué y cómo probarlo.
- **Checklist de PR** (incluir en la descripción):
  - [ ] No introduce scripts inline ni estilos inline.
  - [ ] No debilita la CSP existente.
  - [ ] Si añade CDN externo: incluye `integrity` y `crossorigin`.
  - [ ] Si modifica `markdown.js`: el sanitizador sigue activo.
  - [ ] Si modifica `blog.js`: el ordenamiento por fecha funciona.
  - [ ] Probado con Live Server en local.
  - [ ] Sin errores en consola del navegador.
  - [ ] Lighthouse Performance ≥ 90 en local (si aplica).
- **Review obligatorio**: toda PR debe ser revisada antes del merge a `main`.
- **Sin force push a `main`**: usa ramas de feature y PRs.

---

## 5. Cómo Ejecutar el Proyecto Localmente

### Requisitos
- VS Code con extensión **Live Server** (ritwickdey.liveserver).
- O alternativamente: Node.js con `npx serve`.

### Con Live Server (recomendado)
1. Clona el repositorio: `git clone https://github.com/JulioCesarAbreuP/sec-architect.git`
2. Abre la carpeta en VS Code.
3. Haz clic derecho en `index.html` → "Open with Live Server".
4. El sitio abre en `http://127.0.0.1:5500`.

### Con npx serve
```bash
cd sec-architect
npx serve .
# Abre http://localhost:3000
```

### Notas importantes
- El sitio usa rutas relativas; **siempre** sirve desde la raíz del proyecto.
- No abras directamente los HTML como `file:///...`; el fetch de Markdown fallará
  por política CORS de `file://`.

---

## 6. Cómo Probar el Blog Dinámico

1. Crea un archivo `.md` en `/blog/`:
   ```markdown
   ---
   title: Mi Post de Prueba
   date: 2026-04-02
   description: Descripción breve.
   ---
   # Introducción
   Contenido del post en Markdown.
   ```
2. Añade el nombre del archivo a `blog/posts.json`:
   ```json
   ["mi-post-de-prueba.md"]
   ```
3. Abre `http://127.0.0.1:5500/blog.html` — el post debe aparecer en el listado.
4. Haz clic en el enlace — debe abrir `post.html?post=mi-post-de-prueba.md`
   y renderizar el contenido correctamente.
5. Verifica en la consola del navegador que no hay errores.

---

## 7. Cómo Validar la CSP

### Herramienta 1: CSP Evaluator (Google)
1. Abre https://csp-evaluator.withgoogle.com/
2. Pega la CSP actual de cualquier página del proyecto.
3. Verifica que no hay hallazgos de severidad alta o crítica.

### Herramienta 2: Consola del navegador
1. Abre el sitio con Live Server.
2. DevTools → pestaña Console.
3. Navega por el sitio e interactúa con el blog y el formulario.
4. Cualquier violación de CSP aparece como error rojo en consola.

### Herramienta 3: Report URI (futuro)
Cuando esté configurado, las violaciones se reportarán automáticamente
al endpoint de monitorización.

---

## 8. Cómo Ejecutar Pruebas de Lighthouse

### Desde Chrome DevTools
1. Abre el sitio con Live Server.
2. DevTools → pestaña Lighthouse.
3. Selecciona: Performance, Accessibility, Best Practices, SEO.
4. Modo: Navigation. Dispositivo: Mobile y Desktop.
5. Ejecuta y guarda el informe HTML.

### Desde CLI (Lighthouse CI)
```bash
npm install -g @lhci/cli
lhci autorun --collect.url=http://127.0.0.1:5500
```

### Umbrales objetivo

| Categoría | Umbral mínimo |
|-----------|---------------|
| Performance | ≥ 90 |
| Accessibility | ≥ 90 |
| Best Practices | ≥ 90 |
| SEO | ≥ 85 |

---

## 9. Cómo Reportar Problemas de Seguridad

**No abras un Issue público para vulnerabilidades críticas.**

Para vulnerabilidades de severidad media o alta:
1. Contacta directamente al mantenedor via LinkedIn:
   https://www.linkedin.com/in/juliocesarabreup/
2. Incluye en el mensaje:
   - Vector de ataque detallado.
   - Pasos para reproducir.
   - Evidencia (capturas, logs).
   - Impacto estimado.
   - Mitigación sugerida (referencia a OWASP, NIST o CIS si aplica).

Para vulnerabilidades de severidad baja:
- Abre un Issue con la etiqueta `[SECURITY]`.
- Describe el hallazgo sin publicar exploits funcionales.

Consulta `SECURITY.md` para el proceso completo de divulgación responsable.

---

> Las contribuciones deben mantener coherencia con la arquitectura por capas
> inspirada en SABSA: cada cambio propuesto debe ser trazable a un objetivo de
> seguridad, un principio de diseño o una mejora de resiliencia definida en este proyecto.
