# ARCHITECTURE - SEC_ARCHITECT

## 1. Proposito del proyecto
SEC_ARCHITECT es un sitio estatico orientado a arquitectura de ciberseguridad empresarial para PYMEs, con tres objetivos tecnicos simultaneos:

1. Comunicar una propuesta de valor de seguridad avanzada (CIS, Zero Trust, resiliencia).
2. Operar con superficie de ataque minima en un modelo de hosting estatico (GitHub Pages).
3. Habilitar un flujo editorial tecnico mediante blog en Markdown sin introducir backend propio.

El proyecto no persigue complejidad de plataforma; prioriza control explicito del runtime, trazabilidad de cambios y robustez operacional bajo un principio de "menos componentes, menos riesgo".

## 2. Filosofia de diseno (minimalismo, resiliencia, Zero Trust)
La arquitectura aplica una filosofia de "minimalismo estructural con defensa en profundidad":

1. Minimalismo funcional:
   - Sitio estatico, sin framework pesado y sin dependencia de rendering server-side.
   - JavaScript modular pequeno y orientado a funciones puntuales (tema, footer, formulario, blog, parser Markdown).
2. Resiliencia operativa:
   - Degradacion controlada: si una capacidad secundaria falla, el sitio principal permanece disponible.
   - Reduccion de acoplamiento: cada pagina puede renderizar contenido esencial sin pipeline complejo.
3. Zero Trust aplicado al frontend:
   - Ningun input o contenido dinamico se considera confiable por defecto.
   - Validacion de parametros de URL.
   - Sanitizacion explicita del HTML derivado de Markdown.
   - Restriccion de origenes via CSP estricta.

## 3. Estructura de carpetas
La estructura esta segmentada en capas de responsabilidad:

```text
sec-architect/
|- index.html                # Landing principal
|- index.js                  # Integracion de formulario (Formspree)
|- blog.html                 # Listado dinamico de posts
|- blog.js                   # Descubrimiento + metadatos + ordenamiento de posts
|- post.html                 # Renderizador de post individual
|- markdown.js               # Parseo front matter + render Markdown + sanitizacion
|- SECURITY.md               # Politica de seguridad
|- SECURITY_REVIEW.md        # Hallazgos y remediaciones tecnicas
|- ARCHITECTURE.md           # Este documento
|- assets/
|  |- favicon.svg
|  |- css/
|  |  |- site.css            # Estilos globales (toggle, footer, iconos)
|  |  |- index.page.css      # Estilos pagina principal
|  |  |- blog.page.css       # Estilos listado blog
|  |  |- post.page.css       # Estilos pagina de post
|  |- js/
|  |  |- site.js             # Logica global (tema + footer)
|  |- icons/
|     |- linkedin.svg        # Recurso oficial SVG
|     |- github.svg          # Recurso oficial SVG
|- blog/
   |- posts.json             # Inventario fallback de posts
   |- index.html             # Pagina estatica adicional de blog
   |- identidad-vs-cuenta/
   |  |- index.html          # Articulo estatico puntual
   |- assets/
      |- article.page.css    # Estilo para articulos de la carpeta blog/
```

Principio de organizacion: el directorio `assets/` concentra recursos reutilizables globales; el directorio `blog/` concentra contenido editorial y su contexto.

## 4. Flujo de datos del sitio estatico
No existe backend de aplicacion. El flujo de datos se resuelve en cliente con fetch controlado y politicas de seguridad:

1. Navegacion principal:
   - El navegador solicita HTML estatico.
   - Cada pagina carga CSS local y scripts locales permitidos por CSP.
2. Capa global de UI:
   - `assets/js/site.js` inicializa tema y footer en `DOMContentLoaded`.
   - Se aplica preferencia de tema desde `localStorage`, con fallback a oscuro.
3. Formulario de contacto:
   - `index.js` intercepta submit y envia JSON a Formspree via HTTPS.
   - El endpoint externo queda restringido por `connect-src` y `form-action`.
4. Blog dinamico:
   - `blog.js` intenta descubrimiento de posts por listado de directorio.
   - Si el hosting no expone listado, usa `blog/posts.json` como fallback.
   - Carga cada `.md`, extrae front matter, calcula fecha y ordena descendentemente.
