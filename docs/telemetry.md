# Telemetría ligera del cliente

Se ha implementado un módulo de telemetría ligera (`js/telemetry.js`) que captura errores globales (window.onerror, window.unhandledrejection) y métricas Web Vitals (LCP, FID, CLS) usando PerformanceObserver.

- Los eventos se registran en consola y están preparados para envío futuro a un endpoint seguro o Application Insights.
- El script se incluye con SRI, nonce y Trusted Types, garantizando compatibilidad con la política CSP y sin exponer datos sensibles.
- No se recolecta información personal ni identificadores de usuario.
- La telemetría es estrictamente técnica y orientada a mejorar la resiliencia y experiencia del usuario, sin riesgo para la privacidad.

Ver CHANGELOG.md para detalles de la implementación.
