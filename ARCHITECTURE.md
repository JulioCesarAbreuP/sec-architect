# ARCHITECTURE — SEC_ARCHITECT

> Documento de arquitectura técnica del sitio. Versión controlada en repositorio.
> Audiencia: arquitectos senior, colaboradores técnicos, revisores de seguridad.

---

## 1. Propósito del Proyecto

SEC_ARCHITECT es un sitio estático de arquitectura personal orientado a documentar,
demostrar y ejercitar competencias en seguridad de sistemas, arquitectura de soluciones
y principios de diseño resiliente. Sirve simultáneamente como:

- **Portafolio técnico** para certificaciones AZ-305, SC-300 y AZ-104 de Microsoft.
- **Laboratorio de hardening** de CSP, cabeceras HTTP y controles OWASP sobre infraestructura sin servidor.
- **Plataforma editorial** para publicación de artículos técnicos en formato Markdown.
- **Referencia de implementación** de principios Zero Trust en un entorno estático distribuido (GitHub Pages).

El sitio opera bajo la premisa de que incluso un sitio estático puede —y debe— diseñarse
con controles de seguridad comparables a los de aplicaciones de producción empresarial.

---

## 2. Filosofía de Diseño

### 2.1 Resiliencia Operativa

El sitio no depende de bases de datos, servidores de aplicación ni runtimes externos.
Todo el contenido es generado en tiempo de carga del navegador a partir de archivos
estáticos versionados en Git. Esta arquitectura elimina superficies de ataque del lado
del servidor (SQL injection, RCE, SSRF) por ausencia de backend.

Principios aplicados:
- **Fail-safe defaults**: modo oscuro por defecto, CSP restrictiva por defecto.
- **Degradación elegante**: el footer y el toggle de tema son inyectados por JS,
  pero se provee fallback HTML estático para garantizar visibilidad sin JS.
- **Inmutabilidad del contenido**: los posts Markdown son archivos versionados,
  no registros mutables en base de datos.

### 2.2 Zero Trust

Zero Trust se aplica no solo como modelo de gestión de identidad, sino como paradigma
de diseño de cada componente:

- **No confiar en el contenido Markdown**: todo HTML producido por marked.js
  pasa por un sanitizador de allowlist estricta antes de ser inyectado en el DOM.
- **No confiar en recursos externos**: las fuentes tipográficas y librerías CDN
  incluyen atributo `integrity` (SRI) y `crossorigin="anonymous"`.
- **No confiar en el parámetro URL**: el parámetro `?post=` es validado contra
  una expresión regular estricta antes de ser utilizado para fetch de contenido.
- **No confiar en formularios**: el formulario de contacto delega en Formspree
  y está acotado por CSP (`form-action`, `connect-src`) y por honeypot.

### 2.3 Defensa en Profundidad

El modelo aplica controles en múltiples capas independientes:

| Capa | Control |
|------|---------|
| Transporte | HTTPS + `upgrade-insecure-requests` + GitHub Pages TLS |
| Contenido | CSP estricta + SRI en CDN |
| DOM | Sanitización de Markdown + restricción de innerHTML |
| Enlace externo | `rel="noopener noreferrer"` en todos los targets externos |
| Formulario | CSP + honeypot + validación client-side |
| Almacenamiento | `localStorage` únicamente para preferencia de tema (sin datos sensibles) |

---

## 3. Estructura de Carpetas

