# GOVERNANCE — SEC_ARCHITECT

> Marco de gobernanza formal del proyecto SEC_ARCHITECT.
> Este documento define los principios, estándares y criterios que rigen
> el desarrollo, la seguridad y la evolución del proyecto.

---

## 1. Principios de Diseño del Proyecto

| Principio | Descripción |
|-----------|-------------|
| **Minimalismo funcional** | Solo existe lo necesario para cumplir el objetivo. Sin bloat. |
| **Legibilidad primero** | El código y el contenido deben ser comprensibles por un arquitecto senior en primera lectura. |
| **Trazabilidad** | Cada decisión técnica debe ser trazable a un principio de seguridad, diseño o negocio. |
| **Coherencia visual** | El estilo visual es invariante: modo oscuro, tipografía de sistema, paleta definida. |
| **Degradación elegante** | El sitio funciona sin JS, sin fuentes externas y con CSP máxima. |
| **Versionado como contrato** | Git es la fuente de verdad. Sin cambios fuera del ciclo de commit/PR. |

---

## 2. Principios de Seguridad

| Principio | Implementación en SEC_ARCHITECT |
|-----------|--------------------------------|
| **Mínimo privilegio** | CSP restrictiva; Permissions-Policy mínima; sin permisos innecesarios |
| **Defensa en profundidad** | Controles en transporte, contenido, DOM, formulario y enlace externo |
| **Fail-safe defaults** | Modo oscuro por defecto; CSP bloqueante por defecto; fallbacks sin JS |
| **No confiar en el input** | Sanitización de Markdown; validación regex de parámetros URL; honeypot |
| **Superficie de ataque mínima** | Sin backend, sin base de datos, sin servidor de aplicación |
| **Integridad verificable** | SRI en CDN; versionado Git de todos los assets |
| **Transparencia** | Documentación pública de controles, riesgos y decisiones |

---

## 3. Principios de Resiliencia

| Principio | Implementación |
|-----------|----------------|
| **Sin punto único de fallo de aplicación** | Sin backend; cualquier fallo es del CDN de GitHub, no del código |
| **Contenido versionado e inmutable** | Git como backup; cada commit es un snapshot recuperable |
| **Fallbacks declarativos** | Footer HTML estático; fuentes del sistema; mensajes de error controlados |
| **Degradación funcional** | Sin JS → contenido principal visible; sin CDN → fuentes del sistema |
| **Dependencias mínimas** | Solo marked.js como dependencia externa en tiempo de ejecución |

---

## 4. Estándares Internos

### 4.1 Estándares de Código

| Área | Estándar |
|------|----------|
| HTML | HTML5 semántico; sin inline scripts; sin inline styles |
| CSS | Variables CSS; mobile-first; sin `!important` sin justificación |
| JavaScript | `const`/`let`; sin `eval`; DOM API sobre `innerHTML` cuando sea posible |
| Markdown | Front matter YAML; sin HTML raw no revisado; imágenes con rutas relativas |
| Commits | Conventional Commits; commits atómicos; sin datos sensibles |

### 4.2 Estándares de Seguridad

| Área | Estándar |
|------|----------|
| CSP | Sin `unsafe-inline`; sin `unsafe-eval`; SRI en externos |
| Dependencias | Versión fijada; `integrity` + `crossorigin` en CDN |
| Formularios | Honeypot; validación client-side; CSP `form-action` limitado |
| Sanitización | Allowlist estricta; sin HTML raw de entrada de usuario |
| Enlace externo | `rel="noopener noreferrer"` siempre |

### 4.3 Estándares de Documentación

| Área | Estándar |
|------|----------|
| Formato | Markdown con encabezados jerárquicos y tablas para datos estructurados |
| Lenguaje | Español técnico formal; sin jerga sin definición |
| Actualización | Toda PR que cambie comportamiento técnico debe actualizar la documentación relevante |
| CHANGELOG | Seguir Keep a Changelog; versionar con semántica SemVer |

---

## 5. Criterios de Aceptación de Cambios

Un cambio es aceptable si cumple **todos** los siguientes criterios:

### 5.1 Criterios Obligatorios (bloqueantes)

- [ ] No introduce `eval`, `new Function` ni `setTimeout` con string.
- [ ] No debilita ninguna directiva de la CSP existente.
- [ ] No añade CDN externo sin `integrity` + `crossorigin`.
- [ ] No introduce datos sensibles (claves, tokens, PII).
- [ ] No rompe el layout en Chrome, Firefox y Safari modernos.
- [ ] No genera errores en consola del navegador.
- [ ] No quita el sanitizador de Markdown o la validación de parámetros URL.

