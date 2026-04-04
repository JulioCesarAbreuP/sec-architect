# TESTING — SEC_ARCHITECT

> Estrategia de pruebas técnicas del sitio estático SEC_ARCHITECT.
> Cubre seguridad, rendimiento, accesibilidad, compatibilidad y resiliencia.
> Última actualización: 2026-04-04.

---

## 1. Pruebas de Lighthouse

Lighthouse es la herramienta principal de auditoría de calidad del sitio.

### 1.1 Configuración de Prueba

| Parámetro | Valor |
|-----------|-------|
| Herramienta | Chrome DevTools → Lighthouse / lhci CLI |
| URL de prueba | `http://127.0.0.1:5500` (local) y URL de GitHub Pages (producción) |
| Modos | Mobile (throttling 4G) + Desktop |
| Categorías | Performance, Accessibility, Best Practices, SEO |

### 1.2 Umbrales Objetivo

| Categoría | Local | Producción |
|-----------|-------|------------|
| Performance | ≥ 85 | ≥ 90 |
| Accessibility | ≥ 90 | ≥ 95 |
| Best Practices | ≥ 90 | ≥ 95 |
| SEO | ≥ 85 | ≥ 90 |

### 1.3 Métricas Web Vitals

| Métrica | Objetivo |
|---------|----------|
| LCP (Largest Contentful Paint) | < 2.5s |
| FID / INP (Interaction to Next Paint) | < 200ms |
| CLS (Cumulative Layout Shift) | < 0.1 |
| TTFB (Time to First Byte) | < 600ms |
| FCP (First Contentful Paint) | < 1.8s |

### 1.4 Ejecución

```bash
# CLI
npm install -g @lhci/cli
lhci autorun --collect.url=http://127.0.0.1:5500/index.html
lhci autorun --collect.url=http://127.0.0.1:5500/blog.html
lhci autorun --collect.url="http://127.0.0.1:5500/post.html?post=test.md"
```

## 1.5 Pruebas Smoke del Enterprise Command Center

Existe un smoke test sin dependencias externas para validar el flujo modular nuevo:

```bash
npm run test:enterprise
```

Cobertura actual:

- Parsing y validacion de politicas JSON.
- Deteccion MITRE para Conditional Access y objetos Azure.
- Generacion de remediacion Bicep y Terraform.
- Decodificacion JWT y validacion SC-300 con MFA y expiracion.

## 1.6 Auditoria WCAG 2.1 AA — Enterprise Command Center

Objetivo: mantener densidad de informacion del panel sin degradar operatividad para teclado y lector de pantalla.

Checklist minimo en `tools/enterprise-command-center.html`:

- [ ] Navegacion por teclado completa (Tab/Shift+Tab) sin bloqueo.
- [ ] `Skip link` funcional hacia `#enterpriseRoot`.
- [ ] Foco visible en botones, links, inputs, selects, textareas y paneles navegables.
- [ ] `SOC Night Mode` con `aria-pressed` y etiqueta dinamica coherente.
- [ ] Estados de comando (`HEALTHY/DEGRADED/CRITICAL`) anunciables por AT (`role=status`, `aria-live`).
- [ ] Consola operativa con semantica de log (`role=log`, `aria-live`).
- [ ] Campos criticos con nombre accesible (label visible o programatico).
- [ ] Salidas criticas (`pre`) navegables y anunciables (`tabindex`, `aria-live`).
- [ ] Respeto a `prefers-reduced-motion` para animaciones criticas.

---

## 2. Pruebas de CSP

### 2.1 Validación Estática

**Herramienta**: CSP Evaluator — https://csp-evaluator.withgoogle.com/

**Proceso**:
1. Copiar la CSP completa de cada página HTML.
2. Pegar en CSP Evaluator.
3. Verificar que no hay hallazgos de severidad HIGH o CRITICAL.
4. Severidad MEDIUM: evaluar y documentar si se acepta el riesgo.

**CSPs a validar**:
- `index.html` — política base completa.
- `post.html` — política con `cdn.jsdelivr.net` en `script-src`.
- `blog.html` — política base.
- `blog/index.html` — verificar coherencia.

### 2.2 Validación Dinámica (consola del navegador)

1. Abrir el sitio con Live Server.
2. DevTools → Console.
3. Navegar por todas las páginas e interactuar con:
   - Toggle de tema.
   - Listado de posts.
   - Render de un post.
   - Envío del formulario (opcional: test con datos ficticios).
4. **Resultado esperado**: cero errores de violación CSP en consola.

### 2.3 Prueba de Bypass Intencional

Intentar manualmente los siguientes vectores para confirmar que CSP los bloquea:

```javascript
// En consola del navegador — debe ser bloqueado por CSP:
eval("alert(1)")
document.write("<script>alert(1)<\/script>")
```

**Resultado esperado**: error de CSP en consola; sin ejecución.

### 2.4 Verificación de Directivas de Reporte CSP

- Ejecutar `scripts/security-policy-check.ps1` sobre el repositorio.
- Confirmar que no existan hallazgos de `Missing report-uri directive` ni
  `Missing report-to directive` en páginas HTML con CSP.

