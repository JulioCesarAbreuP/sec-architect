# THREAT MODEL - SEC_ARCHITECT

## 0. Contexto arquitectonico y alcance
SEC_ARCHITECT es un sitio estatico orientado a seguridad empresarial, publicado en GitHub Pages, con dos capacidades dinamicas en cliente:
- Render de blog Markdown en navegador ([post.html](post.html)) usando [markdown.js](markdown.js).
- Envio de formulario de contacto hacia Formspree desde [index.html](index.html) y [index.js](index.js).

Este modelo cubre:
- Frontend estatico (HTML/CSS/JS/SVG).
- Flujo de contenido del blog basado en archivos Markdown en [blog](blog).
- Integraciones externas declaradas (Google Fonts, Formspree).
- Controles de seguridad en cliente (CSP por meta y restricciones de navegador).

Fuera de alcance directo:
- Infraestructura interna de GitHub Pages y Formspree (solo se modela su riesgo de dependencia).
- Seguridad del endpoint de correo final receptor en Formspree.

---

## 1. Activos protegidos
### 1.1 Activos de informacion
1. Integridad del contenido publico del sitio (mensajes, arquitectura, reputacion tecnica).
2. Integridad del contenido Markdown del blog y metadatos asociados.
3. Datos enviados en formulario (empresa, correo corporativo, mensaje).
4. Credibilidad de marca SEC_ARCHITECT y confianza del visitante.

### 1.2 Activos tecnicos
1. Codigo fuente estatico en repositorio (HTML, JS, CSS, SVG, Markdown).
2. Politicas de seguridad de cliente (CSP, Referrer-Policy, Permissions-Policy).
3. Cadena de dependencias de frontend (CDN de fuentes, libreria de Markdown).
4. Configuracion de publicaciones GitHub Pages.

### 1.3 Propiedades a proteger
1. Confidencialidad: limitar fuga de datos de formulario y metadatos de navegacion.
2. Integridad: prevenir inyeccion de contenido, defacement y manipulacion del DOM.
3. Disponibilidad: mantener servicio publico accesible y funcional.
4. Trazabilidad: conservar capacidad de detectar/reportar incidentes via issues y revision de cambios.

---

## 2. Actores de amenaza
### 2.1 Externos
1. Atacante oportunista web: busca XSS, inyeccion DOM, abuso de formularios.
2. Atacante de cadena de suministro: intenta comprometer CDN o dependencias frontend.
3. Atacante de reputacion: defacement, suplantacion de contenido o phishing sobre la marca.
4. Scrapers y bots agresivos: abuso de formulario, crawling intensivo, spam.

### 2.2 Internos o semi-internos
1. Colaborador con permisos de commit que introduce cambios inseguros.
2. Contribuidor externo con PR malicioso (payload en Markdown, JS, SVG, links).
3. Error humano en mantenimiento (relajacion de CSP, inclusion de inline script inseguro).

### 2.3 Automatizados
1. Bots de spam sobre endpoint de contacto.
2. Escaneres automatizados de vulnerabilidades para detectar CSP debil o XSS.
3. Recolectores de datos (emails, estructura interna, endpoints de terceros).

---

## 3. Superficies de ataque
1. Documentos HTML en raiz y subrutas del blog ([index.html](index.html), [blog.html](blog.html), [post.html](post.html), [blog/index.html](blog/index.html)).
2. Scripts cliente ([index.js](index.js), [blog.js](blog.js), [markdown.js](markdown.js), [assets/js/site.js](assets/js/site.js)).
3. Pipeline de render Markdown a HTML en cliente ([markdown.js](markdown.js)).
4. Parametros URL de lectura de post (query parameter post).
5. Formulario y envio a Formspree en [index.html](index.html).
6. Recursos SVG locales en [assets/icons](assets/icons) y [assets/favicon.svg](assets/favicon.svg).
7. Dependencias externas permitidas por CSP (fonts y endpoint de formulario).
8. Publicacion estatica en GitHub Pages (hosting sin logica backend propia).

---

## 4. STRIDE aplicado al proyecto
## 4.1 Diagrama textual de flujo (DFD simplificado)
```text
[Usuario/Navegador]
   | GET HTML/CSS/JS/SVG
   v
[GitHub Pages - sitio estatico]
   | entrega: index/blog/post + scripts
   v
[Cliente JS]
   |--(A) fetch Markdown --> [/blog/*.md]
   |--(B) parse + sanitize --> render DOM
   |--(C) submit formulario --> [Formspree]
```

