# Política de Seguridad (SECURITY.md)

Este proyecto implementa una arquitectura de defensa estructural orientada a minimizar superficie de ataque, garantizar la integridad del contenido y reforzar la resiliencia operativa del sitio.
El código está endurecido siguiendo principios de OWASP, CIS Controls v8 y NIST 800-53.

## 1. Controles Técnicos Implementados (Hardening)

### 1.1 Content Security Policy (CSP) de Alta Restricción
Basada en el código del proyecto:

- default-src 'self'
- script-src 'self'
- style-src 'self' https://fonts.googleapis.com
- font-src 'self' https://fonts.gstatic.com
- img-src 'self' data:
- connect-src 'self' https://formspree.io
- form-action 'self' https://formspree.io
- object-src 'none'
- frame-ancestors 'none'
- base-uri 'none'
- upgrade-insecure-requests
- block-all-mixed-content

Impacto:
Mitiga XSS, clickjacking, inyección de recursos externos y exfiltración de datos.

### 1.2 Cabeceras de Seguridad Activas
El proyecto incluye:

- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: geolocation=(), microphone=(), camera=()

Impacto:
Prevención de MIME sniffing, bloqueo de iframes, reducción de fuga de metadatos y restricción de APIs sensibles.

### 1.3 Sanitización y Control del DOM
El contenido Markdown del blog se procesa mediante conversión segura.

Se recomienda sanitización adicional en post.html para evitar XSS basado en contenido.

### 1.4 Transporte Seguro
upgrade-insecure-requests fuerza HTTPS.

GitHub Pages sirve el sitio con TLS moderno.

### 1.5 Protección de Formularios
Formspree está limitado por CSP (connect-src y form-action).

Se incluye honeypot _hp_filter para evitar bots.

No se permite carga de scripts externos.

## 2. Reporte de Vulnerabilidades
Si identifica un fallo crítico (bypass de CSP, XSS, CSRF, inyección DOM, fuga de datos o mala configuración):

Abra un Issue con la etiqueta [SECURITY].

Si el hallazgo implica riesgo de explotación activa o exposición sensible, utilice reporte privado mediante GitHub Security Advisories cuando esté disponible en el repositorio.

Incluya:

- Vector de ataque
- Evidencia
- Reproducción
- Mitigación sugerida (OWASP, NIST o CIS)

## 2.1 Ventanas objetivo de respuesta

- Triage inicial: dentro de 72 horas.
- Clasificación de severidad: dentro de 5 días hábiles.
- Plan de mitigación para severidad alta/crítica: dentro de 10 días hábiles.

Estas ventanas son objetivos operativos y pueden variar según complejidad técnica.

## 3. Pull Requests y Contribuciones
Se valoran especialmente PRs que:

- Incrementen la puntuación en auditorías de Lighthouse Security
- Mejoren la sanitización del contenido Markdown
- Refuercen la CSP sin romper funcionalidad
- Añadan validaciones adicionales al formulario
- Reduzcan dependencias externas
- Mejoren la resiliencia ante fallos de servicios externos

## 4. Relación con Certificaciones Microsoft
Este repositorio sirve como entorno de práctica para arquitecturas seguras alineadas con:

- AZ-305 - Diseño de infraestructura resiliente
- SC-300 - Zero Trust e identidad
- AZ-104 - Seguridad operativa en Azure
