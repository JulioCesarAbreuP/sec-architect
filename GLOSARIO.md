# GLOSARIO TÉCNICO — SEC_ARCHITECT

> Definiciones técnicas de los términos clave utilizados en el proyecto SEC_ARCHITECT.
> Cada término incluye definición técnica, riesgos asociados y relevancia específica
> para este proyecto.

---

## CSP — Content Security Policy

**Definición técnica**:
Mecanismo de seguridad implementado como cabecera HTTP (o meta tag) que permite al
propietario del sitio web declarar qué orígenes de contenido (scripts, estilos, imágenes,
fuentes, conexiones) el navegador debe considerar válidos. El navegador aplica esta política
como control de acceso a recursos en el contexto del documento cargado.

La política se define mediante directivas (`script-src`, `style-src`, `connect-src`, etc.)
con valores que pueden ser orígenes (`https://cdn.example.com`), palabras clave
(`'self'`, `'none'`, `'unsafe-inline'`) o hashes/nonces de recursos específicos.

**Riesgos asociados**:
- CSP mal configurada puede ser más peligrosa que no tener CSP (falsa sensación de seguridad).
- `unsafe-inline` anula protección contra XSS inline.
- `unsafe-eval` permite ejecución de código dinámico (`eval`, `new Function`).
- Directivas demasiado permisivas (`*`, `https:`) eliminan la protección efectiva.
- `frame-ancestors` no funciona vía meta tag (solo via cabecera HTTP).

**Relevancia en SEC_ARCHITECT**:
La CSP es el control de seguridad central del proyecto. Implementada como meta tag en cada
página HTML, sin `unsafe-inline` ni `unsafe-eval`. Diferenciada por página según los recursos
cargados. Limitación conocida: GitHub Pages no permite cabeceras HTTP custom, por lo que
`frame-ancestors` y `report-to` no son efectivos hasta migrar a Front Door o Cloudflare.

---

## Zero Trust

**Definición técnica**:
Paradigma de seguridad (formalizado en NIST SP 800-207) que elimina la confianza implícita
basada en ubicación de red o identidad de dispositivo. Los tres principios fundamentales son:
1. **Verificar siempre**: autenticar y autorizar explícitamente cada request.
2. **Mínimo privilegio**: acceso solo a lo estrictamente necesario.
3. **Asumir brecha**: diseñar como si el adversario ya estuviera dentro del perímetro.

**Riesgos asociados**:
- Implementación parcial de Zero Trust puede dar falsa seguridad.
- Sin registro y monitorización activa, el principio "asumir brecha" pierde valor operativo.
- En entornos estáticos, Zero Trust aplica principalmente al plano de contenido, no de identidad.

**Relevancia en SEC_ARCHITECT**:
Zero Trust guía el diseño de cada componente: no se confía en el contenido Markdown, no se
confía en los parámetros URL, no se confía en los CDN externos (SRI), no se confía en los
formularios (honeypot + CSP). El principio "asumir brecha" justifica el sanitizador de
Markdown aunque los posts sean editoriales propios.

---

## IG1–IG3 — Implementation Groups (CIS Controls v8)

**Definición técnica**:
Los CIS Controls v8 organizan sus 18 controles en tres grupos de implementación según
la madurez y recursos de la organización:

- **IG1 (Higiene básica)**: controles esenciales para toda organización. Protección
  mínima contra ataques conocidos. 56 salvaguardas fundamentales.
- **IG2 (Fundamentos)**: extiende IG1 para organizaciones con más complejidad técnica
  y datos sensibles. 74 salvaguardas adicionales.
- **IG3 (Organización)**: controles avanzados para organizaciones con alta exposición
  y equipos de seguridad dedicados. 23 salvaguardas adicionales.

**Riesgos asociados**:
- Implementar controles de IG3 sin cubrir IG1 genera brechas críticas.
- La categorización incorrecta del nivel de implementación puede dejar controles
  importantes fuera del alcance.

**Relevancia en SEC_ARCHITECT**:
El proyecto implementa controles de IG1 e IG2: inventario de dependencias (CIS 2),
configuración segura (CIS 4), protección del contenido web (CIS 16). El nivel IG3
(monitorización continua, gestión de incidentes formal) está pendiente de implementar
cuando el sitio migre a infraestructura con capacidad de logging.

---

## Sanitización

**Definición técnica**:
Proceso de transformación del input recibido (por el usuario, por un tercero o por un
archivo externo) para eliminar o neutralizar elementos potencialmente maliciosos antes
de su procesamiento o renderizado. Existen dos enfoques principales:

- **Allowlist (lista blanca)**: se permite solo lo explícitamente declarado como seguro.
  Todos los elementos no listados son eliminados. Enfoque más seguro.