5. Post dinamico:
   - `post.html` recibe `?post=...`.
   - `markdown.js` valida parametro, descarga Markdown, renderiza y sanitiza antes de insertar en DOM.

Este modelo evita estado compartido del lado servidor y reduce la necesidad de infraestructura compleja.

## 5. Blog dinamico basado en Markdown
El subsistema de blog implementa una tuberia de cuatro etapas:

1. Descubrimiento:
   - Fuente A: parseo de listado del directorio `blog/` cuando el server lo permite.
   - Fuente B: manifiesto `blog/posts.json` (estrategia compatible con hosting estatico estricto).
2. Ingestion:
   - Carga individual de archivos `.md` mediante fetch con cache-control conservador.
3. Extraccion semantica:
   - Parseo de front matter (`title`, `date`).
   - Fallback a primer `# Heading` como titulo.
4. Publicacion segura:
   - Render Markdown con Marked.
   - Sanitizacion por allowlist de etiquetas/atributos/URLs.
   - Enlaces externos reforzados con `rel="noopener noreferrer"`.

Esto separa claramente el plano editorial (contenido Markdown) del plano de ejecucion (DOM seguro).

## 6. Modo oscuro por defecto + toggle de tema
El sistema de tema esta centralizado para evitar divergencias entre paginas:

1. Fuente de verdad:
   - Atributo `data-theme` en `body`.
2. Persistencia:
   - Clave localStorage `sec_architect_theme`.
3. Politica por defecto:
   - Si no hay preferencia persistida, se impone `dark`.
4. Interaccion:
   - Un solo boton global en esquina superior derecha.
   - El boton alterna `dark`/`light` y actualiza iconografia de estado.

Resultado arquitectonico: consistencia visual transversal sin duplicar logica por pagina.

## 7. Footer con iconos oficiales SVG
El footer es un componente global inyectado por script para mantener uniformidad:

1. Composicion:
   - Contenedor footer comun.
   - Dos enlaces sociales (LinkedIn y GitHub).
   - SVG inline para independencia de recursos remotos.
2. Beneficios:
   - Menor latencia y menos dependencia externa.
   - Mejor control de color/hover via CSS tokenizado.
   - Coherencia visual entre rutas raiz y subrutas.
3. Comportamiento de resiliencia:
   - Si existe footer en HTML, se reutiliza.
   - Si no existe, se crea dinamicamente.

## 8. CSP estricta y cabeceras de seguridad
La arquitectura de seguridad se basa en restricciones de origen y minimizacion de capacidades del navegador:

1. CSP de alta restriccion:
   - `default-src 'self'`
   - `script-src 'self'`
   - `style-src 'self' https://fonts.googleapis.com`
   - `font-src 'self' https://fonts.gstatic.com`
   - `img-src 'self' data:`
   - `connect-src 'self' https://formspree.io`
   - `form-action 'self' https://formspree.io`
   - `object-src 'none'`
   - `frame-ancestors 'none'`
   - `base-uri 'none'`
   - `upgrade-insecure-requests`
   - `block-all-mixed-content`
2. Cabeceras adicionales declaradas:
   - `X-Content-Type-Options: nosniff`
   - `X-Frame-Options: DENY`
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - `Permissions-Policy: geolocation=(), microphone=(), camera=()`

Nota operacional: en GitHub Pages varias cabeceras se declaran via meta; al migrar a proxy gestionado deben establecerse como cabeceras HTTP reales en borde.

## 9. Integracion con Formspree
La integracion de contacto usa un patron "delegacion externa con acotacion fuerte":

1. Captura local de formulario en `index.js`.
2. Serializacion explicita de campos permitidos (`empresa`, `email`, `mensaje`).
3. Envio `POST` a endpoint Formspree por HTTPS.
4. Honeypot `_hp_filter` para filtrado basico anti-bot.
5. Restriccion CSP para evitar exfiltracion a terceros no autorizados.

La arquitectura evita almacenar secretos en frontend y evita backend propio para una capacidad no core.

