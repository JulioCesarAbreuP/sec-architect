# CONTRIBUTING - SEC_ARCHITECT

Gracias por contribuir a SEC_ARCHITECT. Este proyecto prioriza seguridad, resiliencia y claridad tecnica.

## 1) Reglas para contribuir al proyecto
- Toda contribucion debe mantener el enfoque minimalista y tecnico del sitio.
- No introducir dependencias nuevas sin justificar riesgo/beneficio.
- No degradar controles de seguridad (CSP, sanitizacion, enlaces seguros).
- Cualquier cambio funcional debe incluir pruebas o checklist de validacion.
- Evitar cambios masivos no relacionados con el objetivo del PR.

## 2) Estandares de codigo
- HTML semantico y consistente entre paginas.
- JS sin patrones inseguros (`eval`, inyecciones directas, handlers inline).
- Preferir APIs DOM seguras y validacion explicita de inputs.
- CSS modular por contexto de pagina + estilos globales compartidos.
- Nombres claros y orientados a dominio (seguridad, arquitectura, blog).

## 3) Estilo de commits
Se recomienda Conventional Commits:
- `feat:` nueva funcionalidad
- `fix:` correccion de defecto
- `docs:` cambios de documentacion
- `refactor:` mejora interna sin cambio funcional
- `security:` endurecimiento de seguridad
- `test:` pruebas o validaciones

Ejemplos:
- `security: harden csp for blog and post pages`
- `feat: add global theme toggle with dark default`

## 4) Reglas para PRs
- Un objetivo principal por PR.
- Describir contexto, alcance, riesgos y plan de rollback.
- Incluir evidencia de pruebas (capturas o resultados concretos).
- Referenciar archivos impactados y comportamiento esperado.
- Marcar explicitamente impactos de seguridad.

Checklist minimo para aprobar PR:
- [ ] No rompe navegacion principal
- [ ] No debilita CSP ni sanitizacion
- [ ] No introduce recursos externos innecesarios
- [ ] Mantiene modo oscuro por defecto
- [ ] Actualiza documentacion si aplica

## 5) Como ejecutar el proyecto localmente
1. Clonar repositorio.
2. Abrir carpeta raiz `sec-architect`.
3. Servir archivos con Live Server (VS Code) o servidor HTTP simple.
4. Verificar rutas:
   - `/index.html`
   - `/blog.html`
   - `/post.html?post=<archivo>.md`

## 6) Como probar el blog dinamico
1. Crear/editar `.md` en carpeta `blog/`.
2. Incluir `front matter` recomendado (`title`, `date`).
3. Abrir `blog.html` y validar listado ordenado por fecha.
4. Abrir post desde enlace y validar render seguro del Markdown.
5. Verificar rutas relativas de imagen `./assets/<archivo>`.

## 7) Como validar la CSP
- Revisar la meta CSP en cada pagina HTML.
- Abrir DevTools > Console y detectar violaciones CSP.
- Confirmar que scripts solo se cargan desde `self`.
- Confirmar que formularios solo publican hacia Formspree permitido.
- Comprobar ausencia de mixed content.

## 8) Como ejecutar pruebas de Lighthouse
- Ejecutar Lighthouse en modo Mobile y Desktop.
- Capturar resultados de:
  - Performance
  - Accessibility
  - Best Practices
  - SEO
- Mantener umbrales acordados por el equipo.
- Adjuntar reporte al PR en cambios relevantes.

## 9) Como reportar problemas de seguridad
- Crear issue con etiqueta `[SECURITY]`.
- Incluir:
  - Vector de ataque
  - Evidencia reproducible
  - Impacto
  - Mitigacion propuesta
- Para hallazgos criticos, usar canal privado acordado por mantenedores antes de publicar detalles.

## Recomendacion operativa
Antes de abrir PR, revisar:
- SECURITY.md
- SECURITY_REVIEW.md
- THREAT_MODEL.md
- TESTING.md
