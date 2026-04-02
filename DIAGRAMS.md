# DIAGRAMS — SEC_ARCHITECT

> Diagramas de arquitectura, flujo de datos, interacciones de seguridad
> y modelos de amenazas del sitio estático SEC_ARCHITECT.
> Formato: ASCII art + instrucciones para herramientas gráficas.

---

## 1. Diagrama ASCII de Arquitectura Global

```
┌─────────────────────────────────────────────────────────────────────┐
│                          USUARIO FINAL                              │
│                   (Navegador moderno, HTTPS)                        │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ TLS 1.3
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      GITHUB PAGES CDN                               │
│              (TLS automático, distribución global)                  │
└────────┬──────────────┬──────────────────┬──────────────┬──────────┘
         │              │                  │              │
         ▼              ▼                  ▼              ▼
    index.html      blog.html          post.html    blog/[slug]/
    (Home)          (Listado)          (Post)       index.html
         │              │                  │
         ▼              ▼                  ▼
    [index.js]     [blog.js]         [markdown.js]
    Formulario     Listado           Sanitizador
    Honeypot       posts.json        marked.js CDN
         │              │                  │
         ▼              ▼                  ▼
    Formspree      /blog/posts.json  /blog/[slug].md

                    CAPA GLOBAL (todas las páginas)
         ┌──────────────────────────────────────────┐
         │              assets/js/site.js            │
         │  ┌──────────────┐  ┌────────────────────┐│
         │  │ Toggle Tema  │  │  Footer SVG inline  ││
         │  │ localStorage │  │  LinkedIn + GitHub  ││
         │  └──────────────┘  └────────────────────┘│
         └──────────────────────────────────────────┘
         ┌──────────────────────────────────────────┐
         │           assets/css/site.css             │
         │  Variables CSS: --bg, --fg, --accent      │
         │  Estilos: footer, toggle, iconos, tema    │
         └──────────────────────────────────────────┘
```

---

## 2. Diagrama de Flujo del Blog Dinámico

```
Usuario visita blog.html
         │
         ▼
    blog.js se ejecuta
         │
         ▼
    fetch('/blog/posts.json')
         │
    ┌────┴────────────────────────────────────┐
    │ OK (200)              │ ERROR (404/fail) │
    ▼                       ▼                  │
Parse JSON             Mostrar mensaje         │
Array de posts         "No hay posts"          │
    │                                          │
    ▼                                          │
Para cada post:                                │
  - Extraer título (front matter o H1)         │
  - Extraer fecha                              │
  - Crear elemento <article> en DOM            │
  - Enlace → post.html?post=[nombre].md        │
    │                                          │
    ▼                                          │
Ordenar por fecha DESC                         │
    │                                          │
    ▼                                          │
Renderizar lista en #blog-list                 │
         │
         ▼
Usuario hace clic en un post
         │
         ▼
Navega a post.html?post=nombre-del-post.md
         │
         ▼
    markdown.js se ejecuta
         │
         ▼
Validar parámetro: /^[\w\-\.]+\.md$/
    │
    ├─ INVÁLIDO → Mostrar error; detener
    │
    └─ VÁLIDO
         │
         ▼
fetch('/blog/' + nombrePost)
         │
    ┌────┴──────────────────┐
    │ OK                    │ ERROR
    ▼                       ▼
Texto Markdown         Mostrar mensaje de error
    │
    ▼
marked.parse(texto) → HTML crudo
    │
    ▼
sanitizador(htmlCrudo) → HTML filtrado por allowlist
    │
    ▼
contenedor.innerHTML = htmlFiltrado
    │
    ▼
Ajustar rutas relativas de imágenes
    │
    ▼
Post visible al usuario
```

---

## 3. Diagrama de Interacción CSP → Navegador

```
Servidor (GitHub Pages)
     │
     │  HTTP Response
     │  Headers: Content-Type, Cache-Control
     │  (Sin cabeceras HTTP custom)
     │
     ▼
Navegador recibe HTML
     │
     ▼
Parser HTML encuentra:
     │
     ├─► <meta http-equiv="Content-Security-Policy" content="...">
     │        │
     │        ▼
     │   Navegador registra política CSP
     │
     ├─► <link rel="stylesheet" href="assets/css/site.css">
     │        │
     │        ▼
     │   CSP: ¿style-src permite 'self'? → SÍ → Carga
     │
     ├─► <script src="assets/js/site.js">
     │        │
     │        ▼
     │   CSP: ¿script-src permite 'self'? → SÍ → Ejecuta
     │
     ├─► <script src="https://cdn.jsdelivr.net/.../marked.min.js"
     │           integrity="sha384-...">
     │        │
     │        ▼
     │   CSP: ¿script-src permite cdn.jsdelivr.net? → SÍ (solo en post.html)
     │   SRI: ¿hash coincide? → SÍ → Ejecuta / NO → Bloquea
     │
     └─► fetch('https://formspree.io/...')
              │
              ▼
         CSP: ¿connect-src permite formspree.io? → SÍ → Permite
              ¿Cualquier otro origen? → NO → Bloquea + Error en consola
```

