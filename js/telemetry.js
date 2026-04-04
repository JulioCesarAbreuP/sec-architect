// js/telemetry.js
// Telemetría ligera: captura de errores, métricas web vitales y correlación de eventos
(function () {
  // Trusted Types: evitar sinks inseguros
  if (window.trustedTypes && window.trustedTypes.createPolicy) {
    window.trustedTypes.createPolicy('telemetryPolicy', {
      createScriptURL: (url) => url,
      createHTML: (html) => html
    });
  }

  // UUID v4 generator (RFC4122, simple)
  function uuidv4() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
  }

  // Obtener o generar correlationId por sesión
  function getCorrelationId() {
    let cid = sessionStorage.getItem('correlationId');
    if (!cid) {
      cid = uuidv4();
      sessionStorage.setItem('correlationId', cid);
    }
    return cid;
  }
  const correlationId = getCorrelationId();

  // 1. Captura de errores globales
  function sendTelemetry(event) {
    event.correlationId = correlationId;
    // Endpoint configurable o Application Insights (placeholder)
    // Por ahora, solo log a consola
    console.log('[telemetry]', event);
    // TODO: enviar a endpoint si está configurado
  }

  window.onerror = function (msg, url, line, col, error) {
    sendTelemetry({ type: 'error', msg, url, line, col, error: error && error.stack });
  };
  window.onunhandledrejection = function (e) {
    sendTelemetry({ type: 'unhandledrejection', reason: e.reason });
  };

  // 2. Métricas Web Vitals (LCP, FID, CLS)
  if ('PerformanceObserver' in window) {
    try {
      const metrics = {};
      const logMetric = (name, value) => {
        metrics[name] = value;
        sendTelemetry({ type: name, value, correlationId });
      };
      // LCP
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        if (entries.length) logMetric('LCP', entries[entries.length - 1].startTime);
      }).observe({ type: 'largest-contentful-paint', buffered: true });
      // FID
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        if (entries.length) logMetric('FID', entries[0].processingStart - entries[0].startTime);
      }).observe({ type: 'first-input', buffered: true });
      // CLS
      new PerformanceObserver((entryList) => {
        let cls = 0;
        for (const entry of entryList.getEntries()) {
          if (!entry.hadRecentInput) cls += entry.value;
        }
        logMetric('CLS', cls);
      }).observe({ type: 'layout-shift', buffered: true });
    } catch (e) {
      sendTelemetry({ type: 'telemetry-error', error: e, correlationId });
    }
  }

  // 3. Health check: escucha eventos de healthcheck.js
  window.addEventListener('healthcheck-result', function (e) {
    if (e && e.detail) {
      sendTelemetry({ type: 'healthcheck', ...e.detail, correlationId });
    }
  });

  // 4. Eventos de navegación
  function sendNavigationEvent() {
    sendTelemetry({ type: 'navigation', url: location.href, ts: Date.now(), correlationId });
  }
  window.addEventListener('DOMContentLoaded', sendNavigationEvent);
  window.addEventListener('popstate', sendNavigationEvent);
  window.addEventListener('hashchange', sendNavigationEvent);
})();