## 4.2 STRIDE por flujo
| Flujo / Componente | S (Spoofing) | T (Tampering) | R (Repudiation) | I (Info Disclosure) | D (DoS) | E (Elevation) |
|---|---|---|---|---|---|---|
| Entrega estatico GitHub Pages | Suplantacion de dominio si usuario cae en typo-squatting | Defacement por commit malicioso | Limitada trazabilidad si no se revisa historial | Exposicion de estructura publica del sitio | Saturacion por trafico masivo | No aplica directo (sin backend) |
| Render Markdown en cliente | Suplantacion de autoria del contenido | Inyeccion en .md o transformacion DOM | Cambios no auditados si no hay control de PR | Exfiltracion via links maliciosos | Payloads pesados degradan UX | XSS puede escalar a ejecucion en origen |
| Formulario a Formspree | Suplantacion de remitente | Manipulacion de payload de formulario | Usuario niega envio (sin evidencia robusta) | Fuga de correo/mensaje por malas politicas | Spam o flooding del endpoint | No aplica privilegios del servidor local |
| SVG locales | Favicon/logo spoofing visual | SVG con contenido activo malicioso | Dificil atribucion de cambios sin code review | Data URI o referencias externas en SVG | Render costoso de SVG patologico | Script en SVG (si permitido por navegador/politica) |
| Dependencias CDN | Suplantacion de recurso si supply chain comprometida | Archivo remoto alterado | Difusa atribucion de incidente tercero | Telemetria de terceros por carga externa | Fallo de CDN impacta disponibilidad | JS remoto alterado podria ejecutar codigo |

### 4.3 Riesgos STRIDE mas relevantes
1. Tampering + Elevation en pipeline Markdown (si sanitizacion falla).
2. Information Disclosure en formulario y referers externos.
3. Denial of Service operativo por dependencia de terceros (Formspree/CDN).
4. Spoofing de identidad de sitio por dominios similares o phishing clonado.

---

## 5. Matriz MITRE ATT&CK relevante
| Tactica ATT&CK | Tecnica (ID) | Relevancia en SEC_ARCHITECT | Señales/indicadores | Mitigacion principal |
|---|---|---|---|---|
| Initial Access | Drive-by Compromise (T1189) | Payload web via contenido malicioso/tercero | Comportamiento JS anomalo en cliente | CSP estricta, SRI, sanitizacion |
| Initial Access | Phishing: Spearphishing Link (T1566.002) | Clones del sitio para captar leads | Dominios similares, enlaces sospechosos | Branding consistente, TLS, awareness |
| Execution | Command and Scripting Interpreter: JavaScript (T1059.007) | XSS en render Markdown o DOM | Inyeccion en HTML renderizado | Sanitizacion allowlist + CSP sin inline |
| Persistence | Web Shell (T1505.003) | Bajo en sitio estatico, pero posible defacement persistente por commit | Cambios no autorizados en repo | Proteccion de ramas, revision PR |
| Defense Evasion | Obfuscated/Compressed Files (T1027) | JS ofuscado en contribuciones maliciosas | Commits con blobs opacos | Politica de revision y lint |
| Credential Access | Input Capture (T1056) | Formularios falsos o manipulado DOM | Campos inesperados, endpoint alterado | Integridad de codigo, CSP, enlaces seguros |
| Collection | Data from Information Repositories (T1213) | Scraping de contenido y correos visibles | Trafico automatizado reiterado | Rate-limit en edge futuro, minimizacion datos |
| Exfiltration | Exfiltration Over Web Service (T1567) | Script malicioso enviando datos a externo | Conexiones no autorizadas | connect-src restrictivo |
| Impact | Defacement (T1491.001) | Alteracion de contenido publico | Cambios visuales no aprobados | Control de cambios y monitoreo |
| Impact | Endpoint DoS (T1499) | Saturacion de recursos externos/form | Errores de envio y latencia | Fallback UX y observabilidad |

Nota: ATT&CK se aplica aqui como marco de amenazas web/cliente, no como compromiso de endpoint corporativo completo.

---

## 6. Analisis de amenazas del blog dinamico
### 6.1 Riesgos principales
1. XSS almacenado en Markdown: insercion de HTML o URLs peligrosas en posts.
2. Path manipulation en parametro post de URL.
3. Inyeccion DOM por uso de innerHTML sin sanitizacion adecuada.
4. Dependencia de parser Markdown externo (supply chain).
5. Denegacion de servicio funcional por Markdown malformado o excesivo.

### 6.2 Controles aplicados
1. Validacion del parametro post para permitir solo patrones acotados.
2. Sanitizacion de HTML generado con enfoque allowlist antes de render.
3. Restricciones CSP con script-src self y sin inline script.
4. Controles de atributos/enlaces para impedir javascript: y esquemas peligrosos.

### 6.3 Gaps/futuro
1. Endurecer pruebas automatizadas de sanitizacion con corpus de payloads XSS.
2. Versionado estricto y preferencia por librerias locales con hash verificado.
3. Pipeline de pre-validacion de Markdown antes de merge en repositorio.

---

## 7. Analisis de amenazas del formulario
### 7.1 Riesgos principales
1. Spam automatizado y flooding del endpoint de contacto.
2. Inyeccion de contenido en campos (si el backend receptor no valida).
3. Exfiltracion de datos por endpoint no previsto.
4. Abuso de reputacion del dominio para campañas maliciosas.

