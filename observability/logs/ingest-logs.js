// ingest-logs.js
// Script Node.js para descargar y normalizar logs de Front Door, WAF y CDN
// Uso: node ingest-logs.js
// Requiere: AZURE_SUBSCRIPTION_ID, AZURE_RESOURCE_GROUP, AZURE_FRONTDOOR_NAME, opcional: AZURE_CDN_NAME
// No expone secretos, usa variables de entorno
// Compatible Node.js 18+

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuración desde variables de entorno
const SUBSCRIPTION = process.env.AZURE_SUBSCRIPTION_ID;
const RG = process.env.AZURE_RESOURCE_GROUP;
const FRONTDOOR = process.env.AZURE_FRONTDOOR_NAME;
const CDN = process.env.AZURE_CDN_NAME;
const OUTDIR = path.resolve(__dirname, '../../docs/evidence/logs');
const TODAY = new Date().toISOString().slice(0, 10);

if (!SUBSCRIPTION || !RG || !FRONTDOOR) {
  console.error('Faltan variables de entorno requeridas: AZURE_SUBSCRIPTION_ID, AZURE_RESOURCE_GROUP, AZURE_FRONTDOOR_NAME');
  process.exit(1);
}

if (!fs.existsSync(OUTDIR)) fs.mkdirSync(OUTDIR, { recursive: true });

// Utilidad para ejecutar CLI y parsear JSON
function az(cmd) {
  try {
    const out = execSync(`az ${cmd} -o json`, { encoding: 'utf8' });
    return JSON.parse(out);
  } catch (e) {
    console.error('Error ejecutando az', cmd, e.message);
    return [];
  }
}

// Normaliza un log a la estructura requerida
function normalizeLog(source, entry) {
  // Si el log ya trae correlationId, propagarlo
  const correlationId = entry.correlationId || (entry.metadata && entry.metadata.correlationId) || null;
  return {
    source,
    timestamp: entry.time || entry.timestamp || entry.dateTime || entry.timeGenerated || null,
    event: entry.operationName || entry.action || entry.ruleName || entry.eventName || entry.category || 'event',
    correlationId: correlationId || undefined,
    metadata: { ...entry }
  };
}

// 1. Descargar logs de Front Door (Access + Health Probe)
function getFrontDoorLogs() {
  // Consulta logs recientes de Front Door vía az monitor
  const logs = az(`monitor activity-log list --resource-group ${RG} --subscription ${SUBSCRIPTION} --max-events 100 --query "[?contains(resourceId, '${FRONTDOOR}')]"`);
  return logs.map(e => normalizeLog('frontdoor', e));
}

// 2. Descargar logs de WAF (detecciones, bloqueos)
function getWafLogs() {
  // Consulta logs recientes de WAF vía az monitor
  const logs = az(`monitor activity-log list --resource-group ${RG} --subscription ${SUBSCRIPTION} --max-events 100 --query "[?contains(resourceId, 'Microsoft.Network/frontdoors') && (contains(operationName, 'WAF') || contains(operationName, 'Firewall'))]"`);
  return logs.map(e => normalizeLog('waf', e));
}

// 3. Descargar logs de CDN (si aplica)
function getCdnLogs() {
  if (!CDN) return [];
  const logs = az(`monitor activity-log list --resource-group ${RG} --subscription ${SUBSCRIPTION} --max-events 100 --query "[?contains(resourceId, '${CDN}')]"`);
  return logs.map(e => normalizeLog('cdn', e));
}

// Guardar logs normalizados
function saveLogs(name, logs) {
  const file = path.join(OUTDIR, `${TODAY}-${name}.json`);
  fs.writeFileSync(file, JSON.stringify(logs, null, 2));
  console.log(`Guardado: ${file} (${logs.length} eventos)`);
}

// MAIN
(async function main() {
  try {
    const fdLogs = getFrontDoorLogs();
    saveLogs('frontdoor', fdLogs);
    const wafLogs = getWafLogs();
    saveLogs('waf', wafLogs);
    const cdnLogs = getCdnLogs();
    if (cdnLogs.length) saveLogs('cdn', cdnLogs);
  } catch (e) {
    console.error('Error general:', e);
    process.exit(2);
  }
})();