```
sec-architect/
├── index.html                  # Home / portada principal
├── blog.html                   # Listado dinámico de posts
├── post.html                   # Renderizador de post individual
├── index.js                    # Lógica específica de la home (formulario, animaciones)
├── blog.js                     # Generación dinámica del listado de posts
├── markdown.js                 # Carga, parseo y sanitización de Markdown
├── assets/
│   ├── css/
│   │   ├── site.css            # Estilos globales: tema, footer, toggle, iconos
│   │   ├── index.page.css      # Estilos específicos de la home
│   │   ├── blog.page.css       # Estilos específicos del listado
│   │   └── post.page.css       # Estilos específicos del post individual
│   ├── icons/
│   │   ├── linkedin.svg        # Icono oficial SVG de LinkedIn
│   │   └── github.svg          # Icono oficial SVG de GitHub
│   ├── js/
│   │   └── site.js             # JS global: toggle de tema, footer, iconos
│   └── favicon.svg             # Favicon SVG del proyecto (compás minimalista)
├── blog/
│   ├── posts.json              # Manifiesto de posts para despliegue estático puro
│   ├── assets/
│   │   └── article.page.css    # Estilos de artículos del blog interno
│   └── [slug]/
│       ├── index.html          # Post pre-renderizado (HTML estático)
│       └── img/                # Imágenes del post
├── ARCHITECTURE.md             # Este documento
├── SECURITY.md                 # Política de seguridad pública
├── SECURITY_REVIEW.md          # Análisis técnico de seguridad
├── THREAT_MODEL.md             # Modelo de amenazas
├── ROADMAP.md                  # Hoja de ruta del proyecto
├── CONTRIBUTING.md             # Guía de contribución
├── TESTING.md                  # Estrategia de pruebas
├── GOVERNANCE.md               # Marco de gobernanza
├── DIAGRAMS.md                 # Diagramas de arquitectura
├── CHANGELOG.md                # Registro de cambios (Keep a Changelog)
└── GLOSARIO.md                 # Glosario técnico del proyecto
```

---

## 4. Flujo de Datos del Sitio Estático

```
Usuario
  │
  ▼
GitHub Pages CDN (TLS 1.3, HTTPS)
  │
  ▼
Navegador (carga HTML, CSS, JS desde origen único)
  │
  ├─► site.js      → inyecta toggle de tema + footer global en el DOM
  ├─► index.js     → inicializa formulario, validación, honeypot
  ├─► blog.js      → fetch de /blog/posts.json → genera listado de posts
  └─► markdown.js  → fetch de /blog/[slug].md → parseo → sanitización → renderizado
```

No existe tráfico entre el navegador y un servidor de aplicación propio.
El único endpoint externo con intercambio de datos es Formspree (formulario de contacto),
acotado por CSP.

---

## 5. Blog Dinámico Basado en Markdown

### 5.1 Arquitectura del Blog

El blog opera en modo "JAMStack simplificado": no hay generador de sitios (Hugo, Jekyll),
no hay proceso de build, no hay despliegue compilado. El pipeline es:

```
Archivo .md en /blog/
  │
  ▼
blog/posts.json (manifiesto de posts actualizado manualmente o por script)
  │
  ▼
blog.js → fetch posts.json → ordena por fecha DESC → genera DOM con enlaces
  │
  ▼
Usuario hace clic → post.html?post=nombre.md
  │
  ▼
markdown.js → valida parámetro → fetch del .md → marked.js → sanitizador → DOM
```

### 5.2 Front Matter

Los posts soportan front matter YAML al inicio del archivo:

```yaml
---
title: Título del Post
date: 2026-04-02
description: Descripción breve para listado
---
```

Si no hay front matter, el título se extrae del primer encabezado `#` del archivo.

### 5.3 Sanitización del Contenido

El HTML generado por marked.js es filtrado por un sanitizador de allowlist implementado
en `markdown.js`. Solo se permiten:

- **Etiquetas**: `p`, `h1`-`h6`, `ul`, `ol`, `li`, `blockquote`, `code`, `pre`,
  `strong`, `em`, `a`, `img`, `table`, `thead`, `tbody`, `tr`, `th`, `td`, `hr`, `br`.
- **Atributos por etiqueta**: `href` y `target` en `<a>`, `src` y `alt` en `<img>`.
- **URLs permitidas**: solo `https://`, `http://`, `./`, `/` y `#`. Se bloquean `javascript:`,
  `data:`, `vbscript:` y cualquier protocolo no reconocido.
- **Forzado**: todos los enlaces externos llevan `rel="noopener noreferrer"`.

