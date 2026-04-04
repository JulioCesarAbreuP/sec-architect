// js/observability-dashboard.js
// Dashboard de salud y métricas: lee métricas de localStorage/sessionStorage y endpoint, renderiza gráficos simples
(function () {
  // Trusted Types: evitar sinks inseguros
  if (window.trustedTypes && window.trustedTypes.createPolicy) {
    window.trustedTypes.createPolicy('obsDashboardPolicy', {
      createHTML: (html) => html
    });
  }

  // Utilidades
  function safeParse(json) {
    try { return JSON.parse(json); } catch { return null; }
  }

  // Leer métricas locales
  function getLocalMetrics() {
    const local = safeParse(localStorage.getItem('telemetry_metrics')) || [];
    const session = safeParse(sessionStorage.getItem('telemetry_metrics')) || [];
    return local.concat(session);
  }

  // Consultar endpoint si está definido
  async function getRemoteMetrics(endpoint) {
    if (!endpoint) return [];
    try {
      const resp = await fetch(endpoint, { credentials: 'omit', cache: 'no-store' });
      if (!resp.ok) throw new Error('offline');
      return await resp.json();
    } catch {
      return null; // null = offline
    }
  }

  // Renderizar estado endpoint
  function renderStatus(online) {
    const el = document.getElementById('obs-endpoint-status');
    el.textContent = online ? 'Online' : 'Offline';
    el.className = online ? 'online' : 'offline';
  }

  // Renderizar estadísticas
  function renderStats(metrics) {
    const errors = metrics.filter(e => e.type === 'client_error' || e.type === 'unhandledrejection');
    const lcp = metrics.filter(e => e.type === 'LCP').map(e => e.data.value);
    const fid = metrics.filter(e => e.type === 'FID').map(e => e.data.value);
    const cls = metrics.filter(e => e.type === 'CLS').map(e => e.data.value);
    const inp = metrics.filter(e => e.type === 'INP').map(e => e.data.value);
    const ttfb = metrics.filter(e => e.type === 'TTFB').map(e => e.data.value);

    function avg(arr) { return arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2) : '-'; }

    document.getElementById('obs-err-count').textContent = errors.length;
    document.getElementById('obs-lcp-avg').textContent = avg(lcp);
    document.getElementById('obs-fid-avg').textContent = avg(fid);
    document.getElementById('obs-cls-avg').textContent = avg(cls);
    document.getElementById('obs-inp-avg').textContent = avg(inp);
    document.getElementById('obs-ttfb-avg').textContent = avg(ttfb);

    // Últimos eventos
    const last = metrics.slice(-5).reverse();
    const tbody = document.getElementById('obs-last-events');
    tbody.innerHTML = '';
    last.forEach(e => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${e.type}</td><td>${e.ts ? new Date(e.ts).toLocaleTimeString() : ''}</td><td>${JSON.stringify(e.data)}</td>`;
      tbody.appendChild(tr);
    });
  }

  // Renderizar gráfico simple de barras
  function renderBarChart(id, data, label) {
    const canvas = document.getElementById(id);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const w = canvas.width, h = canvas.height;
    const max = Math.max(...data, 1);
    const barW = Math.max(8, w / Math.max(data.length, 1));
    ctx.fillStyle = '#4a90e2';
    data.forEach((v, i) => {
      const bh = (v / max) * (h - 20);
      ctx.fillRect(i * barW, h - bh, barW - 2, bh);
    });
    ctx.fillStyle = '#222';
    ctx.font = '10px sans-serif';
    ctx.fillText(label, 4, 12);
  }

  // Actualizar dashboard
  async function updateDashboard() {
    const endpoint = window.TELEMETRY_DASHBOARD_ENDPOINT || null;
    let metrics = getLocalMetrics();
    let online = false;
    if (endpoint) {
      const remote = await getRemoteMetrics(endpoint);
      if (remote && Array.isArray(remote)) {
        metrics = metrics.concat(remote);
        online = true;
      } else if (remote === null) {
        online = false;
      }
    }
    renderStatus(online);
    renderStats(metrics);
    renderBarChart('obs-lcp-chart', metrics.filter(e => e.type === 'LCP').map(e => e.data.value), 'LCP');
    renderBarChart('obs-fid-chart', metrics.filter(e => e.type === 'FID').map(e => e.data.value), 'FID');
    renderBarChart('obs-cls-chart', metrics.filter(e => e.type === 'CLS').map(e => e.data.value), 'CLS');
    renderBarChart('obs-inp-chart', metrics.filter(e => e.type === 'INP').map(e => e.data.value), 'INP');
    renderBarChart('obs-ttfb-chart', metrics.filter(e => e.type === 'TTFB').map(e => e.data.value), 'TTFB');
  }

  // Actualización periódica
  setInterval(updateDashboard, 4000);
  updateDashboard();
})();