- **Denylist (lista negra)**: se bloquea lo explícitamente declarado como peligroso.
  Más fácil de eludir (un atacante puede encontrar vectores no listados).

**Riesgos asociados**:
- Sanitización incompleta deja vectores de bypass (atributos de eventos, URLs `data:`,
  elementos SVG con scripts, `<math>` con handlers).
- Sanitización del lado del cliente puede ser deshabilitada o evitada en el DOM.
- Sin sanitización en el servidor, el cliente es la última línea de defensa.

**Relevancia en SEC_ARCHITECT**:
`markdown.js` implementa un sanitizador de allowlist artesanal sobre el HTML generado
por marked.js. Permite solo etiquetas de contenido semántico y bloquea `<script>`,
`<iframe>`, eventos inline (`onerror`, `onload`) y URLs `javascript:`. Riesgo residual:
cobertura inferior a DOMPurify (pendiente de integración).

---

## DOMPurify

**Definición técnica**:
Librería JavaScript client-side de sanitización de HTML y SVG. Implementa una allowlist
de etiquetas y atributos probada y mantenida activamente. Utiliza el DOM del navegador
para parsear el HTML y luego elimina los elementos no permitidos, lo que garantiza
coherencia con el comportamiento real del navegador ante el contenido.

Características clave:
- Actualización continua ante nuevos vectores de bypass XSS documentados.
- API simple: `DOMPurify.sanitize(htmlString)`.
- Configurable con opciones `ALLOWED_TAGS`, `ALLOWED_ATTR`, `FORCE_BODY`.
- Usado en producción por Mozilla, Atlassian y otros proyectos de alto perfil.

**Riesgos asociados**:
- Como dependencia externa, introduce un riesgo de supply chain si se carga desde CDN sin SRI.
- Configuración incorrecta (demasiado permisiva) puede no proteger adecuadamente.

**Relevancia en SEC_ARCHITECT**:
DOMPurify está identificado como mejora crítica pendiente en `SECURITY_REVIEW.md` y
`ROADMAP.md`. El sanitizador artesanal actual en `markdown.js` es funcional pero con
cobertura inferior. La integración require añadir DOMPurify como dependencia con SRI.

---

## MITRE ATT&CK

**Definición técnica**:
Marco de conocimiento (Adversarial Tactics, Techniques & Common Knowledge) mantenido
por MITRE Corporation que documenta las tácticas, técnicas y procedimientos (TTPs) de
actores de amenaza reales observados en ataques documentados. Organizado en matrices
para distintos dominios: Enterprise, Mobile, ICS, Cloud y PRE-ATT&CK.

Cada técnica incluye: descripción, plataformas afectadas, detecciones, mitigaciones
y referencias a grupos de amenaza conocidos que la utilizan.

**Riesgos asociados**:
- No cubrir técnicas de MITRE ATT&CK relevantes para el contexto propio puede dejar
  vectores de ataque sin controles asociados.
- El marco es descriptivo, no prescriptivo; requiere adaptación al contexto.

**Relevancia en SEC_ARCHITECT**:
`THREAT_MODEL.md` mapea las amenazas del sitio a técnicas de MITRE ATT&CK for Web:
T1189 (Drive-by Compromise via XSS), T1059.007 (Client-Side Script Execution),
T1567 (Exfiltration via Web Service) y T1584 (Compromise Infrastructure / CNAME takeover).
Cada técnica tiene mitigación documentada y trazada a controles implementados.

---

## STRIDE

**Definición técnica**:
Metodología de modelado de amenazas desarrollada por Microsoft que categoriza las
amenazas en seis tipos: Spoofing (suplantación de identidad), Tampering (manipulación
de datos), Repudiation (negación de acciones), Information Disclosure (fuga de información),
Denial of Service (interrupción del servicio) y Elevation of Privilege (escalada de privilegios).

Se aplica sobre un Diagrama de Flujo de Datos (DFD) del sistema para identificar amenazas
sistemáticamente en cada elemento (proceso, almacén de datos, flujo de datos y entidad externa).

**Riesgos asociados**:
- STRIDE sin DFD preciso genera análisis superficial con amenazas mal catalogadas.
- No cubre amenazas de supply chain de forma nativa (complementar con SLSA o S2C2F).

**Relevancia en SEC_ARCHITECT**:
`THREAT_MODEL.md` aplica STRIDE sobre el DFD del sitio, identificando 12 amenazas
categorizadas con su estado de mitigación. Amenazas de mayor relevancia: Tampering
en archivos Markdown (T) y Elevation of Privilege via XSS (E).

---

## WAF — Web Application Firewall