### 2.5 Verificación de Scripts Inline

- Ejecutar `scripts/security-policy-check.ps1`.
- Confirmar que no existan hallazgos `Inline <script> tag found` en páginas de
  blog y artículos.
- Validar que cualquier excepción legacy esté declarada explícitamente en el
  script de política.

### 2.6 Verificación de Dependencia Externa marked.js (SRI)

- Ejecutar `scripts/security-policy-check.ps1`.
- Confirmar que no existan hallazgos `[SRI] marked.js CDN script missing ...`.
- Verificar que el script de `marked.js` mantiene:
  - `integrity` válido,
  - `crossorigin="anonymous"`,
  - `referrerpolicy="no-referrer"`,
  - versión fijada a semver exacto (`marked@x.y.z/marked.min.js`).
- Registrar revisión trimestral del hash SRI como evidencia de hardening.

---

## 3. Pruebas de Sanitización del Blog

### 3.1 Posts de Prueba con Payloads XSS

Crear un archivo `/blog/test-xss.md` con contenido:

```markdown
---
title: Test XSS
date: 2026-04-02
---
# Test de Sanitización

<script>alert('XSS')</script>

<img src="x" onerror="alert('XSS')">

<a href="javascript:alert('XSS')">Click</a>

<iframe src="https://evil.com"></iframe>
```

**Añadir a `posts.json`**: `"test-xss.md"`

**Resultado esperado**:
- `<script>` eliminado; no aparece en el DOM.
- `<img onerror>` eliminado o atributo `onerror` removido por DOMPurify.
- `href="javascript:"` reemplazado por `href="#"` o eliminado.
- `<iframe>` eliminado completamente.
- `<svg>` y `<math>` eliminados completamente por `FORBID_TAGS`.

**Eliminar el archivo de prueba** después de confirmar el resultado.

### 3.2 Prueba de Path Traversal

Visitar las siguientes URLs y confirmar que no se carga contenido no previsto:

```
post.html?post=../../index.html
post.html?post=../posts.json
post.html?post=<script>
post.html?post=test.exe
post.html?post=test
```

**Resultado esperado**: mensaje de error controlado; sin carga de contenido ajeno.

---

## 4. Pruebas del Formulario

### 4.1 Validación Client-Side

| Prueba | Acción | Resultado esperado |
|--------|--------|-------------------|
| Campo nombre vacío | Enviar sin nombre | Mensaje de error visible; sin envío |
| Email inválido | Introducir "texto" en email | Mensaje de formato incorrecto |
| Todos los campos válidos | Rellenar correctamente | Envío a Formspree; mensaje de éxito |
| Honeypot activado | Rellenar `_hp_filter` via JS | Formspree descarta el envío |

### 4.2 Prueba de CSP en Formulario

1. Modificar temporalmente el `action` del formulario a `https://evil.com`.
2. Resultado esperado: violación de CSP `form-action`; el envío es bloqueado.

### 4.3 Prueba de Accesibilidad del Formulario

- Navegar el formulario solo con teclado (Tab, Enter, Space).
- Verificar que todos los campos tienen `<label>` asociado.
- Screen reader: usar NVDA o VoiceOver para confirmar que los errores son anunciados.

---

## 5. Pruebas de Accesibilidad

### 5.1 Herramientas

| Herramienta | Uso |
|-------------|-----|
| axe DevTools (extensión) | Análisis automático de accesibilidad WCAG 2.1 |
| Lighthouse (categoría Accessibility) | Puntuación general |
| NVDA / VoiceOver | Verificación manual con screen reader |
| Keyboard navigation | Tab, Enter, Escape; sin trampa de teclado |

### 5.2 Verificaciones Obligatorias

- [ ] Ratio de contraste de texto ≥ 4.5:1 (modo oscuro y claro).
- [ ] Todos los iconos SVG tienen `aria-label` o `aria-hidden="true"`.
- [ ] Toggle de tema tiene `aria-label="Cambiar tema"`.
- [ ] Imágenes tienen atributo `alt` descriptivo.
- [ ] Encabezados en orden jerárquico (h1 → h2 → h3, sin saltos).
- [ ] Sin contenido dependiente solo de color para comunicar información.
- [ ] Foco visible en todos los elementos interactivos.

---

## 6. Pruebas de Carga (Simuladas)

Dado que el sitio es estático, las pruebas de carga se orientan a medir
la respuesta del CDN de GitHub Pages ante múltiples requests concurrentes.

### 6.1 Herramientas

| Herramienta | Tipo |
|-------------|------|
| k6 | Load testing scriptable |
| Apache Bench (`ab`) | Test rápido de endpoints |
| WebPageTest | Multi-location, multi-step |

### 6.2 Escenario Básico con k6

```javascript
import http from 'k6/http';
import { sleep } from 'k6';

export let options = {
  vus: 50,
  duration: '30s',
};

export default function () {
  http.get('https://[usuario].github.io/sec-architect/');
  http.get('https://[usuario].github.io/sec-architect/blog.html');
  sleep(1);
}
```

