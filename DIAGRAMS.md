# DIAGRAMS - SEC_ARCHITECT

Este documento centraliza diagramas tecnicos en formato ASCII y guia de exportacion a formatos visuales.

## 1) Diagramas ASCII de arquitectura

### Arquitectura logica general
```text
[User Browser]
    |
    | HTTPS GET
    v
[GitHub Pages Static Origin]
    |-- index.html + assets/css + assets/js
    |-- blog.html + blog.js
    |-- post.html + markdown.js
    |-- blog/*.md + blog/posts.json + blog/assets/*
    |
    +--> [Formspree API] (POST contact form)
```

### Componentes de cliente
```text
index.js          -> formulario (validacion/submit)
assets/js/site.js -> tema global + toggle + footer global
blog.js           -> discovery/listado dinamico de posts
markdown.js       -> fetch markdown + parse + sanitizacion + render
```

## 2) Diagramas de flujo del blog dinamico
```text
[blog.html]
   -> load blog.js
   -> detectar lista de posts (dir listing o posts.json)
   -> fetch cada .md
   -> extraer front matter (title/date)
   -> ordenar por date DESC
   -> render enlaces a post.html?post=<file>.md
```

```text
[post.html]
   -> leer query param post
   -> validar/sanitizar nombre de archivo
   -> fetch blog/<post>.md
   -> marked parse markdown
   -> sanitizacion HTML allowlist
   -> render contenido final
```

## 3) Diagrama de interaccion CSP -> navegador
```text
[HTML response]
   -> meta CSP definida
      -> Browser CSP Engine
         -> permite recursos 'self' y origenes autorizados
         -> bloquea scripts no autorizados
         -> bloquea mixed content
         -> restringe form-action/connect-src
```

## 4) Diagrama de flujo del formulario
```text
[User Input]
   -> validacion HTML5 (required/maxlength/type)
   -> honeypot _hp_filter
   -> submit via fetch en index.js
   -> POST a Formspree endpoint permitido por CSP
   -> respuesta OK/ERROR
   -> feedback visual en UI
```

## 5) Diagrama de amenazas STRIDE
```text
S (Spoofing): enlaces/recursos externos falsificados
T (Tampering): manipulacion de markdown o assets
R (Repudiation): falta de trazabilidad en cambios
I (Information Disclosure): fuga via referrer o errores verbosos
D (Denial of Service): dependencia de servicios externos
E (Elevation of Privilege): XSS -> ejecucion de acciones no previstas

Mitigaciones clave: CSP estricta, sanitizacion markdown, rel noopener,
validaciones de input, control de dependencias, gobernanza documental.
```

## 6) Instrucciones para generar diagramas .drawio
1. Abrir draw.io o diagrams.net.
2. Crear un diagrama por flujo (arquitectura, blog, formulario, CSP).
3. Usar capas separadas: UI, seguridad, integraciones externas.
4. Etiquetar trust boundaries y puntos de control.
5. Guardar fuente editable en carpeta `docs/diagrams/` (futuro).

## 7) Instrucciones para exportar SVG
1. Desde draw.io: File -> Export as -> SVG.
2. Activar opcion de texto editable solo si no afecta seguridad/portabilidad.
3. Optimizar SVG (sin scripts embebidos).
4. Validar que no incluya elementos activos inseguros.
5. Versionar nombre con fecha o version semantica.

## Convencion sugerida de nombres
- `arch-overview-v1.drawio`
- `blog-flow-v1.drawio`
- `csp-browser-flow-v1.drawio`
- `form-flow-v1.drawio`
- `threat-stride-v1.drawio`