### 5.2 Criterios Recomendados (no bloqueantes)

- [ ] Mantiene Lighthouse Performance ≥ 85.
- [ ] Mantiene Lighthouse Accessibility ≥ 90.
- [ ] Documenta el cambio en `CHANGELOG.md`.
- [ ] Actualiza la documentación relevante (`ARCHITECTURE.md`, `SECURITY_REVIEW.md`, etc.).

---

## 6. Reglas de Calidad del Código

| Regla | Justificación |
|-------|---------------|
| Un archivo CSS por página | Evita colisiones de estilos y facilita mantenimiento |
| Un módulo JS por responsabilidad | Cohesión alta; bajo acoplamiento |
| Sin comentarios TODO sin issue | Los TODOs sin tracking son deuda invisible |
| Sin código muerto | El código no utilizado es superficie de ataque potencial |
| Variables con nombres descriptivos | Legibilidad y mantenibilidad a largo plazo |
| Sin magic numbers sin constante | Cada valor significativo tiene un nombre que lo explica |

---

## 7. Relación con CIS, NIST y Zero Trust

### CIS Controls v8

El proyecto implementa controles de los tres grupos de implementación:

**IG1 (Higiene básica)**:
- CIS 2: Inventario de activos de software (dependencias declaradas).
- CIS 4: Configuración segura (CSP, cabeceras, HTTPS).
- CIS 7: Gestión de vulnerabilidades (SRI, versiones fijadas).

**IG2 (Fundamentos)**:
- CIS 12: Gestión de infraestructura de red (CSP como control de red de contenido).
- CIS 16: Seguridad de aplicaciones (sanitización, validación, honeypot).

### NIST 800-53 (Rev. 5)

| Control | Familia | Implementación |
|---------|---------|----------------|
| CM-7 | Configuration Management | Funcionalidad mínima: object-src none, permisos mínimos |
| SC-8 | System and Communications Protection | TLS, upgrade-insecure-requests |
| SI-10 | System and Information Integrity | Validación de input en ?post= y formulario |
| SA-15 | Development Process | Estándares de código, PR review, Conventional Commits |

### Zero Trust (NIST SP 800-207)

| Principio | Aplicación |
|-----------|------------|
| Verify explicitly | SRI verifica integridad de recursos externos en cada carga |
| Use least privilege | CSP mínima; Permissions-Policy restrictiva |
| Assume breach | Sanitización defensiva; fallbacks ante fallos de terceros |

---

## 8. Filosofía Editorial del Proyecto

- **Exactitud técnica sobre accesibilidad casual**: los artículos son para arquitectos
  y profesionales de seguridad, no para audiencias generales.
- **Evidencia antes que opinión**: las afirmaciones técnicas deben estar respaldadas
  por referencias a estándares (NIST, OWASP, CIS, MITRE).
- **Contenido evergreen**: preferir artículos de principios y arquitectura sobre
  tutoriales de versiones específicas de herramientas.
- **Sin contenido de marketing**: el sitio es un portafolio técnico, no una plataforma
  de ventas. Ningún artículo promueve productos o servicios comerciales.
- **Actualización responsable**: si un artículo queda desactualizado, se archiva
  o se actualiza; no se elimina sin dejar una redirección o nota.

---

## 9. Ciclo de Vida del Contenido

```
Borrador (draft en rama feature)
    │
    ▼
Revisión técnica (PR + checklist)
    │
    ▼
Merge a main (commit convencional)
    │
    ▼
Publicación automática (GitHub Pages)
    │
    ▼
Revisión periódica (trimestral)
    │
    ├─► Vigente → mantener
    ├─► Desactualizado → actualizar (nuevo commit)
    └─► Obsoleto → archivar (mover a /blog/archive/ con nota)
```

**Criterios de archivo**:
- El contenido hace referencia a versiones de software EOL.
- Los principios técnicos han cambiado sustancialmente.
- El artículo contiene errores técnicos no corregibles sin reescritura.

---

> La gobernanza de SEC_ARCHITECT se inspira en modelos de arquitectura como SABSA,
> priorizando la trazabilidad entre objetivos de negocio, principios de seguridad
> y controles técnicos implementados, asegurando que cada decisión de diseño
> responde a un propósito arquitectónico definido y verificable.