**Métricas a observar**: `http_req_duration` (p95 < 2000ms), `http_req_failed` (< 1%).

---

## 7. Pruebas de Resiliencia del Sitio Estático

### 7.1 Escenarios de Fallo

| Escenario | Cómo probar | Resultado esperado |
|-----------|-------------|-------------------|
| marked.js CDN no disponible | Bloquear `cdn.jsdelivr.net` en DevTools Network | Mensaje de error en post; sin crash |
| Google Fonts no disponible | Bloquear `fonts.googleapis.com` | Fuente del sistema como fallback |
| Formspree no disponible | Bloquear `formspree.io` | Mensaje de error en formulario |
| posts.json no encontrado | Renombrar temporalmente | Mensaje de lista vacía; sin crash |
| JS deshabilitado | DevTools → Settings → Disable JavaScript | Footer estático visible; contenido principal legible |

### 7.2 Verificación de Fallbacks

- Footer: verificar que el HTML estático del footer aparece aunque `site.js` no cargue.
- Toggle de tema: verificar que la página carga en modo oscuro aunque no haya JS.
- Blog: verificar que `blog.html` muestra mensaje apropiado si `posts.json` falla.

---

## 8. Pruebas de Compatibilidad de Navegadores

### 8.1 Navegadores a Validar

| Navegador | Versión mínima | Plataforma |
|-----------|----------------|------------|
| Chrome | 110+ | Windows, macOS, Android |
| Firefox | 110+ | Windows, macOS |
| Safari | 16+ | macOS, iOS |
| Edge | 110+ | Windows |
| Samsung Internet | 20+ | Android |

### 8.2 Checklist de Compatibilidad

- [ ] Layout correcto en todos los navegadores objetivo.

---

## 9. Prueba de Contrato AI Trace Schema

### 9.1 Objetivo

Validar en CI que el esquema de exportacion de trazas IA mantiene contrato estable y campos obligatorios para auditoria.

### 9.2 Script

```powershell
./scripts/validate-ai-trace-schema.ps1
./scripts/validate-ai-trace-schema.ps1 -FilePath tests/fixtures/ai-trace-export.invalid.json -Expect invalid
```

### 9.3 Fixture de validacion

- Archivo base: `tests/fixtures/ai-trace-export.valid.json`
- Fixture negativo: `tests/fixtures/ai-trace-export.invalid.json`
- Contrato de referencia: `docs/ai-trace-schema.md`

### 9.4 Resultado esperado

- Salida `AI trace schema validation passed.`
- Exit code `0`.
- [ ] Toggle de tema funciona (localStorage disponible).
- [ ] Footer con iconos SVG visible.
- [ ] Blog dinámico carga correctamente (fetch + JSON parsing).
- [ ] Post individual renderiza Markdown correctamente.
- [ ] Formulario funciona (fetch API disponible en todos).
- [ ] Variables CSS (`var(--bg)`) soportadas.

### 8.3 Herramientas

- BrowserStack (si se dispone de cuenta).
- LambdaTest — nivel gratuito disponible.
- Can I Use — verificación de características específicas: https://caniuse.com/

---

## 9. Pruebas del Modo Oscuro y Claro

### 9.1 Prueba de Persistencia

1. Visitar `index.html` → confirmar modo oscuro por defecto.
2. Pulsar el toggle → confirmar cambio a modo claro.
3. Recargar la página → confirmar que el modo claro persiste (localStorage).
4. Abrir `blog.html` → confirmar que hereda la preferencia.
5. Abrir `post.html` → confirmar coherencia del tema.

### 9.2 Prueba de Variables CSS

1. DevTools → Elements → inspeccionar `<html>`.
2. En modo oscuro: `--bg` debe ser `#0a0a0a`, `--fg` debe ser `#e8e8e8`.
3. En modo claro: `--bg` debe ser `#f8f8f8`, `--fg` debe ser `#111`.

### 9.3 Prueba de Contraste

| Modo | Texto / Fondo | Ratio objetivo |
|------|---------------|----------------|
| Oscuro | `#e8e8e8` / `#0a0a0a` | ≥ 4.5:1 |
| Claro | `#111` / `#f8f8f8` | ≥ 4.5:1 |
| Acento oscuro | `#00aeef` / `#0a0a0a` | ≥ 3:1 (elementos grandes) |
| Acento claro | `#0077b5` / `#f8f8f8` | ≥ 4.5:1 |

Usar https://webaim.org/resources/contrastchecker/ para verificar.

### 9.4 Prueba de prefers-color-scheme (futuro)

Cuando se implemente detección automática de preferencia del sistema:
- DevTools → Rendering → Emulate CSS media feature: `prefers-color-scheme: dark/light`.
- Confirmar que el tema responde correctamente sin necesidad del toggle.

---

> El enfoque de pruebas sigue una lógica de aseguramiento continuo alineada con
> marcos como SABSA: desde la validación del contexto operativo (compatibilidad,
> resiliencia) hasta la verificación técnica de los controles de seguridad
> implementados en cada capa del sistema.
