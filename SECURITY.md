# 🛡️ Política de Seguridad (SECURITY.md)

Este proyecto prioriza la **Integridad de los Datos** y la **Resiliencia Estructural**. Si usted es un investigador de seguridad o desarrollador e identifica una vulnerabilidad o una oportunidad de mejora en la arquitectura, agradecemos su contribución siguiendo este marco de trabajo:

## 1. Controles Técnicos Implementados (Hardening)
Como parte del endurecimiento de la infraestructura, se han desplegado las siguientes capas de defensa activa:

* **Content Security Policy (CSP):** Control estricto de orígenes para scripts y conexiones (`connect-src`), mitigando vectores de **XSS** y exfiltración de datos.
* **Sanitización de Entradas:** Procesamiento del DOM para neutralizar inyecciones de código en el transporte de datos vía AJAX/Fetch.
* **Rate Limiting & Throttling:** Control de inundación en el cliente para prevenir ataques de **Denegación de Servicio (DoS)** y saturación de API.
* **Upgrade Insecure Requests:** Forzado de túneles cifrados (SSL/TLS) para toda la comunicación de red.

## 2. Reporte de Vulnerabilidades
Si encuentra un fallo crítico (bypass de CSP, inyección no detectada o mala configuración de transporte), por favor proceda de la siguiente manera:
* **Issues:** Abra un *Issue* en este repositorio utilizando la etiqueta `[SECURITY]`.
* **Detalles:** Incluya el vector de ataque identificado y, si es posible, una propuesta de mitigación basada en estándares de **OWASP ZAP**.

## 3. Pull Requests y Contribuciones
Las mejoras en el endurecimiento del código son bienvenidas. Valoramos especialmente propuestas que:
* Incrementen la puntuación en auditorías de **Lighthouse Security**.
* Añadan capas de validación en el esquema de datos antes del envío a Formspree.
* Optimicen la resiliencia de la interfaz ante fallos de servicios externos.

---

### 🎓 Relación con Certificaciones Microsoft
Este repositorio sirve como entorno de pruebas para la implementación de arquitecturas seguras bajo los dominios de:
* **AZ-305:** Diseño de infraestructura resiliente y segura.
* **SC-300:** Gestión de identidades y acceso condicional (Zero Trust).
* **AZ-104:** Administración de seguridad y cumplimiento en el host.
