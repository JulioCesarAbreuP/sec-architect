# 🛡️ SEC_ARCHITECT — Security Overview

Riesgos de diseño, endurecimiento conceptual y alineación con marcos de seguridad.

Este documento resume la postura de seguridad de SEC_ARCHITECT desde una perspectiva **arquitectónica**, **conceptual** y **pedagógica**, alineada con:

- **NIST CSF**
- **CIS Controls v8**
- **MITRE ATT&CK**
- **Zero Trust**
- **RBAC**

No es un documento de implementación, sino de **criterio profesional**.

---

## 1. Principios de seguridad aplicados

SEC_ARCHITECT se construye sobre cuatro principios.

### 1.1 Zero Trust como baseline

- No confiar por defecto.
- Validar cada acceso.
- Mínimo privilegio.
- Evaluación continua.

Documentado en [zero-trust-integration.md](zero-trust-integration.md).

---

### 1.2 RBAC como control de exposición

Roles definidos:

- Viewer
- Analyst
- Architect
- Admin

Cada rol tiene acceso diferenciado a vistas y capacidades.

Documentado en [rbac-command-center.md](rbac-command-center.md).

---

### 1.3 Arquitectura modular

Cada módulo puede evolucionar sin comprometer el resto:

- Command Center
- Knowledge-Base
- Dashboard
- Zero Trust
- RBAC
- Documentación Staff

Documentado en [ADR-005](adr/ADR-005-modular-architecture.md).

---

### 1.4 Transparencia arquitectónica

Las decisiones principales están documentadas en [adr/](adr/), lo que permite revisar supuestos, alternativas y consecuencias técnicas antes de evolucionar el sistema.

---

## 2. Riesgos de diseño principales

### 2.1 Centralización del Command Center

- Riesgo de convertir el Command Center en punto único de fallo narrativo y funcional.
- Riesgo de sobrecargar una sola superficie con demasiadas responsabilidades.

### 2.2 Dependencia del lado cliente

- La lógica client-side simplifica el despliegue, pero limita controles server-side.
- Existe riesgo de sobreinterpretar una demo funcional como plataforma productiva enterprise.

### 2.3 Deriva documental y de gobierno

- Si las ADRs, los modelos RBAC y el contenido operativo divergen, el repositorio pierde credibilidad arquitectónica.
- El valor del proyecto depende de mantener trazabilidad entre narrativa, diseño y controles.

### 2.4 Exposición innecesaria de capacidades

- Sin segmentación por rol, un mismo usuario podría acceder a vistas, decisiones o configuraciones que no necesita.
- Esto aumenta superficie de error y debilita el principio de mínimo privilegio.

---

## 3. Medidas de hardening conceptual y técnico

### 3.1 Hardening ya aplicado

- CSP endurecida en superficies principales.
- Eliminación de dependencias externas innecesarias donde era viable.
- Externalización de scripts inline para permitir políticas más restrictivas.
- Validaciones automatizadas de metadata y políticas de seguridad.
- Estructura modular para reducir acoplamiento entre vistas, contenido y seguridad.

### 3.2 Hardening recomendado a continuación

- Versionado explícito de reglas, catálogos y mapeos.
- Auditoría de cambios editoriales y de arquitectura.
- Enforcement real de RBAC si se introduce backend.
- Observabilidad más fuerte para cambios, validaciones y trazabilidad.
- Escaneo continuo de dependencias e imagen contenedorizada.

---

## 4. Alineación con marcos de seguridad

### 4.1 NIST CSF

- **Identify**: inventario conceptual de riesgos, módulos y dependencias.
- **Protect**: hardening de frontend, control de exposición y separación de responsabilidades.
- **Detect**: validaciones automatizadas y revisión de cambios.
- **Respond**: documentación clara para corregir desviaciones de diseño o seguridad.
- **Recover**: modularidad documental y técnica que facilita restaurar consistencia.

### 4.2 CIS Controls v8

- Gobernanza de privilegios mediante RBAC.
- Control de cambios a través de ADRs y documentación estructurada.
- Reducción de superficie mediante despliegue estático y endurecimiento del frontend.

### 4.3 MITRE ATT&CK

- El dashboard y los mapeos permiten representar tácticas y técnicas en una vista consumible.
- La arquitectura favorece el entendimiento defensivo, no la simulación ofensiva directa.

### 4.4 Zero Trust y RBAC

- Zero Trust define el principio de validación continua.
- RBAC concreta la segmentación de acceso por función.
- Juntos permiten separar lectura, análisis, diseño y administración.

---

## 5. Criterio profesional y límites del proyecto

SEC_ARCHITECT demuestra criterio arquitectónico y disciplina documental, pero no debe presentarse como sustituto de una plataforma productiva completa sin backend, auditoría persistente y enforcement real de controles.

Su fortaleza actual está en:

- claridad estructural,
- coherencia entre seguridad y arquitectura,
- capacidad pedagógica,
- y trazabilidad de decisiones.

---

## 6. Próximos pasos recomendados

- Completar la normalización documental entre overview, architecture map y security overview.
- Añadir verificación automática de enlaces markdown internos.
- Fortalecer observabilidad y SBOM en CI/CD.
- Diseñar ADR-006 para backend opcional con auditoría y AuthZ reales.
