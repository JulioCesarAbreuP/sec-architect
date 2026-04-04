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
    // --- Health: fallos consecutivos, latencia, disponibilidad ---
    const last5 = healthMetrics.slice(-5);
    const failSeq = last5.filter(e => e.ok === false).length;
    const avgLatency = last5.filter(e => typeof e.latency === 'number').reduce((a,b) => a+b.latency,0) / (last5.filter(e => typeof e.latency === 'number').length||1);
    const avail = last5.filter(e => e.ok).length / (last5.length||1);
    if (failSeq > 5) signals.push('Más de 5 fallos consecutivos en healthcheck');
    else if (failSeq > 3) signals.push('Más de 3 fallos consecutivos en healthcheck');
    if (avgLatency > 1500) signals.push('Latencia media >1500ms');
    if (avail < 0.7) signals.push('Disponibilidad <70% en healthcheck');

    // --- Infraestructura: 5xx, WAF, throttling ---
    const now = Date.now();
    const lastMinWaf = infraEvents.filter(e => e.source === 'waf' && now - (e.timestamp || 0) < 60000);
    if (lastMinWaf.length > 20) signals.push('Más de 20 eventos WAF en 1 min');
    else if (lastMinWaf.length > 10) signals.push('Más de 10 eventos WAF en 1 min');
    const fd5xx = infraEvents.filter(e => e.source === 'frontdoor' && e.metadata && /^5\d\d$/.test(String(e.metadata.statusCode)));
    const fdTotal = infraEvents.filter(e => e.source === 'frontdoor').length;
    if (fdTotal > 0 && (fd5xx.length / fdTotal) > 0.05) signals.push('Más de 5% de 5xx en Front Door');
    // Throttling/anomalías (placeholder)
    const throttling = infraEvents.filter(e => e.metadata && /throttl/i.test(JSON.stringify(e.metadata)));
    if (throttling.length > 0) signals.push('Eventos de throttling detectados');

    // --- Alertas locales ---
    const now2 = Date.now();
    const critAlerts = localAlerts.filter(e => e.severity === 'critical' && now2 - (e.ts || 0) < 120000);
    const warnAlerts = localAlerts.filter(e => e.severity === 'warning' && now2 - (e.ts || 0) < 120000);
    if (critAlerts.length >= 3) signals.push('3 alertas critical en 2 min');
    if (warnAlerts.length >= 5) signals.push('5 alertas warning en 2 min');

    // --- Correlación cliente-infra ---
    const clientErrors = (timeline||[]).filter(e => e.type === 'error');
    const infra5xx = fd5xx.length;
    const wafCount = lastMinWaf.length;
    if (clientErrors.length && infra5xx && wafCount) signals.push('Error cliente + 5xx + WAF: correlación crítica');

    // --- Estado final ---
    let state = 'NORMAL';
    if (
      signals.some(s => s.includes('correlación crítica')) ||
      signals.some(s => s.includes('Más de 5 fallos')) ||
      signals.some(s => s.includes('Más de 20 eventos WAF')) ||
      signals.some(s => s.includes('3 alertas critical'))
    ) {
      state = 'CRITICAL';
    } else if (
      signals.some(s => s.includes('Más de 3 fallos')) ||
      signals.some(s => s.includes('Latencia media')) ||
      signals.some(s => s.includes('Más de 10 eventos WAF')) ||
      signals.some(s => s.includes('5 alertas warning')) ||
      signals.some(s => s.includes('Más de 5% de 5xx')) ||
      signals.some(s => s.includes('Disponibilidad <70%'))
    ) {
      state = 'DEGRADED';
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
      window.DASHBOARD_PAUSE_METRICS = true;
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