### 5.4 Imágenes en Posts

Las imágenes se referencian con rutas relativas desde el directorio del post:

```markdown
![Alt text](./assets/nombre-imagen.png)
```

El sanitizador normaliza las rutas de `src` para garantizar que apunten
a `/blog/assets/` y no a orígenes externos no autorizados.

---

## 6. Modo Oscuro por Defecto + Toggle de Tema

### 6.1 Implementación

El sistema de tema es gestionado íntegramente por `assets/js/site.js`:

1. Al cargar la página se lee `localStorage.getItem('theme')`.
2. Si el valor es `'light'`, se añade la clase `light-mode` a `<html>`.
3. Si no hay preferencia (primera visita), el tema por defecto es **oscuro**.
4. El botón toggle (icono SVG de sol) se inyecta en `document.body` como
   elemento `position: fixed; top: 1rem; right: 1rem; z-index: 9999`.
5. Al pulsar el toggle, se cambia la clase de `<html>` y se persiste la preferencia.

### 6.2 Variables CSS

El tema está controlado por variables CSS en `assets/css/site.css`:

```css
:root {
  --bg: #0a0a0a;
  --fg: #e8e8e8;
  --accent: #00aeef;
  --muted: #888;
  --border: #1e1e1e;
}
html.light-mode {
  --bg: #f8f8f8;
  --fg: #111;
  --accent: #0077b5;
  --muted: #555;
  --border: #ddd;
}
```

Todas las páginas del proyecto cargan `assets/css/site.css` como primer stylesheet,
garantizando coherencia de tema sin flash de contenido sin estilo (FOUC minimizado).

---

## 7. Footer con Iconos Oficiales SVG

El footer global es generado por `assets/js/site.js` e inyectado en el elemento
`<footer data-site-footer>` presente en cada página HTML.

Estructura generada:

```html
<footer class="site-footer">
  <div class="site-footer-links">
    <a href="https://www.linkedin.com/in/juliocesarabreup/"
       class="site-social-link" target="_blank" rel="noopener noreferrer"
       aria-label="LinkedIn">
      <!-- SVG inline de LinkedIn -->
    </a>
    <a href="https://github.com/JulioCesarAbreuP"
       class="site-social-link" target="_blank" rel="noopener noreferrer"
       aria-label="GitHub">
      <!-- SVG inline de GitHub -->
    </a>
  </div>
</footer>
```

Los SVGs están incrustados inline para eliminar dependencias externas y permitir
control de color via CSS (`fill: currentColor`). El hover aplica transición de opacidad.

---

## 8. CSP Estricta y Cabeceras de Seguridad

### 8.1 Content Security Policy

Implementada como meta tag por página (en ausencia de cabeceras HTTP configurables
en GitHub Pages). Política base para páginas sin CDN externo:

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

Para `post.html` (que carga marked.js desde CDN con SRI):

```
script-src 'self' https://cdn.jsdelivr.net;
```

### 8.2 Otras Cabeceras (meta http-equiv)

| Cabecera | Valor | Propósito |
|----------|-------|-----------|
| X-Content-Type-Options | nosniff | Prevención de MIME sniffing |
| X-Frame-Options | DENY | Bloqueo de iframe embedding (clickjacking) |
| Referrer-Policy | strict-origin-when-cross-origin | Minimización de fuga de URL de referencia |
| Permissions-Policy | geolocation=(), microphone=(), camera=() | Restricción de APIs sensibles del navegador |

### 8.3 SRI en Recursos CDN

La dependencia `marked.js` se carga con Subresource Integrity:

```html
<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"
        integrity="sha384-[hash]"
        crossorigin="anonymous"></script>
```

Esto garantiza que el navegador rechace el recurso si el CDN entrega
una versión comprometida o alterada.

---

## 9. Integración con Formspree

El formulario de contacto en `index.html` utiliza Formspree como backend de recepción.
No se almacenan datos localmente. La integración sigue las siguientes restricciones:

