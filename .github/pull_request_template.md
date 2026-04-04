## Resumen

Describe brevemente el cambio y su impacto.

## Checklist de seguridad

- [ ] No agrego secretos, tokens ni credenciales en código, logs o documentación.
- [ ] Validé que no se debilita CSP ni headers de seguridad.
- [ ] Revisé enlaces/rutas para evitar referencias rotas o no autorizadas.
- [ ] Si toqué flujos de entrada (query/form/markdown), validé sanitización y manejo seguro.
- [ ] Ejecuté validadores locales (`validate-og.ps1` y `security-policy-check.ps1`).
- [ ] Consideré impacto en Zero Trust/RBAC/documentación arquitectónica.

## Checklist de migración IA (Bridge/ESM)

- [ ] Si toqué `window.SECArchitectAI` o bridge global, documenté impacto en ADR-006.
- [ ] Si toqué migración ESM, validé compatibilidad por pantalla y no agregué nuevos consumidores legacy.
- [ ] Referencié checklist de sprint: `docs/deprecation-sprint-checklist.md`.
- [ ] Adjunté o referencié evidencia de sprint en `docs/evidence/`.
- [ ] Si aplica, incluí export de uso residual (`exportDeprecationUsageJson`) en evidencia.

## Evidencia de validación

Incluye resultados de tests, validadores o capturas relevantes.
