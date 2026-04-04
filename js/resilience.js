// js/resilience.js
// Panel de resiliencia y degradación controlada
(function () {
  if (window.trustedTypes && window.trustedTypes.createPolicy) {
    window.trustedTypes.createPolicy('resiliencePolicy', {
      createHTML: (html) => html
    });
  }
  const STATE_KEY = 'resilience_state';
  const STATE_META_KEY = 'resilience_state_meta';
  let lastState = 'NORMAL';
  let lastChange = Date.now();
  let lastSignals = [];

  function evaluateResilience() {
    let health = [];
    try { health = JSON.parse(localStorage.getItem('healthcheck_results')) || []; } catch {}
    let alerts = [];
    try { alerts = JSON.parse(sessionStorage.getItem('local_alerts')) || []; } catch {}
    let fdLogs = [], wafLogs = [];
    const today = new Date().toISOString().slice(0, 10);
    try {
      const fd = localStorage.getItem(`fdlog_${today}`);
      fdLogs = fd ? JSON.parse(fd) : [];
    } catch {}
    try {
      const waf = localStorage.getItem(`waflog_${today}`);
      wafLogs = waf ? JSON.parse(waf) : [];
    } catch {}
    // Señales
    const signals = [];
    // Health: latencia creciente o fallos consecutivos
    const last5 = health.slice(-5);
    if (last5.length >= 3 && last5.every(e => e.ok === false)) {
      signals.push('3+ health checks fallidos');
    }
    if (last5.length >= 3 && last5.every(e => typeof e.latency === 'number' && e.latency > 1500)) {
      signals.push('Latencia >1500ms en health checks');
    }
    // Infra: picos de 5xx o throttling
    const err5xx = fdLogs.filter(e => e.metadata && /^5\d\d$/.test(String(e.metadata.statusCode)));
    if (err5xx.length >= 3) signals.push('3+ respuestas 5xx recientes en Front Door');
    // WAF repetido
    const now = Date.now();
    const recentWaf = wafLogs.filter(e => now - (e.timestamp || 0) < 180000);
    if (recentWaf.length >= 3) signals.push('3+ eventos WAF en 3 min');
    // Alertas críticas
    const critAlerts = alerts.filter(e => e.severity === 'critical');
    if (critAlerts.length >= 2) signals.push('2+ alertas críticas recientes');
    // Estado
    let state = 'NORMAL';
    if (signals.length === 0) {
      state = 'NORMAL';
    } else if (signals.length <= 2) {
      state = 'DEGRADED';
    } else {
      state = 'CRITICAL';
    }
    if (state !== lastState) {
      lastChange = Date.now();
      lastState = state;
    }
    lastSignals = signals;
    sessionStorage.setItem(STATE_KEY, state);
    sessionStorage.setItem(STATE_META_KEY, JSON.stringify({ signals, lastChange }));
  }
  // Exponer para dashboard
  window.getResilienceState = function () {
    const state = sessionStorage.getItem(STATE_KEY) || 'NORMAL';
    let meta = { signals: [], lastChange: Date.now() };
    try { meta = JSON.parse(sessionStorage.getItem(STATE_META_KEY)) || meta; } catch {}
    return { state, ...meta };
  };
  // Degradación controlada (cliente)
  function applyDegradation() {
    const { state } = window.getResilienceState();
    // DEGRADED: reducir frecuencia healthcheck
    if (state === 'DEGRADED') {
      window.HEALTHCHECK_INTERVAL_OVERRIDE = 180000; // 3 min
      window.DASHBOARD_MINIMAL = true;
    } else if (state === 'CRITICAL') {
      window.HEALTHCHECK_INTERVAL_OVERRIDE = 600000; // 10 min
      window.DASHBOARD_MINIMAL = true;
      window.DASHBOARD_PAUSE_METRICS = true;
      // Banner crítico
      let banner = document.getElementById('resilience-critical-banner');
      if (!banner) {
        banner = document.createElement('div');
        banner.id = 'resilience-critical-banner';
        banner.style.position = 'fixed';
        banner.style.top = '0';
        banner.style.left = '0';
        banner.style.right = '0';
        banner.style.zIndex = '9999';
        banner.style.background = '#c92a2a';
        banner.style.color = '#fff';
        banner.style.fontWeight = 'bold';
        banner.style.fontSize = '15px';
        banner.style.padding = '7px 0';
        banner.style.textAlign = 'center';
        banner.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
        document.body.appendChild(banner);
      }
      banner.textContent = 'Resiliencia CRÍTICA: el sistema está degradado. Algunas funciones están pausadas.';
      banner.style.display = 'block';
    } else {
      window.HEALTHCHECK_INTERVAL_OVERRIDE = undefined;
      window.DASHBOARD_MINIMAL = false;
      window.DASHBOARD_PAUSE_METRICS = false;
      const banner = document.getElementById('resilience-critical-banner');
      if (banner) banner.style.display = 'none';
    }
  }
  setInterval(evaluateResilience, 20000);
  setInterval(applyDegradation, 20000);
  evaluateResilience();
  applyDegradation();
})();
