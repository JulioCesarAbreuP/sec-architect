# 🛡️ SEC_ARCHITECT | Enterprise Resilience Architecture

Este repositorio contiene la arquitectura de una Landing Page de **Alta Disponibilidad** y **Seguridad Endurecida (Hardening)**, diseñada por un **Cloud Security Architect** para la captación de activos críticos en servicios de consultoría para PYMEs.

El proyecto no es una simple web estática; es un caso de estudio sobre **Defensa en Profundidad** aplicada a infraestructuras web modernas.

## 🚀 Pilares de la Arquitectura de Seguridad (Hardening)

El despliegue sigue estrictos controles de seguridad para mitigar vectores de ataque en infraestructuras críticas:

### 1. Mitigación Avanzada de XSS & Injection
* **Content Security Policy (CSP) v3:** Implementación de políticas de control de origen para restringir la ejecución de scripts y conexiones salientes (`connect-src`), neutralizando la exfiltración de datos.
* **Sanitización Dinámica del DOM:** El motor de transporte (Fetch API) integra una capa de limpieza de caracteres maliciosos, evitando que inyecciones de código (HTML/JS) alcancen el backend de correo.

### 2. Control de Integridad y Red
* **Subresource Integrity (SRI):** Verificación de hashes en librerías externas (FontAwesome, Google Fonts). Si un nodo de la CDN es comprometido, el navegador bloquea la carga automáticamente.
* **SSL/TLS Enforcement:** Configuración de `upgrade-insecure-requests` para garantizar que toda comunicación viaje por túneles cifrados.

### 3. Resiliencia y Anti-Spam (DoS Protection)
* **Rate Limiting (Client-Side):** Control de inundación mediante *throttling* de 30 segundos entre envíos para prevenir ataques de denegación de servicio (DoS) y agotamiento de cuotas de API.
* **Honeypot Strategy:** Integración de campos trampa invisibles para humanos que detectan y descartan instantáneamente el tráfico de bots automatizados.

## ☁️ Alineación con Certificaciones de Industria

Como especialista en **Arquitectura de Infraestructura Cloud**, este proyecto refleja competencias críticas evaluadas en:

* **Microsoft Azure (AZ-305 / SC-300 / AZ-104):** Diseño de soluciones resilientes, gobernanza de identidades (Microsoft Entra ID) y configuración de políticas de acceso condicional (Zero Trust).
* **AWS (Cloud Practitioner):** Conceptos de alta disponibilidad, almacenamiento inmutable y distribución global de contenido.
* **Cybersecurity Frameworks:** Alineación con **CIS Controls v8** (Gestión de Vulnerabilidades) y **NIST** (Protección y Respuesta).

---
**Contacto Profesional:**
[LinkedIn - Julio Cesar Abreu](https://www.linkedin.com/in/juliocesarabreup)

*Diseñado para garantizar la continuidad de negocio y la integridad de la información corporativa.*
