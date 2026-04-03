# SEC_ARCHITECT | Framework Defensivo de Arquitectura

![HTML](https://img.shields.io/badge/HTML-Framework-orange)
![Architecture](https://img.shields.io/badge/Architecture-SABSA%20Aligned-0a0a0a)
![NIST](https://img.shields.io/badge/NIST%20CSF-Mapped-005ea2)
![MITRE](https://img.shields.io/badge/MITRE%20ATT%26CK-Contextualized-a100ff)
![CIS](https://img.shields.io/badge/CIS%20v8-Controls%20Driven-00b7c3)

SEC_ARCHITECT es un framework editorial y técnico para diseñar, explicar y operar defensa estructural en entornos cloud.
Combina narrativa arquitectónica, visualización operativa y trazabilidad de controles para convertir principios de seguridad en decisiones verificables.

## Qué es este framework

- Un marco de arquitectura defensiva orientado a identidad, resiliencia y gobernanza técnica.
- Un entorno de trabajo modular para estudiar, ejecutar y documentar decisiones de seguridad.
- Una plataforma de referencia para alinear diseño estratégico con controles operacionales.

## Para quién está diseñado

- Arquitectos de seguridad y arquitectos cloud.
- Equipos Blue Team y líderes de ciberdefensa.
- Responsables de modernización técnica en PYMEs y entornos empresariales.
- Profesionales en preparación de rutas AZ-305, SC-300, SC-100 y AZ-500.

## Cómo se usa

1. Navega los módulos visuales desde [index.html](index.html).
2. Explora escenarios y mapeos en `Command Center`, `Knowledge-Base` e `Intelligence Dashboard`.
3. Profundiza con laboratorios en [azure-labs/README.md](azure-labs/README.md).
4. Reutiliza el dataset defensivo de [data/knowledge-base.json](data/knowledge-base.json).

## Estructura del proyecto

- `index.html`: entrada principal y narrativa de valor.
- `sabsa-ig4-command-center.html`: consola estratégica y simulación defensiva.
- `tools/knowledge-base.html`: explorador de reglas con filtros avanzados.
- `intelligence-dashboard.html`: panel analítico sobre inteligencia defensiva.
- `azure-labs/`: laboratorio técnico con Bicep, Terraform y guías.
- `GLOSARIO.md`: base conceptual y definiciones de referencia.

## Módulos incluidos

### 1) Command Center
- Orquesta contexto estratégico, decisiones y visualizaciones de riesgo.
- Enlace: [sabsa-ig4-command-center.html](sabsa-ig4-command-center.html)

### 2) Knowledge-Base
- Repositorio navegable de reglas defensivas con mapeo MITRE/NIST/ISO.
- Enlace: [tools/knowledge-base.html](tools/knowledge-base.html)

### 3) Intelligence Dashboard
- Vista de inteligencia operativa para búsqueda, filtrado y priorización de reglas.
- Enlace: [intelligence-dashboard.html](intelligence-dashboard.html)

### 4) Laboratorios
- Implementación guiada de patrones Zero Trust en Azure.
- Enlace: [azure-labs/README.md](azure-labs/README.md)

### 5) Glosario técnico
- Léxico de arquitectura, defensa y gobierno de seguridad.
- Enlace: [GLOSARIO.md](GLOSARIO.md)

### 6) Simulador certificador
- Módulo de entrenamiento y evaluación estructurada por dominio técnico.
- Estado: en evolución dentro del roadmap del framework.

## Integración entre módulos

- `Command Center` consume escenarios y postura táctica.
- `Knowledge-Base` centraliza reglas técnicas y mapeos.
- `Intelligence Dashboard` consume `data/knowledge-base.json` vía `fetch()` para analítica y priorización.
- `Laboratorios` materializan los controles en infraestructura reproducible.
- `Glosario técnico` mantiene consistencia terminológica para diseño y operación.

## Extensión del framework

1. Añade nuevas reglas en [data/knowledge-base.json](data/knowledge-base.json).
2. Amplía visualizaciones en `tools/` o paneles raíz.
3. Incorpora nuevos labs en `azure-labs/docs/` y su IaC asociado.
4. Mantén mapeos MITRE, NIST CSF e ISO 27001 para trazabilidad integral.

## Roadmap del proyecto

- `v1`: Command Center + Knowledge-Base + laboratorios base.
- `v2`: Intelligence Dashboard con filtros avanzados y enlaces compartibles.
- `v3`: Simulador certificador por dominio (identidad, red, datos, monitoreo).
- `v4`: Exportadores de evidencia y reportes para gobierno técnico.

## Contacto

- [LinkedIn - Julio Cesar Abreu](https://www.linkedin.com/in/juliocesarabreup)# SEC_ARCHITECT | Framework Defensivo de Arquitectura

![HTML](https://img.shields.io/badge/HTML-Framework-orange)
![Architecture](https://img.shields.io/badge/Architecture-SABSA%20Aligned-0a0a0a)
![NIST](https://img.shields.io/badge/NIST%20CSF-Mapped-005ea2)
![MITRE](https://img.shields.io/badge/MITRE%20ATT%26CK-Contextualized-a100ff)
![CIS](https://img.shields.io/badge/CIS%20v8-Controls%20Driven-00b7c3)

SEC_ARCHITECT es un framework editorial y técnico para diseñar, explicar y operar defensa estructural en entornos cloud.
Combina narrativa arquitectónica, visualización operativa y trazabilidad de controles para convertir principios de seguridad en decisiones verificables.

## Qué es este framework

- Un marco de arquitectura defensiva orientado a identidad, resiliencia y gobernanza técnica.
- Un entorno de trabajo modular para estudiar, ejecutar y documentar decisiones de seguridad.
- Una plataforma de referencia para alinear diseño estratégico con controles operacionales.

## Para quién está diseñado

- Arquitectos de seguridad y arquitectos cloud.
- Equipos Blue Team y líderes de ciberdefensa.
- Responsables de modernización técnica en PYMEs y entornos empresariales.
- Profesionales en preparación de rutas AZ-305, SC-300, SC-100 y AZ-500.

## Cómo se usa

1. Navega los módulos visuales desde [index.html](index.html).
2. Explora escenarios y mapeos en `Command Center`, `Knowledge-Base` e `Intelligence Dashboard`.
3. Profundiza con laboratorios en [azure-labs/README.md](azure-labs/README.md).
4. Reutiliza el dataset defensivo de [data/knowledge-base.json](data/knowledge-base.json).

## Estructura del proyecto

- `index.html`: entrada principal y narrativa de valor.
- `sabsa-ig4-command-center.html`: consola estratégica y simulación defensiva.
- `tools/knowledge-base.html`: explorador de reglas con filtros avanzados.
- `intelligence-dashboard.html`: panel analítico sobre inteligencia defensiva.
- `azure-labs/`: laboratorio técnico con Bicep, Terraform y guías.
- `GLOSARIO.md`: base conceptual y definiciones de referencia.

## Módulos incluidos

### 1) Command Center
- Orquesta contexto estratégico, decisiones y visualizaciones de riesgo.
- Enlace: [sabsa-ig4-command-center.html](sabsa-ig4-command-center.html)

### 2) Knowledge-Base
- Repositorio navegable de reglas defensivas con mapeo MITRE/NIST/ISO.
- Enlace: [tools/knowledge-base.html](tools/knowledge-base.html)

### 3) Intelligence Dashboard
- Vista de inteligencia operativa para búsqueda, filtrado y priorización de reglas.
- Enlace: [intelligence-dashboard.html](intelligence-dashboard.html)

### 4) Laboratorios
- Implementación guiada de patrones Zero Trust en Azure.
- Enlace: [azure-labs/README.md](azure-labs/README.md)

### 5) Glosario técnico
- Léxico de arquitectura, defensa y gobierno de seguridad.
- Enlace: [GLOSARIO.md](GLOSARIO.md)

### 6) Simulador certificador
- Módulo de entrenamiento y evaluación estructurada por dominio técnico.
- Estado: en evolución dentro del roadmap del framework.

## Integración entre módulos

- `Command Center` consume escenarios y postura táctica.
- `Knowledge-Base` centraliza reglas técnicas y mapeos.
- `Intelligence Dashboard` consume `data/knowledge-base.json` vía `fetch()` para analítica y priorización.
- `Laboratorios` materializan los controles en infraestructura reproducible.
- `Glosario técnico` mantiene consistencia terminológica para diseño y operación.

## Extensión del framework

1. Añade nuevas reglas en [data/knowledge-base.json](data/knowledge-base.json).
2. Amplía visualizaciones en `tools/` o paneles raíz.
3. Incorpora nuevos labs en `azure-labs/docs/` y su IaC asociado.
4. Mantén mapeos MITRE, NIST CSF e ISO 27001 para trazabilidad integral.

## Roadmap del proyecto

- `v1`: Command Center + Knowledge-Base + laboratorios base.
- `v2`: Intelligence Dashboard con filtros avanzados y enlaces compartibles.
- `v3`: Simulador certificador por dominio (identidad, red, datos, monitoreo).
- `v4`: Exportadores de evidencia y reportes para gobierno técnico.

## Contacto

- [LinkedIn - Julio Cesar Abreu](https://www.linkedin.com/in/juliocesarabreup)