**Definición técnica**:
Dispositivo lógico (hardware, software o servicio cloud) que inspecciona el tráfico HTTP/S
entre el cliente y el servidor de aplicación, aplicando reglas para detectar y bloquear
ataques web conocidos: SQLi, XSS, RFI/LFI, path traversal, CSRF, entre otros.

Los WAF modernos (OWASP ModSecurity, Azure WAF, Cloudflare WAF) implementan el OWASP
Core Rule Set (CRS) como base de reglas y permiten reglas personalizadas.

**Riesgos asociados**:
- Un WAF mal configurado puede bloquear tráfico legítimo (falsos positivos).
- Un WAF no es sustituto de código seguro: es una capa de defensa adicional.
- Los WAFs basados en firmas pueden ser evadidos con técnicas de evasión avanzadas.

**Relevancia en SEC_ARCHITECT**:
Actualmente no hay WAF (GitHub Pages no provee uno). La ausencia de WAF es aceptada
porque el sitio es estático y no tiene backend vulnerable a SQLi o RCE. La incorporación
de un WAF está planificada para cuando el sitio se despliegue detrás de Azure Front Door.

---

## Anycast

**Definición técnica**:
Técnica de enrutamiento de red en la cual una misma dirección IP es anunciada desde
múltiples puntos de presencia (PoPs) geográficamente distribuidos. El tráfico del cliente
es enrutado automáticamente al PoP más cercano geográficamente por los protocolos de
enrutamiento de Internet (BGP).

Utilizado por CDNs globales (Cloudflare, Akamai, Fastly) para minimizar latencia,
absorber ataques DDoS distribuidos y garantizar continuidad ante fallos de un PoP.

**Riesgos asociados**:
- Un atacante con capacidad de manipular BGP (BGP hijacking) puede redirigir tráfico
  anycast al PoP controlado por él.
- La transparencia sobre qué PoP responde puede ser limitada.

**Relevancia en SEC_ARCHITECT**:
GitHub Pages utiliza anycast en su CDN global. La migración planificada a Azure Front Door
también aprovecha anycast para reducción de latencia y resiliencia DDoS.

---

## CDN — Content Delivery Network

**Definición técnica**:
Red de servidores distribuidos geográficamente que almacenan copias en caché del contenido
estático (HTML, CSS, JS, imágenes) y los sirven desde el PoP más cercano al usuario.
Reduce latencia, aumenta disponibilidad y puede absorber picos de tráfico.

Los CDNs modernos añaden funcionalidades de seguridad: TLS en el edge, WAF, DDoS
mitigation, HTTP/3, rate limiting y gestión de cabeceras.

**Riesgos asociados**:
- Cache poisoning: un atacante manipula el contenido cacheado en el CDN.
- Supply chain: si el CDN sirve librerías de terceros (npm, jsDelivr), una
  versión comprometida afecta a todos los sitios que la referencian sin SRI.
- Dependencia de tercero: una caída del CDN afecta directamente al sitio.

**Relevancia en SEC_ARCHITECT**:
El sitio usa GitHub Pages como CDN para sus assets propios y jsDelivr como CDN para
marked.js. Este último está protegido con SRI. El riesgo de supply chain de CDN es
uno de los 10 riesgos documentados en `SECURITY_REVIEW.md`.

---

## Formspree

**Definición técnica**:
Servicio de backend-as-a-service para el procesamiento de formularios web estáticos.
Recibe enviós de formularios HTML via POST o fetch API y los almacena, reenvía por
email al propietario y opcionalmente activa integraciones (Slack, webhooks, Zapier).
Permite a sitios estáticos tener un formulario de contacto funcional sin servidor propio.

**Riesgos asociados**:
- Los datos del formulario son almacenados y procesados por un tercero (Formspree).
- Sin rate limiting propio en el cliente, el endpoint puede ser abusado por bots.
- La dependencia del servicio introduce un punto de fallo externo.
- En caso de brecha en Formspree, los datos históricos del formulario pueden quedar expuestos.

**Relevancia en SEC_ARCHITECT**:
El formulario de contacto de `index.html` delega en Formspree. Mitigaciones aplicadas:
honeypot anti-bot, CSP `connect-src` y `form-action` limitados a `formspree.io`,
validación client-side. El riesgo de datos en tercero es aceptado y documentado en
`SECURITY_REVIEW.md` (R04).

---

## GitHub Pages

**Definición técnica**:
Servicio de hosting estático gratuito de GitHub que sirve archivos HTML/CSS/JS
directamente desde un repositorio Git (rama `main`, `gh-pages` o carpeta `/docs/`).
Incluye TLS automático via Let's Encrypt, CDN global y dominio `*.github.io`.
No permite ejecución de código server-side ni configuración de cabeceras HTTP personalizadas.

