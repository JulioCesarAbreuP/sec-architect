// js/alerts.js
// Detección local de anomalías y alertas tempranas (no backend)
(function () {
  // Trusted Types: evitar sinks inseguros
  if (window.trustedTypes && window.trustedTypes.createPolicy) {
    window.trustedTypes.createPolicy('alertsPolicy', {
      createHTML: (html) => html
    });
  }

  const ALERTS_KEY = 'local_alerts';
  const MAX_ALERTS = 20;
  const ALERT_BANNER_ID = 'local-alert-banner';

  // Severidad: info, warning, critical
  function addAlert({ type, message, severity = 'warning', ts = Date.now() }) {
    let arr = [];
    try { arr = JSON.parse(sessionStorage.getItem(ALERTS_KEY)) || []; } catch {}
    arr.push({ type, message, severity, ts });
    if (arr.length > MAX_ALERTS) arr = arr.slice(-MAX_ALERTS);
    sessionStorage.setItem(ALERTS_KEY, JSON.stringify(arr));
    renderBanner(arr[arr.length - 1]);
    console.warn(`[ALERTA][${severity}]`, type, message);
  }

  // Banner visual discreto
  function renderBanner(alert) {
    let banner = document.getElementById(ALERT_BANNER_ID);
    if (!banner) {
      banner = document.createElement('div');
      banner.id = ALERT_BANNER_ID;
      banner.style.position = 'fixed';
      banner.style.top = '0';
      banner.style.left = '0';
      banner.style.right = '0';
      banner.style.zIndex = '9999';
      banner.style.background = 'linear-gradient(90deg,#fbbf24,#f87171)';
      banner.style.color = '#222';
      banner.style.fontWeight = 'bold';
      banner.style.fontSize = '15px';
      banner.style.padding = '7px 0';
      banner.style.textAlign = 'center';
      banner.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
      banner.style.display = 'none';
      document.body.appendChild(banner);
    }
    banner.textContent = `[Alerta] ${alert.type}: ${alert.message}`;
    banner.style.display = 'block';
    setTimeout(() => { if (banner) banner.style.display = 'none'; }, 9000);
  }

  // --- Detección de anomalías ---
  function checkAnomalies() {
    // 1. Errores del cliente
    let telemetry = [];
    try {
      telemetry = JSON.parse(sessionStorage.getItem('telemetry_metrics')) || [];
    } catch {}
    const recentErrors = telemetry.filter(e => e.type === 'error' || e.type === 'unhandledrejection');
    if (recentErrors.length >= 3) {
      const last3 = recentErrors.slice(-3);
      if (last3[2].ts - last3[0].ts < 120000) {
        addAlert({
          type: 'Errores cliente',
          message: 'Se detectaron 3+ errores en menos de 2 minutos.',
          severity: 'critical'
        });
      }
    }
    // 2. Picos de latencia healthcheck
    let health = [];
    try {
      health = JSON.parse(localStorage.getItem('healthcheck_results')) || [];
    } catch {}
    const highLatency = health.filter(e => typeof e.latency === 'number' && e.latency > 1200);
    if (highLatency.length >= 2 && highLatency.slice(-2).every(e => e.latency > 1200)) {
      addAlert({
        type: 'Latencia healthcheck',
        message: 'Latencia >1200ms en 2+ health checks seguidos.',
        severity: 'warning'
      });
    }
    // 3. Códigos 4xx/5xx Front Door
    let fdLogs = [];
    try {
      const today = new Date().toISOString().slice(0, 10);
      const fd = localStorage.getItem(`fdlog_${today}`);
      fdLogs = fd ? JSON.parse(fd) : [];
    } catch {}
    const errCodes = fdLogs.filter(e => e.metadata && /^[45]\d\d$/.test(String(e.metadata.statusCode)));
    if (errCodes.length >= 3) {
      addAlert({
        type: 'Códigos 4xx/5xx',
        message: 'Se detectaron 3+ respuestas 4xx/5xx recientes en Front Door.',
        severity: 'warning'
      });
    }
    // 4. Eventos WAF repetidos
    let wafLogs = [];
    try {
      const today = new Date().toISOString().slice(0, 10);
      const waf = localStorage.getItem(`waflog_${today}`);
      wafLogs = waf ? JSON.parse(waf) : [];
    } catch {}
    const now = Date.now();
    const recentWaf = wafLogs.filter(e => now - (e.timestamp || 0) < 180000);
    if (recentWaf.length >= 3) {
      addAlert({
        type: 'Eventos WAF',
        message: '3+ eventos WAF detectados en los últimos 3 minutos.',
        severity: 'info'
      });
    }
  }

  // Exponer para pruebas manuales
  window.localAlerts = {
    addAlert,
    checkAnomalies
  };

  // Chequeo periódico
  setInterval(checkAnomalies, 15000);
  checkAnomalies();
})();
