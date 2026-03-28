# SEC_ARCHITECT | Enterprise Resilience Framework

![Azure](https://img.shields.io/badge/Azure-0078D4?style=for-the-badge&logo=microsoft-azure&logoColor=white)
![AWS](https://img.shields.io/badge/AWS-232F3E?style=for-the-badge&logo=amazon-aws&logoColor=white)
![Security](https://img.shields.io/badge/Security-NIST_800--53-red?style=for-the-badge)

Este repositorio contiene la arquitectura de una Landing Page de alta disponibilidad y seguridad endurecida (Hardening), diseñada específicamente para la captación de leads en servicios de consultoría de ciberseguridad para PYMEs.

## 🛡️ Pilares de la Arquitectura de Seguridad

El despliegue no es solo visual; sigue estrictos controles de seguridad para mitigar vectores de ataque comunes en infraestructuras web:

### 1. Control de Integridad (SRI)
Se utiliza **Subresource Integrity (SRI)** en todas las librerías externas (FontAwesome, Google Fonts). Esto garantiza que si un nodo de la CDN es comprometido, el navegador bloqueará la ejecución de scripts que no coincidan con el hash de integridad verificado.

### 2. Mitigación de XSS (Content Security Policy)
Implementación de políticas de seguridad de contenido para restringir la ejecución de scripts maliciosos y prevenir la inyección de código de terceros no autorizados.

### 3. Defensa Anti-Bot (Honeypot Strategy)
El formulario de diagnóstico técnico integra un **Honeypot** (campo trampa invisible para humanos). Los scripts de spam automatizados completan este campo, permitiendo su detección y bloqueo inmediato en el lado del cliente y del transporte de datos.

### 4. Alineación Normativa
La estructura de servicios y el manejo de datos están diseñados bajo los marcos:
* **CIS Controls v8:** Enfoque en inventario de activos y gestión de vulnerabilidades.
* **NIST Cybersecurity Framework:** Estrategias de Identificación, Protección y Respuesta.

## ☁️ Enfoque Cloud Multi-Vendor

Como especialista en administración de infraestructura nube, este proyecto refleja competencias críticas evaluadas en certificaciones de industria:

* **Microsoft Azure (AZ-104 / SC-300):** Gestión de identidades (Entra ID), despliegue de Static Web Apps y configuración de políticas de acceso condicional.
* **AWS (Cloud Practitioner):** Conceptos de alta disponibilidad, almacenamiento en S3 y distribución global vía CloudFront.

---
**Contacto Profesional:**
Para auditorías de infraestructura o despliegues de seguridad gestionada, contácteme vía [LinkedIn](https://www.linkedin.com/in/TU_PERFIL).
