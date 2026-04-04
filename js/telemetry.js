// js/telemetry.js
// Telemetría ligera: captura de errores y métricas web vitales
(function () {
  // Trusted Types: evitar sinks inseguros
  if (window.trustedTypes && window.trustedTypes.createPolicy) {
    window.trustedTypes.createPolicy('telemetryPolicy', {
      createScriptURL: (url) => url,
      createHTML: (html) => html
    });
  }

  // 1. Captura de errores globales
  function sendTelemetry(event) {
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
        console.log(`[telemetry] ${name}:`, value);
        // TODO: preparar para envío futuro
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
      sendTelemetry({ type: 'telemetry-error', error: e });
    }
  }
})();
