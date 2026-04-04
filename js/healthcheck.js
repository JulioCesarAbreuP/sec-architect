// js/healthcheck.js
// Health check periódico: mide latencia, disponibilidad y códigos de estado
(function () {
  // Trusted Types: evitar sinks inseguros
  if (window.trustedTypes && window.trustedTypes.createPolicy) {
    window.trustedTypes.createPolicy('healthcheckPolicy', {
      createScriptURL: (url) => url
    });
  }

  const STORAGE_KEY = 'healthcheck_results';
  const CHECK_URL = '/health.txt';
  const INTERVAL = 60000; // 60 segundos
  const MAX_RESULTS = 50; // rolling window

  function saveResult(result) {
    let arr = [];
    try { arr = JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch {}
    arr.push(result);
    if (arr.length > MAX_RESULTS) arr = arr.slice(-MAX_RESULTS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  }

  async function doCheck() {
    const start = performance.now();
    let latency = null, status = null, ok = false;
    try {
      const resp = await fetch(CHECK_URL, { cache: 'no-store' });
      latency = Math.round(performance.now() - start);
      status = resp.status;
      ok = resp.ok;
    } catch {
      latency = null;
      status = 0;
      ok = false;
    }
    saveResult({
      ts: Date.now(),
      status,
      latency,
      ok
    });
  }

  setInterval(doCheck, INTERVAL);
  doCheck();
})();
