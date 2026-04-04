// js/timeline.js
// Línea temporal unificada de eventos observabilidad + métricas
(function () {
  if (window.trustedTypes && window.trustedTypes.createPolicy) {
    window.trustedTypes.createPolicy('timelinePolicy', {
      createHTML: (html) => html
    });
  }
  // Normaliza y fusiona eventos de todas las fuentes
  function getTimeline() {
    const timeline = [];
    // 1. Errores y métricas (telemetry.js)
    let telemetry = [];
    try { telemetry = JSON.parse(sessionStorage.getItem('telemetry_metrics')) || []; } catch {}
    telemetry.forEach(e => {
      if (e.type === 'error' || e.type === 'unhandledrejection') {
        timeline.push({
          timestamp: e.ts || e.timestamp,
          type: 'error',
          source: 'cliente',
          correlationId: e.correlationId || null,
          details: e
        });
      } else if (['LCP','FID','CLS','INP','TTFB'].includes(e.type)) {
        timeline.push({
          timestamp: e.ts || e.timestamp,
          type: 'metric',
          source: 'cliente',
          correlationId: e.correlationId || null,
          details: e
        });
      }
    });
    // 2. Health checks
    let health = [];
    try { health = JSON.parse(localStorage.getItem('healthcheck_results')) || []; } catch {}
    health.forEach(e => {
      timeline.push({
        timestamp: e.ts,
        type: 'health',
        source: 'healthcheck',
        correlationId: (sessionStorage.getItem('correlationId') || null),
        details: e
      });
    });
    // 3. Alertas locales
    let alerts = [];
    try { alerts = JSON.parse(sessionStorage.getItem('local_alerts')) || []; } catch {}
    alerts.forEach(e => {
      timeline.push({
        timestamp: e.ts,
        type: 'alert',
        source: 'alerts',
        correlationId: (sessionStorage.getItem('correlationId') || null),
        details: e
      });
    });
    // 4. Logs de infraestructura (Front Door, WAF)
    const today = new Date().toISOString().slice(0, 10);
    let fdLogs = [], wafLogs = [];
    try {
      const fd = localStorage.getItem(`fdlog_${today}`);
      fdLogs = fd ? JSON.parse(fd) : [];
    } catch {}
    try {
      const waf = localStorage.getItem(`waflog_${today}`);
      wafLogs = waf ? JSON.parse(waf) : [];
    } catch {}
    fdLogs.forEach(e => {
      timeline.push({
        timestamp: e.timestamp || e.timeGenerated || e.ts,
        type: 'infra',
        source: 'frontdoor',
        correlationId: e.correlationId || null,
        details: e
      });
    });
    wafLogs.forEach(e => {
      timeline.push({
        timestamp: e.timestamp || e.timeGenerated || e.ts,
        type: 'infra',
        source: 'waf',
        correlationId: e.correlationId || null,
        details: e
      });
    });
    // Ordenar por timestamp descendente
    timeline.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    return timeline;
  }
  window.getUnifiedTimeline = getTimeline;
})();