### 7.2 Controles aplicados
1. Honeypot (_hp_filter) para frenar bots basicos.
2. Restricciones CSP en connect-src y form-action hacia dominio permitido.
3. Longitud maxima y tipos HTML en campos de entrada.
4. Modo estatico: no hay backend propio expuesto en el sitio.

### 7.3 Gaps/futuro
1. Validacion y rate-limit adicional en capa edge/proxy (si migracion futura).
2. Reglas anti-abuso por IP/fingerprint en servicio receptor.
3. Telemetria de envios fallidos y patrones de automatizacion.

---

## 8. Analisis de amenazas del uso de SVG
### 8.1 Riesgos
1. SVG malicioso con referencias externas o contenido activo.
2. Inyeccion de eventos embebidos en SVG si se incorporan sin control.
3. Riesgo de spoofing visual por sustitucion de iconos.

### 8.2 Controles aplicados
1. SVGs oficiales locales en [assets/icons](assets/icons), sin carga externa.
2. Uso de inline SVG controlado en plantilla propia.
3. CSP restrictiva que limita ejecucion de scripts.

### 8.3 Gaps/futuro
1. Regla de contribucion: prohibir atributos on* y referencias externas en SVG.
2. Validacion automatica de SVG en CI (lint de seguridad de assets).

---

## 9. Riesgos derivados de GitHub Pages
1. Sin control total de cabeceras HTTP server-side (limitacion inherente), mitigado parcialmente con meta policies.
2. Ausencia de WAF/rate limiting nativo para formularios (depende de tercero).
3. Dependencia de disponibilidad de plataforma y CDN de terceros.
4. Menor visibilidad de logs de acceso detallados frente a un reverse proxy propio.
5. Riesgo de publicacion accidental de contenido sensible si no hay governance de repositorio.

### 9.1 Implicacion arquitectonica
GitHub Pages es adecuado para contenido estatico endurecido, pero para requisitos avanzados (WAF, headers server-side estrictas, anti-bot, observabilidad granular) conviene una capa adicional (Front Door/App Gateway/CDN enterprise).

---

## 10. Mitigaciones aplicadas y mitigaciones futuras
### 10.1 Mitigaciones aplicadas (estado actual)
1. CSP de alta restriccion en paginas principales.
2. Eliminacion progresiva de inline JS y reduccion de superficies DOM inseguras.
3. Sanitizacion del contenido renderizado del blog Markdown.
4. Restricciones de conexiones y accion de formularios al dominio autorizado.
5. Uso de iconografia local y recursos propios para reducir dependencia externa.
6. Politicas de seguridad documentadas en [SECURITY.md](SECURITY.md) y [SECURITY_REVIEW.md](SECURITY_REVIEW.md).

### 10.2 Mitigaciones futuras recomendadas
1. Migrar cabeceras de seguridad a nivel edge/proxy (CSP, HSTS, COOP/CORP) en vez de meta-only.
2. SRI sistematico para todo recurso externo restante y preferencia por auto-hosting.
3. Pipeline de CI con:
   - Analisis de secretos
   - Lint de seguridad frontend
   - Test de payloads XSS para Markdown
   - Validacion de SVGs
4. Controles de rama protegida y revisiones obligatorias para cambios en HTML/JS/CSP.
5. Observabilidad operativa: monitoreo de disponibilidad, errores JS y tasas de envio de formulario.
6. Estrategia de respuesta a incidentes con runbooks para defacement/XSS/spam.

---

## 11. Priorizacion de riesgo (resumen ejecutivo tecnico)
| Riesgo | Probabilidad | Impacto | Nivel | Prioridad |
|---|---|---|---|---|
| XSS via Markdown si sanitizacion se degrada | Media | Alta | Alto | P1 |
| Abuso de formulario (spam/flood) | Alta | Media | Alto | P1 |
| Compromiso de dependencia externa | Baja-Media | Alta | Alto | P1 |
| Defacement por cambio malicioso en repo | Media | Alta | Alto | P1 |
| Fuga de metadatos por politicas laxas | Media | Media | Medio | P2 |
| Caida por dependencia externa | Media | Media | Medio | P2 |

---

## 12. Conclusion arquitectonica
SEC_ARCHITECT presenta una postura de seguridad madura para un sitio estatico: minimiza superficie activa, encapsula la dinamica en cliente con controles de entrada/salida, y restringe la ejecucion mediante politicas de navegador. El vector mas sensible sigue siendo el pipeline de render de contenido (Markdown->HTML) y la dependencia de servicios externos para contacto y recursos. La evolucion recomendada es mover controles al edge enterprise, automatizar pruebas de seguridad en CI y mantener gobierno estricto de cambios para sostener resiliencia operativa bajo principios Zero Trust.
