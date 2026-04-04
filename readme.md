# SEC_ARCHITECT
### Framework de Arquitectura de Defensa Estructural para PYMEs

SEC_ARCHITECT es un framework técnico y editorial para diseñar, explicar y operar arquitectura defensiva con claridad.
Está pensado para arquitectos de seguridad, equipos de defensa y organizaciones que necesitan convertir marcos y controles en una práctica estructurada, accionable y pedagógica.

## 📘 Lectura recomendada (Staff/Lead)

- [Staff/Lead Architecture Overview](docs/README_Staff.md)
- [Architecture Board](docs/SEC_ARCHITECT_STAFF_BOARD.md)
- [Architecture Map](docs/architecture-high-level.md)
- [Security Overview](docs/design-risks-hardening.md)

## Visión

Convertir la arquitectura de seguridad en un sistema vivo: accionable para operación, pedagógico para adopción y estructurado para gobernanza.
SEC_ARCHITECT cierra la brecha entre estrategia, implementación y comprensión organizacional.

## Módulos principales

### 1) Command Center
Superficie estratégica para modelar escenarios, niveles de riesgo y decisiones de mitigación. La entrada principal actual es Enterprise Command Center; SABSA IG4 permanece como legado de referencia.

### 2) Knowledge-Base (NSA, CISA, MITRE, NIST, ISO)
Base estructurada de reglas defensivas con mapeo a estándares y contexto operativo.

### 3) Intelligence Dashboard
Capa de lectura analítica para priorizar decisiones por categoría, riesgo, severidad y marcos asociados.

### 4) Laboratorios (Azure-Labs)
Entornos guiados para llevar patrones defensivos a implementación técnica y validación.

### 5) Glosario técnico
Lenguaje común para alinear arquitectura, operación y cumplimiento sin ambigüedad.

### 6) Simulador de madurez y certificación
Modelo de evaluación progresiva para medir evolución técnica y capacidad defensiva.

## Alineación con estándares

- NIST CSF para estructura de gobierno y mejora continua.
- CIS v8 para controles prácticos de reducción de superficie de ataque.
- MITRE ATT&CK para mapeo de técnicas adversarias y respuesta defensiva.
- Zero Trust para diseño basado en verificación continua y privilegio mínimo.

## Para quién está pensado

- PYMEs que necesitan madurar su postura sin perder foco operativo.
- Arquitectos de seguridad que requieren un marco claro para diseñar y justificar decisiones.
- Responsables de cumplimiento que buscan trazabilidad entre controles y riesgo.
- Equipos de defensa que necesitan coherencia entre estrategia, datos y ejecución.

## Cómo empezar

- Comprender la estructura general del framework y su narrativa de defensa.
- Recorrer los módulos en orden estratégico: visión, base de conocimiento, inteligencia y laboratorio.
- Identificar escenarios prioritarios según contexto organizacional.
- Mapear riesgos y controles a los marcos de referencia del proyecto.
- Establecer un ciclo de mejora continua con evidencia técnica y aprendizaje operativo.

## Roadmap del proyecto

- Más escenarios defensivos orientados a contextos reales de PYMEs.
- Más reglas en Knowledge-Base con clasificación avanzada por impacto.
- Más dashboards para lectura ejecutiva, técnica y de cumplimiento.
- Mayor integración entre laboratorios, evidencias y modelos de madurez.
- Evolución del simulador hacia rutas de certificación por dominios.

## Filosofía del framework

SEC_ARCHITECT existe para demostrar que la seguridad puede ser rigurosa sin ser opaca.

- Claridad para decidir mejor.
- Estructura para operar con disciplina.
- Pedagogía para escalar conocimiento.
- Defensa realista para proteger lo que importa.

## Enlaces internos

- Inicio: [index.html](index.html)
- Herramientas: [tools.html](tools.html)
- Command Center: [tools/enterprise-command-center.html](tools/enterprise-command-center.html)
- Command Center legacy: [sabsa-ig4-command-center.html](sabsa-ig4-command-center.html)
- Knowledge-Base: [tools/knowledge-base.html](tools/knowledge-base.html)
- Intelligence Dashboard: [intelligence-dashboard.html](intelligence-dashboard.html)
- Azure-Labs: [azure-labs/README.md](azure-labs/README.md)

## Staff/Lead Assessment Package

- Índice del paquete: [docs/staff-lead-assessment.md](docs/staff-lead-assessment.md)
- ADRs: [docs/adr](docs/adr)
- RBAC Command Center: [docs/rbac-command-center.md](docs/rbac-command-center.md)
- Arquitectura high-level: [docs/architecture-high-level.md](docs/architecture-high-level.md)
- Zero Trust: [docs/zero-trust-integration.md](docs/zero-trust-integration.md)
- MITRE mapping dashboard: [docs/mitre-mapping-dashboard.md](docs/mitre-mapping-dashboard.md)
- Riesgos y endurecimiento: [docs/design-risks-hardening.md](docs/design-risks-hardening.md)
- Evaluación recruiter: [docs/recruiter-evaluation.md](docs/recruiter-evaluation.md)
- C4 container view: [docs/c4-container-view.md](docs/c4-container-view.md)
- Dockerfile: [Dockerfile](Dockerfile)
- CI de seguridad: [.github/workflows/security-ci.yml](.github/workflows/security-ci.yml)
- Security policy check: [scripts/security-policy-check.ps1](scripts/security-policy-check.ps1)