---

## 4. Diagrama de Flujo del Formulario

```
Usuario rellena formulario en index.html
         │
         ▼
Validación client-side (HTML5 + index.js)
    │
    ├─ INVÁLIDO → Mostrar errores; sin envío
    │
    └─ VÁLIDO
         │
         ▼
¿Campo honeypot _hp_filter relleno?
    │
    ├─ SÍ (bot) → Formspree descarta silenciosamente
    │
    └─ NO (humano)
         │
         ▼
fetch('https://formspree.io/[id]', {
  method: 'POST',
  headers: { 'Accept': 'application/json' },
  body: FormData
})
         │
    ┌────┴──────────────────────┐
    │ OK (200)                  │ ERROR
    ▼                           ▼
Mostrar mensaje de éxito    Mostrar mensaje de error
Limpiar formulario          Sugerir reintento
         │
         ▼
Formspree almacena el mensaje
Envía notificación al propietario
```

---

## 5. Diagrama de Amenazas STRIDE

```
                    FLUJO DE DATOS: Usuario → Blog Post
                    ────────────────────────────────────

[Usuario] ──(1)──► [GitHub Pages] ──(2)──► [blog.js] ──(3)──► [posts.json]
                                                │
                                               (4)
                                                │
                                                ▼
                                         [markdown.js]
                                                │
                                               (5)
                                                │
                                                ▼
                                          [marked.js CDN]
                                                │
                                               (6)
                                                │
                                                ▼
                                          [Sanitizador]
                                                │
                                               (7)
                                                │
                                                ▼
                                           [DOM / innerHTML]

STRIDE por flujo:
(1) Spoofing del dominio         → MITIGADO: HTTPS + HSTS de GitHub Pages
(2) Tampering de archivos        → MITIGADO: Control de acceso en repo Git
(3) Tampering de posts.json      → MITIGADO: PR review; repo protegido
(4) Information Disclosure       → BAJO: contenido público por diseño
(5) Supply chain CDN (marked.js) → MITIGADO: SRI + versión fijada
(6) XSS via HTML en Markdown     → MITIGADO: Sanitizador allowlist
(7) DOM XSS via innerHTML        → MITIGADO: CSP sin unsafe-inline + sanitizador
```

---

## 6. Instrucciones para Generar Diagramas .drawio

Los diagramas de este proyecto pueden editarse visualmente con draw.io (diagrams.net).

### 6.1 Crear un diagrama nuevo

1. Abre https://app.diagrams.net/ o usa la extensión de VS Code "Draw.io Integration".
2. Crea un nuevo archivo en la raíz del proyecto: `diagrams/arquitectura.drawio`.
3. Importa el diagrama ASCII como texto de referencia.
4. Usa los shapes de "Network" para representar CDN, navegador y endpoints.
5. Usa flechas etiquetadas ("TLS", "fetch", "CSP") para flujos.

### 6.2 Paleta de colores recomendada (coherente con el sitio)

| Elemento | Color de fondo | Color de borde |
|----------|----------------|----------------|
| Usuario / Navegador | `#1a1a2e` | `#00AEEF` |
| GitHub Pages CDN | `#0d1117` | `#30363d` |
| JS Modules | `#0a3040` | `#00AEEF` |
| Terceros (Formspree, CDN) | `#2d1b00` | `#f0a500` |
| Controles de seguridad | `#003300` | `#00cc44` |
| Amenazas / Vectores | `#3d0000` | `#cc0000` |

### 6.3 Capas recomendadas en draw.io

- Capa 1: Infraestructura (CDN, GitHub Pages)
- Capa 2: Componentes de aplicación (HTML, JS, CSS)
- Capa 3: Flujos de datos (flechas con etiquetas)
- Capa 4: Controles de seguridad (CSP, SRI, sanitizador)
- Capa 5: Vectores de amenaza (STRIDE overlay)

---

## 7. Instrucciones para Exportar SVG desde draw.io

### 7.1 Exportación básica

1. Diagrama → File → Export as → SVG.
2. Opciones recomendadas:
   - Zoom: 100%
   - Border Width: 10
   - Transparent Background: ON (para modo oscuro compatible)
   - Include a copy of the diagram: OFF (para SVG limpio)
3. Guardar en `/assets/diagrams/[nombre].svg`.

### 7.2 Optimización del SVG exportado

```bash
# Instalar SVGO
npm install -g svgo

# Optimizar
svgo diagrama.svg --output diagrama.min.svg
```

### 7.3 Uso del SVG en el sitio

```html
<!-- SVG como imagen (no ejecuta JS) -->
<img src="assets/diagrams/arquitectura.min.svg" alt="Diagrama de arquitectura">

<!-- SVG inline (permite control CSS del color) -->
<!-- Copiar el contenido del SVG directamente en el HTML -->
```

---

> Los diagramas siguen una estructura por capas coherente con marcos como SABSA:
> desde la representación contextual de los activos y actores hasta la visualización
> física de los controles técnicos implementados en cada componente del sistema.