**Riesgos asociados**:
- Sin cabeceras HTTP custom: CSP, HSTS, COOP y CORP solo son configurables de forma
  limitada vía meta tags.
- CNAME takeover: si el repo es eliminado y el DNS apunta a Pages, un atacante puede
  reclamar el subdominio.
- Sin logs de acceso disponibles para el propietario.
- Dependencia completa del SLA de GitHub (99.9% oficial).

**Relevancia en SEC_ARCHITECT**:
GitHub Pages es la infraestructura de producción actual del sitio. Sus limitaciones de
seguridad (cabeceras HTTP) están documentadas en `SECURITY_REVIEW.md` y son el principal
driver de la migración planificada a Azure Front Door en el `ROADMAP.md`.

---

## SVG Inline

**Definición técnica**:
Técnica de inclusión de gráficos vectoriales SVG directamente en el código HTML del
documento, en lugar de referenciarlos como archivos externos (`<img src="...svg">`).
El SVG inline se convierte en parte del DOM del documento y puede ser controlado y
animado con CSS y JavaScript del documento padre.

**Riesgos asociados**:
- Un SVG inline puede contener `<script>`, handlers de eventos (`onload`, `onclick`)
  y referencias externas (`<image href="...">`) que se ejecutan en el contexto del documento.
- Si el SVG proviene de input de usuario (subida de archivo, contenido de tercero),
  puede ser un vector de XSS.
- El CSS del SVG inline puede afectar al CSS del documento padre.

**Relevancia en SEC_ARCHITECT**:
Los iconos de LinkedIn y GitHub se implementan como SVG inline generados programáticamente
por `site.js` desde strings literales en el código fuente. No contienen scripts, eventos
ni referencias externas. El favicon (`assets/favicon.svg`) se carga como archivo (no inline)
y los navegadores modernos lo ejecutan en contexto aislado. Los SVGs de posts Markdown
están bloqueados por el sanitizador (no están en la allowlist).

---

## Hardening

**Definición técnica**:
Proceso de reducción de la superficie de ataque de un sistema mediante la eliminación o
restricción de funcionalidades no necesarias, la aplicación de configuraciones seguras
y la implementación de controles de seguridad adicionales sobre la configuración por defecto.

El hardening se guía frecuentemente por benchmarks de CIS (Center for Internet Security),
STIGs del DoD americano o guías de endurecimiento de fabricantes (OWASP, NIST).

**Riesgos asociados**:
- Hardening excesivo puede romper funcionalidades legítimas (p.ej., CSP demasiado restrictiva
  que bloquea recursos necesarios).
- Sin documentación del hardening aplicado, las configuraciones seguras pueden ser revertidas
  involuntariamente en futuras actualizaciones.

**Relevancia en SEC_ARCHITECT**:
El hardening del sitio es documentado en `SECURITY_REVIEW.md` e incluye: CSP sin
`unsafe-inline`, SRI en CDN, eliminación de scripts inline, sanitización de Markdown,
validación de parámetros URL, honeypot en formulario y metas de seguridad en todas las páginas.

---

## Resiliencia Operativa

**Definición técnica**:
Capacidad de un sistema para mantener sus funciones esenciales ante eventos adversos
(fallos de componentes, ataques, errores de configuración, indisponibilidad de terceros)
y recuperarse en un tiempo aceptable. En arquitectura de sistemas, se implementa mediante
redundancia, desacoplamiento, degradación funcional y fallbacks.

Marcos de referencia: NIST SP 800-160 Vol. 2 (Cyber Resiliency Engineering Framework),
ISO 22316 (Organizational Resilience).

**Riesgos asociados**:
- Dependencias de terceros sin fallback son puntos únicos de fallo.
- Sin monitorización, los fallos silenciosos pasan desapercibidos.
- La resiliencia diseñada para escenarios conocidos puede fallar ante black swans.

**Relevancia en SEC_ARCHITECT**:
La arquitectura del sitio maximiza la resiliencia estructural: sin backend que pueda caer,
sin base de datos que pueda corromperse, con fallbacks HTML estáticos para footer y tema,
con mensajes de error controlados ante fallos de CDN, Formspree o posts.json. Los escenarios
de fallo y sus respuestas están documentados en `ARCHITECTURE.md` y `TESTING.md`.

---

> Las definiciones de este glosario se organizan siguiendo una lógica conceptual
> inspirada en marcos como SABSA: cada término es definido en su contexto técnico
> (qué es), sus riesgos asociados (por qué importa) y su relevancia específica
> en SEC_ARCHITECT (cómo se aplica en este proyecto concreto).