- **CSP**: `connect-src` y `form-action` están explícitamente limitados a
  `https://formspree.io`.
- **Honeypot**: campo oculto `_hp_filter` que los bots rellenan pero humanos no.
  Formspree filtra automáticamente envíos con este campo relleno.
- **Sin scripts externos de Formspree**: el formulario usa `fetch()` nativo,
  no el widget JS de Formspree, para evitar scripts externos no controlados.
- **HTTPS forzado**: `upgrade-insecure-requests` en CSP garantiza que cualquier
  llamada se realice siempre sobre TLS.

---

## 10. Resiliencia Operativa en Sitio Estático

| Escenario de fallo | Comportamiento del sitio |
|--------------------|--------------------------|
| CDN de fuentes no disponible | Fuentes del sistema como fallback (`system-ui, sans-serif`) |
| JS deshabilitado | Footer estático HTML visible; contenido principal accesible |
| marked.js CDN no disponible | Error capturado; mensaje de fallback en el contenedor del post |
| Formspree no disponible | Error capturado; mensaje de usuario en el formulario |
| posts.json no encontrado | Mensaje de estado vacío; sin crash de la aplicación |
| GitHub Pages no disponible | Sin punto de recuperación propio; depende de SLA de GitHub |

La resiliencia de la capa de contenido se garantiza mediante:
- Versionado Git de todos los assets.
- Sin dependencias de runtime por parte del servidor.
- Degradación funcional progresiva en ausencia de JS o recursos externos.

---

## 11. Relación con CIS Controls v8, NIST 800-53 y Zero Trust

### CIS Controls v8

| Control CIS | Implementación en SEC_ARCHITECT |
|-------------|--------------------------------|
| CIS 2 — Inventario de Software | Dependencias declaradas y versionadas en HTML |
| CIS 4 — Configuración Segura | CSP, cabeceras, SRI, modo HTTPS |
| CIS 13 — Protección de Datos | Sin datos sensibles almacenados; formulario sin logging |
| CIS 16 — Seguridad de Aplicaciones | Sanitización DOM, validación de parámetros, honeypot |

### NIST 800-53

| Familia de Controles | Implementación |
|----------------------|----------------|
| AC — Control de Acceso | CSP como control de acceso a recursos de origen |
| SC — Protección de Sistemas | TLS, SRI, HTTPS forzado |
| SI — Integridad del Sistema | Sanitización de inputs, validación de parámetros URL |
| CM — Gestión de Configuración | Versionado Git, configuración declarativa en HTML |

### Zero Trust

| Principio Zero Trust | Implementación |
|----------------------|----------------|
| Verificar siempre | SRI en CDN; validación de origen en fetch |
| Mínimo privilegio | CSP restrictiva; Permissions-Policy mínima |
| Asumir brecha | Sanitización defensiva; fallbacks ante fallos externos |

---

## 12. Diagrama Textual de Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                     USUARIO FINAL                           │
│              (Navegador moderno, HTTPS)                     │
└───────────────────────────┬─────────────────────────────────┘
                            │ TLS 1.3
                            ▼
