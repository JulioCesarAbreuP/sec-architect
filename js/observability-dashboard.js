      // --- Panel de resiliencia modular ---
      function loadResilienceState() {
        if (window.getResilienceState) return window.getResilienceState();
        return { state: 'NORMAL', signals: [], lastChange: Date.now() };
      }

      function renderResiliencePanel() {
        const { state, signals, lastChange } = loadResilienceState();
        const badge = document.getElementById('resilience-state-badge');
        if (badge) {
          badge.textContent = state;
          badge.style.background = state==='CRITICAL' ? '#c92a2a' : state==='DEGRADED' ? '#fbbf24' : '#e9ecef';
          badge.style.color = state==='CRITICAL' ? '#fff' : state==='DEGRADED' ? '#222' : '#222';
        }
        const lastChangeEl = document.getElementById('resilience-lastchange');
        if (lastChangeEl) lastChangeEl.textContent = lastChange ? new Date(lastChange).toLocaleTimeString() : '-';
        const signalsEl = document.getElementById('resilience-signals-list');
        if (signalsEl) {
          signalsEl.innerHTML = '';
          (signals||[]).forEach(s => {
            const li = document.createElement('li');
            li.textContent = s;
            signalsEl.appendChild(li);
          });
        }
      }

      // Watcher en tiempo real
      if (window.subscribeResilienceChanges) {
        window.subscribeResilienceChanges(renderResiliencePanel);
      }
    // --- Panel de resiliencia modular ---
    function loadResilienceState() {
      if (window.getResilienceState) return window.getResilienceState();
      return { state: 'NORMAL', signals: [], lastChange: Date.now() };
    }

    function renderResiliencePanel() {
      const { state, signals, lastChange } = loadResilienceState();
      const badge = document.getElementById('resilience-state-badge');
      if (badge) {
        badge.textContent = state;
        badge.style.background = state==='CRITICAL' ? '#c92a2a' : state==='DEGRADED' ? '#fbbf24' : '#e9ecef';
        badge.style.color = state==='CRITICAL' ? '#fff' : state==='DEGRADED' ? '#222' : '#222';
      }
      const lastChangeEl = document.getElementById('resilience-lastchange');
      if (lastChangeEl) lastChangeEl.textContent = lastChange ? new Date(lastChange).toLocaleTimeString() : '-';
      const signalsEl = document.getElementById('resilience-signals-list');
      if (signalsEl) {
        signalsEl.innerHTML = '';
        (signals||[]).forEach(s => {
          const li = document.createElement('li');
          li.textContent = s;
          signalsEl.appendChild(li);
        });
      }
    }

    // Watcher en tiempo real
    if (window.subscribeResilienceChanges) {
      window.subscribeResilienceChanges(renderResiliencePanel);
    }
  // --- Línea temporal unificada ---
  function renderTimeline() {
    if (!window.getUnifiedTimeline) return;
    const filter = (document.getElementById('timeline-filter')||{}).value || 'all';
    const timeline = window.getUnifiedTimeline();
    const list = document.getElementById('timeline-list');
    if (!list) return;
    list.innerHTML = '';
    (timeline||[]).filter(e => filter==='all'||e.type===filter).slice(0,30).forEach(ev => {
      const li = document.createElement('li');
      li.style.borderLeft = '4px solid ' + ({error:'#f87171',metric:'#38bdf8',health:'#fbbf24',alert:'#facc15',infra:'#6366f1'}[ev.type]||'#bbb');
      li.style.marginBottom = '0.7em';
      li.style.padding = '0.4em 0.7em';
      li.style.background = '#fff';
      li.style.borderRadius = '6px';
      li.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)';
      li.innerHTML = `<span style="font-size:12px;font-weight:bold;">${ev.type.toUpperCase()}</span> <span style="color:#888;font-size:12px;">[${ev.source}]</span> <span style="font-size:12px;">${ev.timestamp ? new Date(ev.timestamp).toLocaleTimeString() : ''}</span><br><span style="font-size:13px;">${ev.details && ev.details.message ? ev.details.message : (ev.details && ev.details.event ? ev.details.event : JSON.stringify(ev.details))}</span>`;
      if (ev.correlationId) li.innerHTML += `<br><span style="font-size:11px;color:#888;">correlationId: ${ev.correlationId}</span>`;
      list.appendChild(li);
    });
  }

  document.addEventListener('DOMContentLoaded', function() {
    const sel = document.getElementById('timeline-filter');
    if (sel) sel.onchange = renderTimeline;
  });

  // --- Panel de resiliencia ---
  function renderResilience() {
    if (!window.getResilienceState) return;
    const { state, signals, lastChange } = window.getResilienceState();
    const stateEl = document.getElementById('resilience-state');
    if (stateEl) {
      stateEl.textContent = state;
      stateEl.style.color = state==='CRITICAL' ? '#c92a2a' : state==='DEGRADED' ? '#fbbf24' : '#2b8a3e';
    }
    const lastChangeEl = document.getElementById('resilience-lastchange');
    if (lastChangeEl) lastChangeEl.textContent = lastChange ? new Date(lastChange).toLocaleTimeString() : '-';
    const signalsEl = document.getElementById('resilience-signals');
    if (signalsEl) {
      signalsEl.innerHTML = '';
      (signals||[]).forEach(s => {
        const li = document.createElement('li');
        li.textContent = s;
        signalsEl.appendChild(li);
      });
    }
  }
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

  // --- Infraestructura: lectura y renderizado de logs ---
  async function loadInfrastructureLogs() {
    // Utilidad para anonimizar IPs
    function anonymizeIP(ip) {
      if (!ip) return '';
      return ip.replace(/\d+$/, 'x');
    }

    // Cargar logs locales
    async function fetchLog(file) {
      try {
        const resp = await fetch(file, { cache: 'no-store' });
        if (!resp.ok) return [];
        return await resp.json();
      } catch { return []; }
    }

    // Paths relativos para entorno estático
    const base = '../docs/evidence/logs/';
    const today = new Date().toISOString().slice(0, 10);
    const files = [
      `${base}${today}-frontdoor.json`,
      `${base}${today}-waf.json`,
      `${base}${today}-cdn.json`
    ];
    const [fd, waf, cdn] = await Promise.all(files.map(fetchLog));

    // --- Renderizar WAF ---
    const wafEvents = (waf || []).slice(-5).map(e => ({
      ...e,
      metadata: { ...e.metadata, clientIP: anonymizeIP(e.metadata.clientIP) }
    }));
    const wafTbody = document.getElementById('infra-waf-events');
    if (wafTbody) {
      wafTbody.innerHTML = '';
      wafEvents.forEach(e => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${e.event}</td><td>${e.timestamp ? new Date(e.timestamp).toLocaleTimeString() : ''}</td><td>${JSON.stringify(e.metadata)}</td>`;
        wafTbody.appendChild(tr);
      });
    }

    // --- Renderizar códigos de estado Front Door ---
    const statusCodes = (fd || [])
      .filter(e => e.metadata && e.metadata.statusCode)
      .slice(-10)
      .map(e => ({
        code: e.metadata.statusCode,
        uri: e.metadata.requestUri || '',
        time: e.timestamp ? new Date(e.timestamp).toLocaleTimeString() : ''
      }));
    const fdTbody = document.getElementById('infra-fd-status');
    if (fdTbody) {
      fdTbody.innerHTML = '';
      statusCodes.forEach(e => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${e.code}</td><td>${e.uri}</td><td>${e.time}</td>`;
        fdTbody.appendChild(tr);
      });
    }

    // --- Estadísticas de tráfico (requests/minuto) ---
    // Agrupar por minuto
    const reqs = (fd || []).filter(e => e.metadata && e.metadata.statusCode);
    const traffic = {};
    reqs.forEach(e => {
      const min = e.timestamp ? e.timestamp.slice(0,16) : '';
      if (!traffic[min]) traffic[min] = 0;
      traffic[min]++;
    });
    const trafficArr = Object.entries(traffic).map(([minute, count]) => ({ minute, count }));
    const trafficTbody = document.getElementById('infra-traffic-stats');
    if (trafficTbody) {
      trafficTbody.innerHTML = '';
      trafficArr.slice(-10).forEach(e => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${e.minute.replace('T',' ')}</td><td>${e.count}</td>`;
        trafficTbody.appendChild(tr);
      });
    }
  }

  // --- Alertas locales: renderizar sección de alertas ---
  function renderAlerts() {
    let arr = [];
    try { arr = JSON.parse(sessionStorage.getItem('local_alerts')) || []; } catch {}
    const tbody = document.getElementById('alerts-table');
    if (tbody) {
      tbody.innerHTML = '';
      arr.slice(-10).reverse().forEach(e => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${e.type}</td><td>${e.message}</td><td><span style="font-weight:bold;color:${e.severity==='critical'?'#f87171':e.severity==='warning'?'#fbbf24':'#38bdf8'}">${e.severity}</span></td><td>${e.ts ? new Date(e.ts).toLocaleTimeString() : ''}</td>`;
        tbody.appendChild(tr);
      });
    }
  }

  // Limpiar alertas
  function clearAlerts() {
    sessionStorage.removeItem('local_alerts');
    renderAlerts();
  }

  // Botón limpiar alertas
  document.addEventListener('DOMContentLoaded', function() {
    const btn = document.getElementById('clear-alerts-btn');
    if (btn) btn.onclick = clearAlerts;
  });
  function renderHealthcheck() {
    let arr = [];
    try { arr = JSON.parse(localStorage.getItem('healthcheck_results')) || []; } catch {}
    const tbody = document.getElementById('healthcheck-status');
    if (tbody) {
      tbody.innerHTML = '';
      arr.slice(-10).reverse().forEach(e => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${e.ts ? new Date(e.ts).toLocaleTimeString() : ''}</td><td>${e.status}</td><td>${e.latency ?? '-'}</td>`;
        tbody.appendChild(tr);
      });
    }
    // Latencia media
    const latArr = arr.filter(e => typeof e.latency === 'number').map(e => e.latency);
    const avg = latArr.length ? (latArr.reduce((a,b)=>a+b,0)/latArr.length).toFixed(2) : '-';
    const pct = arr.length ? Math.round(arr.filter(e => e.ok).length * 100 / arr.length) : '-';
    const latSpan = document.getElementById('health-latency-avg');
    const pctSpan = document.getElementById('health-availability-pct');
    if (latSpan) latSpan.textContent = avg;
    if (pctSpan) pctSpan.textContent = pct;
  }

  // --- Correlación de eventos cliente ↔ infraestructura ---
  async function renderCorrelation() {
    // Cargar métricas cliente (sessionStorage/localStorage)
    const clientMetrics = (function() {
      const safeParse = (json) => { try { return JSON.parse(json); } catch { return []; } };
      const local = safeParse(localStorage.getItem('telemetry_metrics')) || [];
      const session = safeParse(sessionStorage.getItem('telemetry_metrics')) || [];
      return local.concat(session);
    })();
    // Cargar logs infra
    const base = '../docs/evidence/logs/';
    const today = new Date().toISOString().slice(0, 10);
    const files = [
      `${base}${today}-frontdoor.json`,
      `${base}${today}-waf.json`,
      `${base}${today}-cdn.json`
    ];
    const [fd, waf, cdn] = await Promise.all(files.map(async (file) => {
      try { const resp = await fetch(file, { cache: 'no-store' }); if (!resp.ok) return []; return await resp.json(); } catch { return []; }
    }));
    const infraLogs = ([]).concat(fd||[], waf||[], cdn||[]);
    // Indexar por correlationId
    const clientByCid = {};
    clientMetrics.forEach(e => {
      if (e.correlationId) {
        if (!clientByCid[e.correlationId]) clientByCid[e.correlationId] = [];
        clientByCid[e.correlationId].push({ ...e, source: 'cliente' });
      }
    });
    const infraByCid = {};
    infraLogs.forEach(e => {
      if (e.correlationId) {
        if (!infraByCid[e.correlationId]) infraByCid[e.correlationId] = [];
        infraByCid[e.correlationId].push({ ...e, source: e.source || 'infra' });
      }
    });
    // Buscar correlationIds presentes en ambos lados
    const intersectCids = Object.keys(clientByCid).filter(cid => infraByCid[cid]);
    // Construir filas para la tabla
    const rows = [];
    intersectCids.forEach(cid => {
      clientByCid[cid].forEach(ev => {
        rows.push({ correlationId: cid, type: ev.type, source: 'cliente', ts: ev.ts || ev.timestamp, details: ev });
      });
      infraByCid[cid].forEach(ev => {
        rows.push({ correlationId: cid, type: ev.event, source: ev.source, ts: ev.timestamp, details: ev });
      });
    });
    // Ordenar por timestamp descendente y limitar
    rows.sort((a,b) => (b.ts||0)-(a.ts||0));
    const limited = rows.slice(0, 20);
    // Renderizar
    const tbody = document.getElementById('correlation-table');
    if (tbody) {
      tbody.innerHTML = '';
      limited.forEach(e => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${e.correlationId}</td><td>${e.type}</td><td>${e.source}</td><td>${e.ts ? new Date(e.ts).toLocaleTimeString() : ''}</td><td><pre style="white-space:pre-wrap;font-size:11px;max-width:320px;overflow-x:auto;">${JSON.stringify(e.details, null, 1)}</pre></td>`;
        tbody.appendChild(tr);
      });
    }
  }

  // Actualización periódica
  setInterval(updateDashboard, 4000);
  setInterval(loadInfrastructureLogs, 6000);
  setInterval(renderHealthcheck, 5000);
  setInterval(renderCorrelation, 7000);
  setInterval(renderAlerts, 5000);
  setInterval(renderTimeline, 6000);
  setInterval(renderResilience, 8000);
  updateDashboard();
  loadInfrastructureLogs();
  renderHealthcheck();
  renderCorrelation();
  renderAlerts();
  renderTimeline();
  renderResilience();
})();
