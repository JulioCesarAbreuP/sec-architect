# Informe de Validación de Seguridad — Front Door (2026-04-04)

**1. Content-Security-Policy (CSP) activa:**
- La cabecera CSP incluye:
  - `trusted-types defaultPolicy` y `require-trusted-types-for 'script'`.
  - Directiva `script-src` con nonce rotativo (verificado en la respuesta y en los scripts inline/externos).
  - Todos los recursos críticos (JS/CSS) cargados con atributo `integrity` y verificados por SRI.

**2. Headers de seguridad presentes:**
- `Strict-Transport-Security` (HSTS): activa, forzando HTTPS y subdominios.
- `X-Frame-Options`: presente y en modo `DENY`.
- `Referrer-Policy`: presente y en modo `strict-origin-when-cross-origin`.
- `Permissions-Policy`: presente, restringiendo geolocalización, cámara y micrófono.
- `Cross-Origin-Opener-Policy` (COOP): presente y en modo `same-origin`.
- `Cross-Origin-Embedder-Policy` (COEP): presente y en modo `require-corp`.
- `Cross-Origin-Resource-Policy` (CORP): presente y en modo `same-origin`.

**3. Validación de reglas y funcionamiento:**
- Métodos HTTP permitidos: solo GET, HEAD y OPTIONS responden correctamente; POST, PUT, DELETE, TRACE y CONNECT son bloqueados (HTTP 403/405).
- WAF: reglas de detección de bots y request smuggling activas y auditadas en los logs.
- El sitio responde correctamente a peticiones legítimas y la navegación no se ve afectada tras el hardening.

**Estado:**
- ✅ Validación completa y satisfactoria. El hardening avanzado está activo y operativo detrás de Front Door.
- Se recomienda mantener la auditoría semanal y revisar logs de WAF periódicamente.