## 10. Como se garantiza la resiliencia operativa en un sitio estatico
La resiliencia no se limita a disponibilidad; incorpora continuidad funcional bajo fallo parcial:

1. Hosting estatico:
   - Menor superficie de ataque que stacks server-side clasicos.
   - Menos componentes en ejecucion, menos puntos de ruptura.
2. Degradacion progresiva:
   - Sin listado de directorio: fallback a `blog/posts.json`.
   - Sin preferencia de tema: fallback a oscuro.
   - Sin footer preexistente: inyeccion automatica.
3. Dependencias acotadas:
   - Runtime principal local.
   - Un proveedor externo para formulario.
   - Un parser Markdown bajo control de CSP y sanitizacion.
4. Recuperabilidad operativa:
   - Contenido y logica versionados en repositorio.
   - Rollback por commit para incidentes de presentacion o seguridad.

## 11. Relacion con CIS Controls, NIST 800-53 y Zero Trust
El proyecto traduce controles de seguridad a decisiones concretas de frontend:

1. CIS Controls v8 (alineacion practica):
   - Harden de configuracion del entorno web (CSP, cabeceras, minimizacion de origenes).
   - Reduccion de superficie de software y dependencias.
   - Respuesta basada en evidencia a riesgos documentados (`SECURITY_REVIEW.md`).
2. NIST 800-53 (mapeo conceptual):
   - AC/SC: restriccion de acceso a recursos y politicas de contenido.
   - SI: tratamiento de entradas no confiables (sanitizacion y validacion).
   - AU/CM: trazabilidad por versionado y gestion de cambios en repositorio.
3. Zero Trust en capa web:
   - "Never trust input": URL params y Markdown no se confian.
   - "Least privilege": CSP minimiza capacidades del cliente.
   - "Assume breach": aislamiento de enlaces externos y politicas anti-inyeccion.

## 12. Diagrama textual de arquitectura

```text
                      +--------------------------------------+
                      |         Usuario / Navegador          |
                      +-------------------+------------------+
                                          |
                                          | HTTPS GET
                                          v
                  +----------------------------------------------+
                  |     Hosting estatico (GitHub Pages/CDN)      |
                  |  index.html | blog.html | post.html | assets |
                  +-------------------+--------------------------+
                                      |
                        Carga CSS/JS locales permitidos por CSP
                                      |
        +-----------------------------+-----------------------------+
        |                                                           |
        v                                                           v
+------------------------------+                      +------------------------------+
|  Capa global UI (site.js)    |                      |      Capa funcional          |
| - Tema dark por defecto       |                      |  index.js / blog.js /        |
| - Toggle de tema              |                      |  markdown.js                 |
| - Footer social SVG           |                      +---------------+--------------+
+---------------+---------------+                                      |
                |                                                      |
                |                                                      |
                |                                    +-----------------+------------------+
                |                                    |                                    |
                |                                    v                                    v
                |                     +---------------------------+          +--------------------------+
                |                     |   Blog pipeline           |          | Form pipeline            |
                |                     | - blog/*.md               |          | - formulario contacto    |
                |                     | - blog/posts.json fallback |          | - POST a Formspree       |
                |                     | - parse + sort             |          | - honeypot + validacion  |
                |                     +-------------+-------------+          +------------+-------------+
                |                                   |                                    |
                |                                   v                                    v
                |                     +---------------------------+          +--------------------------+
                |                     |  post.html + markdown.js  |          |  Endpoint externo        |
                |                     |  marked -> sanitizacion   |          |  https://formspree.io    |
                |                     |  -> DOM seguro            |          +--------------------------+
                |                     +---------------------------+
                |
                v
      +-------------------------------+
      | Controles transversales       |
      | CSP | nosniff | frame deny    |
      | referrer policy | permissions |
      +-------------------------------+
```

---

## Conclusiones de arquitectura
SEC_ARCHITECT implementa una arquitectura estatico-dinamica controlada: dinamica en experiencia de usuario y publicacion de contenido, estatica en despliegue y operacion. Esta combinacion permite bajo costo operativo, alta trazabilidad y un perfil de riesgo reducido frente a arquitecturas web complejas, manteniendo alineacion con practicas de seguridad de nivel empresarial.