┌─────────────────────────────────────────────────────────────┐
│               GITHUB PAGES CDN                              │
│     (Distribución global, TLS automático, sin config)       │
└──────┬──────────────┬─────────────────┬────────────────┬───┘
       │              │                 │                │
       ▼              ▼                 ▼                ▼
  index.html      blog.html        post.html     blog/[slug]/
       │              │                 │           index.html
       ▼              ▼                 ▼
  [index.js]     [blog.js]       [markdown.js]
  Formulario     Listado          Renderizador
  Honeypot       posts.json       marked.js+SRI
  Validación     Ordenación       Sanitizador
       │              │                 │
       ▼              │                 ▼
  Formspree      posts.json      /blog/[slug].md
  (HTTPS+CSP)    (manifest)      (Contenido MD)
                                       │
                            ┌──────────┴──────────┐
                            │   site.js (global)  │
                            │  - Toggle tema      │
                            │  - Footer SVG       │
                            │  - localStorage     │
                            └─────────────────────┘
                                assets/css/site.css
                                assets/icons/*.svg
                                assets/favicon.svg
```

---

> La arquitectura de SEC_ARCHITECT se inspira en marcos como SABSA, aplicando una
> progresión natural desde la capa contextual (¿por qué existe el sitio y qué protege?)
> hasta la física (¿cómo se sirven los archivos y con qué controles técnicos concretos?).
> Cada decisión de diseño es trazable a un riesgo o un principio de seguridad definido.

---

## 13. Enterprise SABSA IG4 Command Graph

La superficie enterprise del Command Center adopta un patron no-chat, orientado a parser y motor
de inferencia para Azure Entra ID.

### 13.1 Flujo principal

1. **Entra ID Parser**
  - Entrada obligatoria: JSON valido.
  - Validacion de estructura: Service Principal o Conditional Access Policy.
2. **Threat Inference Engine (background)**
  - Prompt interno oculto para inferencia de ataque.
  - Salida estricta: `probability`, `critical_node`, `mitre_technique`, `attack_path`, `terraform_fix`.
3. **Motor multicapas (SABSA IG4)**
  - Capa 1: sintactica.
  - Capa 2: semantica.
  - Capa 3: grafo `User -> Role -> Resource -> Exposure -> Attack Path`.
  - Capa 4: inferencia probabilistica.
  - Capa 5: remediacion contextual IaC.
4. **Operational Memory**
  - Estado persistente de ultimo analisis, riesgo previo y tendencia.
5. **Shadow Monitor**
  - Eventos sinteticos cada 30s, frecuencia adaptativa por riesgo.

### 13.2 Modulos Staff obligatorios

#### 13.2.1 Modulos de Dominio (Legacy + Nuevos)

**Legacy Core (10 módulos):**
- `core/mitre-engine.js` — MITRE ATT&CK mapping (30 cloud techniques) + risk scoring
- `core/sabsa-logic.js` — SABSA IG4 inference layers (syntactic, semantic, probabilistic)
- `core/identity-parser.js` — Validación de payloads de identidad (JSON schema)
- `core/rules-engine.js` — Evaluación de riesgos por reglas (MFA, roles, permisos)
- `core/scoring-engine.js` — Zero Trust Score + legacy scoring logic
- `core/graph-engine.js` — Construcción de grafo de ataque (nodos, aristas, simulación)
- `core/inference-engine.js` — Motor de inferencia probabilística (MITRE técnica + lateral vector)
- `core/remediation-engine.js` — Generación de soluciones IaC (Terraform)
- `core/memory-engine.js` — Persistencia de contexto operacional (narrative builder)
- `core/telemetry-engine.js` — Eventos sinteticos + shadow monitor

**Nuevos Módulos (7 módulos — CSPM ultra-premium):**
- `core/azure-connector.js` — PKCE OAuth2 + Graph API (Entra ID, Conditional Access, Audit Logs)
- `core/threat-intel.js` — MITRE STIX sync + CISA KEV (vulnerabilidades en tiempo real)
- `core/drift-engine.js` — Monitoreo de desviación en Azure Activity Logs (9 patrones)
- `core/osint-engine.js` — Shodan + Criminal IP (reconocimiento externo de exposición)
- `core/risk-engine.js` — Scoring multidimensional composable (8 dimensiones de riesgo)
- `core/iac-generator.js` — Blueprint Architect (5 blueprints Terraform + Bicep)
- `core/digital-twin.js` — Gemelo digital de tenant (simulación de cambios + ataques)

#### 13.2.2 Módulos de Presentación (UI + Logging)

- `ui/ui-renderer.js` — Renderizador JSON + Markdown genérico
- `ui/ui-panels.js` — Referencias al DOM para todas las secciones
- `ui/ui-logs.js` — Consola SOC (pushSocLogs, pushSingleLog, tone classes)
- `ui/ui-graph.js` — Renderizador de grafo (D3.js force-directed + fallback SVG)
- `ui/ui-score.js` — Renderizadores de puntuación (texto, gauge SVG, breakdown grid)
- `ui/ui-architecture-board.js` — Panel de arquitectura (preguntas + respuestas)

#### 13.2.3 Loader Principal

- `main.js` (797 líneas) — Bootstrap de 8 tabs, wiring de eventos, handlers de análisis

`main.js` queda restringido a bootstrap y no contiene logica de dominio.

### 13.3 Stack de visualizacion y justificacion

1. **SABSA IG4 como marco base**
  - Se usa porque obliga trazabilidad entre decision de seguridad, riesgo y control tecnico.
  - Permite evaluar el mismo payload desde capa sintactica, semantica, grafo, probabilidad y remediacion.
2. **Chart.js para series y radar operativos**
  - Adecuado para tendencias de riesgo y score temporal con costo cognitivo bajo para SOC.
  - Su API estable reduce deuda de mantenimiento para tableros tacticos.
3. **D3/Cytoscape para topologia de ataque**
  - El modelo de nodos y aristas es mas expresivo para movimiento lateral que una grafica tradicional.
  - Se usa como capa especializada para interaccion por nodo, simulacion de trayectorias y analisis de caminos.
  - En esta iteracion se conserva un renderer SVG minimalista (`ui/ui-graph.js`) y se deja preparado el contrato
    para evolucionar a D3 o Cytoscape sin tocar el dominio (`core/graph-engine.js`).

### 13.4 Contratos de salida de control

- El parser produce `meta`, `errors` y `warnings` con semantica estable.
- El rules engine produce `findings` + `logs` para alimentar SOC dynamic feed.
- El scoring engine produce un score de confianza de 0 a 100 con mejoras incrementales por remediacion.
- El graph engine produce nodos y aristas para simulacion de attack path y callbacks de inspeccion.
---

## 14. Plataforma CSPM Ultra-Premium (Cloud Security Posture Management)

### 14.1 Vista General

La plataforma CSPM es accesible via `tools/enterprise-command-center.html` y proporciona:
- 8 tabs especializados para análisis de seguridad en tiempo real
- Integración con Azure (Graph API + Activity Logs)
- Reconocimiento OSINT (Shodan + Criminal IP)
- Sincronización de amenazas (MITRE STIX + CISA KEV)
- Monitoreo de desviación (drift detection)
- Gemelo digital del tenant (Digital Twin)
- Blueprints de remediación (Terraform + Bicep)
- Consola SOC con 12 tonos de log (check, fail, mitre, info, warn, threat, ok, drift, alert, etc.)

### 14.2 Arquitectura de 8 Tabs

| Tab | Módulos | Función |
|-----|---------|---------|
| **Analyzer** | identity-parser, rules-engine, inference-engine, iac-generator, risk-engine | Análisis de payload de identidad → riesgo compuesto → remediación JIT |
| **Attack Graph** | graph-engine, mitre-engine, renderAttackGraph | Visualización D3.js de trayectoria de ataque con simulación |
| **Threat Intel** | threat-intel (MITRE STIX + CISA KEV), getTechniqueList | Sync de amenazas en tiempo real, búsqueda de CVEs |
| **Drift Monitor** | drift-engine, authenticateGraph, fetchAuditLogs | Detección de desviación en Azure Activity Logs (9 patrones) |
| **OSINT Scanner** | osint-engine (Shodan + Criminal IP) | Reconocimiento externo de exposición de IPs/dominios |
| **Blueprint Architect** | iac-generator (5 blueprints: storage, keyvault, appservice, mfa, network) | Generación de IaC (Terraform + Bicep) para remediación |
| **Digital Twin** | digital-twin class (DigitalTwin) | Simulación de cambios + ataques sobre gemelo del tenant |
| **Azure Scanner** | azure-connector (Graph API + PKCE) | Conexión PKCE OAuth2 → fetch Conditional Access policies + Activity Logs |

### 14.3 CSS Personalizado (enterprise.css)

Fichero `assets/css/enterprise.css` (~600 líneas) proporciona:

- **Tema CSPM**: 14 variables CSS (bg, bg2, card, border, border-glow, text, muted, accent, accent2, healthy, degraded, critical, warn)
- **Sticky header** con global status badge y botón night mode
- **Tab navigation** (sticky top, 8 pestañas activas/inactivas)
- **Panel layouts específicos**: analyzer grid (3-col), attack-graph, intel-grid (2-col), drift feed, osint layout, blueprint sidebar + code output, digital twin grid, azure scanner
- **Gauge SVG helpers**: arc path, fill animation, value display
- **Console styling**: 12 tonos (check=✓, fail=✗, mitre=🎯, info=ℹ, warn=⚠, threat=⛔, ok=✅, drift=≈, alert=🔔)
- **Escalation banner**: animación pulse para eventos críticos
- **SOC night mode**: sobrescribe `body.soc-night` con colores adicionales (rojo más oscuro, fondo aún más negro)
- **D3 graph styles**: classes para node circles, links, labels

### 14.4 Flujo de Análisis (Analyzer Tab - Tab 1)

```
Usuario pega JSON de identidad
  ↓
parseAndValidateIdentity() → parseador + ruleset
  ↓
evaluateIdentityRules() → flags (mfaEnabled, privilegedRole, ...)
  ↓
calculateCompositeRisk() → 8 dimensiones → score + level + breakdown + zeroTrustScore
  ↓
applyGlobalState() → actualiza gauge, score bar, radar, status badge global
  ↓
runBackgroundThreatInference() → engine IA → MITRE técnica + lateral vector + attack_path
  ↓
generateContextualRemediation() → iac-generator → Terraform/Bicep (contextual por flags)
  ↓
Webhook opcional → GitHub Actions → remediación JIT
  ↓
Memory engine → persistOperationalContext() → narrative builder
```

### 14.5 Digital Twin (Tab 7)

Clase `DigitalTwin` (core/digital-twin.js) permite:

1. **loadFromPayload()** — Carga snapshot de tenant desde payload de identidad
2. **simulateChange(type)** — Simula 5 tipos de cambios: enable-mfa, scope-role, restrict-permissions, baseline-ca, maturity-phase
3. **simulateAttack(mitre_technique)** — Simula 4 ATT&CK techniques: T1078 (brute-force), T1556 (modify auth), T1548 (privesc), T1567 (exfil), calcula probabilidad de compromiso
4. **getState()** — Retorna gemelo actual (identidades, permisos, MFA, score)
5. **reset()** — Reinicia al state inicial

### 14.6 Integración Azure + PKCE (Tab 8)

Módulo `core/azure-connector.js`:

- `initiateGraphLogin(clientId, tenantId, redirectUri)` — Genera PKCE verifier + challenge, redirige a Azure AD
- `handleAuthCallback()` — Intercambia code + verifier por access token (SessionStorage)
- `fetchConditionalAccessPolicies()` — GET /identity/conditionalAccessPolicies
- `fetchAuditLogs(hours)` — GET /auditLogs/directoryAudits?$filter=createdDateTime gt [time] (retorna Activity log)
- `isAuthenticated()` — Check si token válido
- `disconnect()` — Borra token + restablece UI

### 14.7 Stack Tecnológico

- **Frontend**: ES Modules (type="module"), JavaScript vanilla (no frameworks)
- **CDNs**: D3.js v7 + Chart.js v4 (cdn.jsdelivr.net)
- **Visualización**: D3 force simulation, Chart.js radar, SVG gauges
- **Storage**: SessionStorage para auth tokens (auto-cleared on close)
- **Seguridad**: CSP relajada para CDNs + Graph API, SRI integridad si aplica

### 14.8 ADRs Relacionados

- **ADR-004** — Decisión de usar Graph API + PKCE (no client secret en browser)
- **ADR-005** — Decisión de Shodan OSINT (external reconnaissance)
- **ADR-006** — Decisión de webhooks GitHub Actions (JIT remediation auditable)