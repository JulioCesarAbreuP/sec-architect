# 🧱 SEC_ARCHITECT — Architecture Map (High-Level)

Este documento describe la arquitectura de SEC_ARCHITECT a **alto nivel**, con foco en:

- cómo se organiza el sistema,
- qué módulos existen,
- cómo se relacionan,
- y qué decisiones arquitectónicas los sostienen.

No es un documento de implementación, sino de **visión estructural**.

---

## 1. Visión general

SEC_ARCHITECT se organiza en torno a un **Command Center** que orquesta:

- una **Knowledge-Base** de marcos de seguridad (NIST, CIS, MITRE),
- un **Dashboard** para visualización de riesgos y tácticas/técnicas,
- un modelo de **Zero Trust** aplicado al flujo de interacción,
- un **RBAC** conceptual para controlar el acceso a vistas y capacidades,
- y una **capa de documentación** que explica decisiones, riesgos y arquitectura.

---

## 2. Componentes principales

### 2.1 Command Center

**Rol:**
Es el núcleo del sistema, la interfaz desde la que se:

- consultan riesgos,
- exploran tácticas/técnicas,
- navega la Knowledge-Base,
- y se visualizan decisiones arquitectónicas y de seguridad.

**Responsabilidades:**

- Orquestar vistas y módulos.
- Servir como punto de entrada único.
- Exponer una narrativa clara de arquitectura y seguridad.

---

### 2.2 Knowledge-Base

**Rol:**
Centraliza y normaliza información de:

- **NIST CSF**
- **CIS Controls v8**
- **MITRE ATT&CK**

**Responsabilidades:**

- Proveer datos estructurados (JSON) para el Command Center y el Dashboard.
- Permitir mapeos entre controles, tácticas, técnicas y riesgos.
- Servir como base para futuras automatizaciones o integraciones.

**Decisión clave:**
La Knowledge-Base se modela inicialmente en **JSON estático**, documentado en ADR-002, para priorizar:

- claridad,
- portabilidad,
- facilidad de revisión,
- y ausencia de dependencias de backend.

---

### 2.3 Dashboard

**Rol:**
Es la capa de **visualización** de:

- tácticas y técnicas MITRE,
- riesgos de diseño,
- controles aplicables,
- y estado conceptual de la postura de seguridad.

**Responsabilidades:**

- Mostrar información compleja de forma pedagógica.
- Permitir que un analista o arquitecto entienda el contexto de un vistazo.
- Servir como “ventana” a la Knowledge-Base.

**Decisión clave:**
El Dashboard se implementa inicialmente como **client-side**, documentado en ADR-003, para:

- reducir complejidad de despliegue,
- facilitar hosting estático,
- y mantener el foco en la arquitectura y la seguridad, no en la infraestructura.

---

### 2.4 Zero Trust Integration

**Rol:**
Aplicar principios de **Zero Trust** al modelo conceptual del sistema:

- no confiar por defecto,
- validar cada acceso,
- minimizar privilegios,
- segmentar responsabilidades.

**Responsabilidades:**

- Definir cómo se evalúa el acceso a módulos y vistas.
- Aportar un marco mental de seguridad continua.
- Conectar identidad, contexto y permisos.

**Relación con otros módulos:**

- Se apoya en el modelo **RBAC**.
- Informa decisiones de diseño en el Command Center y el Dashboard.
- Está documentado en `docs/zero-trust-integration.md`.

---

### 2.5 RBAC (Role-Based Access Control)

**Rol:**
Definir **quién puede ver qué** dentro del Command Center.

**Roles principales:**

- **Viewer**
	Acceso de solo lectura a vistas generales.

- **Analyst**
	Acceso a vistas de detalle, riesgos y mapeos.

- **Architect**
	Acceso a vistas de arquitectura, ADRs y decisiones.

- **Admin**
	Acceso a configuración avanzada y parámetros del sistema.

**Responsabilidades:**

- Reducir exposición innecesaria de información sensible.
- Reflejar escenarios reales de operación.
- Servir como base para futuras implementaciones técnicas.

Documentado en: `docs/rbac-command-center.md`.

---

### 2.6 Documentación Staff/Lead

**Rol:**
Actuar como **capa de contexto y narrativa** para:

- decisiones arquitectónicas (ADRs),
- riesgos de diseño,
- modelo de seguridad,
- evaluación profesional del proyecto.

**Archivos clave:**

- `docs/SEC_ARCHITECT_STAFF_BOARD.md`
- `docs/architecture-high-level.md` (este documento)
- `docs/c4-container-view.md`
- `docs/design-risks-hardening.md`
- `docs/zero-trust-integration.md`
- `docs/mitre-mapping-dashboard.md`
- `docs/rbac-command-center.md`
- `docs/staff-lead-assessment.md`

---

## 3. Relación entre componentes

A alto nivel:

- El **Command Center** es la **puerta de entrada**.
- El **Dashboard** es la **ventana visual**.
- La **Knowledge-Base** es la **fuente de verdad**.
- **Zero Trust** y **RBAC** son el **modelo de control**.
- La **documentación Staff/Lead** es la **capa de comprensión y evaluación**.

Podemos resumirlo así:

- Command Center ←→ Dashboard
- Ambos consumen ←→ Knowledge-Base
- Acceso regulado por ←→ RBAC + Zero Trust
- Todo explicado por ←→ Documentación Staff/Lead + ADRs

---

## 4. Decisiones arquitectónicas clave

Algunas decisiones relevantes (detalladas en `docs/adr/`):

- **Command Center como núcleo** (ADR-001)
	En lugar de múltiples vistas dispersas, se centraliza la experiencia.

- **Knowledge-Base en JSON estático** (ADR-002)
	Prioriza claridad, portabilidad y facilidad de revisión.

- **Dashboard client-side** (ADR-003)
	Facilita despliegue estático y reduce complejidad inicial.

- **Zero Trust como baseline conceptual** (ADR-004)
	La seguridad no es un añadido, sino un principio de diseño.

- **Arquitectura modular** (ADR-005)
	Cada pieza puede evolucionar sin romper el conjunto.

---

## 5. Evolución futura

La arquitectura está pensada para poder crecer hacia:

- un backend ligero (API para auditoría, telemetría, RBAC real),
- integración con fuentes externas (SIEM, CMDB, ticketing),
- automatización de evaluaciones de postura,
- despliegues cloud-native (contenedores, CI/CD, escáneres de seguridad).

La versión actual prioriza:

- **claridad arquitectónica**,
- **pedagogía**,
- **demostración de criterio profesional**.

---

## 6. Cómo leer este mapa

- Si quieres entender **qué existe y cómo se conecta**, este documento es el punto de partida.
- Si quieres ver **el modelo C4**, ve a: `docs/c4-container-view.md`.
- Si quieres profundizar en **riesgos y seguridad**, ve a: `docs/design-risks-hardening.md`.
- Si quieres evaluar el proyecto como **reclutador o arquitecto**, ve a: `docs/staff-lead-assessment.md`.
