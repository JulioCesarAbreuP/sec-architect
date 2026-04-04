# Evidencia LCP (< 2.5s) - 2026-04-04

Fecha de validacion: 2026-04-04 19:28:51 +02:00

## Scope

Se validaron las rutas principales para evitar cierre falso basado solo en home:

- /index.html
- /blog.html
- /post.html?post=identidad-vs-cuenta.md

## Metodo

- Servidor local: `python -m http.server 8041`
- Herramienta: Lighthouse (categoria performance)
- Navegador: Google Chrome

## Resultados

| Ruta | Performance | LCP (ms) | FCP (ms) | Cumple LCP < 2500ms |
| --- | ---: | ---: | ---: | --- |
| /index.html | 100 | 1501.53 | 1501.53 | Si |
| /blog.html | 99 | 1697.50 | 1499.75 | Si |
| /post.html?post=identidad-vs-cuenta.md | 75 | 1830.68 | 1657.73 | Si |

## Artefactos JSON

- docs/evidence/lcp-before-index.json
- docs/evidence/lcp-before-blog.json
- docs/evidence/lcp-before-post.json

## Conclusiones

Objetivo del roadmap validado: todas las superficies criticas evaluadas quedan por debajo de 2.5s de LCP en Lighthouse.