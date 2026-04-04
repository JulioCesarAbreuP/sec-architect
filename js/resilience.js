// js/resilience.js
// Panel de resiliencia y degradación controlada

(function () {
  if (window.trustedTypes && window.trustedTypes.createPolicy) {
    window.trustedTypes.createPolicy('resiliencePolicy', {
      createHTML: (html) => html
    });
  }
  const STATE_KEY = 'resilienceState';
  const SUBSCRIBERS = [];
  let lastState = null;
  let lastSignals = [];
  let lastChange = Date.now();

  function evaluateResilienceState({ healthMetrics = [], localAlerts = [], infraEvents = [], timeline = [] }) {
    const signals = [];
    // Health: 3+ fallos seguidos
    const last3 = healthMetrics.slice(-3);
    if (last3.length === 3 && last3.every(e => e.ok === false)) {
      signals.push('3+ health checks fallidos');
    }
    // Health: latencia alta
    if (healthMetrics.slice(-3).every(e => typeof e.latency === 'number' && e.latency > 1500)) {
      signals.push('Latencia >1500ms en health checks');
    }
    // Infra: 3+ 5xx recientes
    const err5xx = infraEvents.filter(e => e.metadata && /^5\\d\\d$/.test(String(e.metadata.statusCode)));
    if (err5xx.length >= 3) signals.push('3+ respuestas 5xx en Front Door');
    // WAF repetido
    const now = Date.now();
    const recentWaf = infraEvents.filter(e => e.source === 'waf' && now - (e.timestamp || 0) < 180000);
    if (recentWaf.length >= 3) signals.push('3+ eventos WAF en 3 min');
    // Alertas críticas
    const critAlerts = localAlerts.filter(e => e.severity === 'critical');
    if (critAlerts.length >= 2) signals.push('2+ alertas críticas recientes');
    // Timeline: correlación de eventos críticos
    const timelineCritical = (timeline||[]).filter(e => e.type === 'error' || (e.details && e.details.severity === 'critical'));
    if (timelineCritical.length >= 5) signals.push('5+ eventos críticos recientes en timeline');
    // Estado
    let state = 'NORMAL';
    if (signals.length === 0) {
      state = 'NORMAL';
    } else if (signals.length <= 2) {
      state = 'DEGRADED';
    } else {
      state = 'CRITICAL';
    }
    // Cambio de estado
    if (state !== lastState) {
      lastChange = Date.now();
      lastState = state;
      notifySubscribers();
    }
    lastSignals = signals;
    sessionStorage.setItem(STATE_KEY, JSON.stringify({ state, signals, lastChange }));
    // Degradación controlada
    applyDegradation(state);
  }

  function getResilienceState() {
    let s = { state: 'NORMAL', signals: [], lastChange: Date.now() };
    try { s = JSON.parse(sessionStorage.getItem(STATE_KEY)) || s; } catch {}
    return s;
  }

  function subscribeResilienceChanges(cb) {
    if (typeof cb === 'function') SUBSCRIBERS.push(cb);
  }

  function notifySubscribers() {
    const s = getResilienceState();
    SUBSCRIBERS.forEach(cb => { try { cb(s); } catch {} });
  }

  // Degradación controlada (cliente)
  function applyDegradation(state) {
    if (state === 'DEGRADED') {
      window.HEALTHCHECK_INTERVAL_OVERRIDE = 120000; // x2
      window.DASHBOARD_MINIMAL = true;
      window.DASHBOARD_PAUSE_METRICS = false;
      hideCriticalBanner();
    } else if (state === 'CRITICAL') {
      window.HEALTHCHECK_INTERVAL_OVERRIDE = 300000; // x5
      window.DASHBOARD_MINIMAL = true;
      window.DASHBOARD_PAUSE_METRICS = true;
      showCriticalBanner();
    } else {
      window.HEALTHCHECK_INTERVAL_OVERRIDE = undefined;
      window.DASHBOARD_MINIMAL = false;
      window.DASHBOARD_PAUSE_METRICS = false;
      hideCriticalBanner();
    }
  }
  function showCriticalBanner() {
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
  }
  function hideCriticalBanner() {
    const banner = document.getElementById('resilience-critical-banner');
    if (banner) banner.style.display = 'none';
  }

  // Exponer API global
  window.evaluateResilienceState = evaluateResilienceState;
  window.getResilienceState = getResilienceState;
  window.subscribeResilienceChanges = subscribeResilienceChanges;
})();
