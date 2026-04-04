# Enterprise Command Center Validation

## Scope

- Cutover del Command Center primario hacia `tools/enterprise-command-center.html`.
- Señalizacion del modulo SABSA IG4 como legacy/deprecated.
- Smoke test funcional para flujos JSON, JWT y MITRE.

## Static Validation

- `get_errors` sin hallazgos en HTML, CSS, JS, workflow y documentacion tocados por este cambio.
- Revisado el helper `jwt-decode.esm.js` para soportar navegadores y runtimes Node sin dependencias externas.

## Functional Validation

- Se agrego `npm run test:enterprise` como smoke test del nuevo stack modular.
- Cobertura: parseo JSON, validacion de Conditional Access, deteccion MITRE, remediacion Bicep/Terraform, JWT SC-300 con MFA y expiracion.

## Local Execution Notes

- En la maquina de trabajo actual no hay `node` ni `npm` instalados, por lo que la ejecucion local del smoke test no fue posible.
- Se agrego el job `enterprise-functional-smoke` en GitHub Actions con Node 22 para validar el flujo en CI.

## Expected CI Signal

- `security-ci / enterprise-functional-smoke`: debe pasar para considerar operativo el cutover enterprise.