/**
 * threat-intel.js
 * MITRE ATT&CK (GitHub STIX) + CISA KEV live sync engine.
 * Requires connect-src allowlist: raw.githubusercontent.com, www.cisa.gov
 */

const MITRE_STIX_URL = "https://raw.githubusercontent.com/mitre/cti/master/enterprise-attack/enterprise-attack.json";
const CISA_KEV_URL   = "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json";

let _mitreCache   = null;   // Array<Technique>
let _kevCache     = null;   // Array<KEVEntry>
let _mitreVersion = null;
let _lastSync     = null;

// ── MITRE ────────────────────────────────────────────────────────────────────

function extractTechniques(stix) {
  const out = [];
  for (const obj of stix.objects || []) {
    if (obj.type !== "attack-pattern" || obj.revoked) continue;
    const ext = (obj.external_references || []).find(r => r.source_name === "mitre-attack");
    if (!ext) continue;
    out.push({
      id:          ext.external_id,
      url:         ext.url || "",
      name:        obj.name,
      description: (obj.description || "").slice(0, 240),
      platforms:   obj.x_mitre_platforms || [],
      tactics:     (obj.kill_chain_phases || []).map(p => p.phase_name),
      detection:   (obj.x_mitre_detection || "").slice(0, 200),
      isSubtech:   ext.external_id.includes(".")
    });
  }
  return out.sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * @param {Function} onProgress  Callback (message: string) => void
 */
export async function syncMitreAttack(onProgress) {
  onProgress?.("[INFO] Connecting to MITRE ATT&CK STIX feed...");

  let stix;
  try {
    const res = await fetch(MITRE_STIX_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    stix = await res.json();
  } catch (err) {
    onProgress?.(`[ERROR] MITRE sync failed: ${err.message}`);
    throw err;
  }

  const col = (stix.objects || []).find(o => o.type === "x-mitre-collection");
  _mitreVersion = col?.x_mitre_version || "unknown";
  _mitreCache   = extractTechniques(stix);
  _lastSync     = new Date().toISOString();

  const newCount = _mitreCache.filter(t => !t.isSubtech).length;
  onProgress?.(`[INFO] MITRE ATT&CK v${_mitreVersion} synced. ${_mitreCache.length} techniques (${newCount} base).`);
  return { version: _mitreVersion, count: _mitreCache.length };
}

// ── CISA KEV ─────────────────────────────────────────────────────────────────

export async function syncCisaKev(onProgress) {
  onProgress?.("[INFO] Connecting to CISA Known Exploited Vulnerabilities feed...");

  let data;
  try {
    const res = await fetch(CISA_KEV_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    data = await res.json();
  } catch (err) {
    onProgress?.(`[ERROR] CISA KEV sync failed: ${err.message}`);
    throw err;
  }

  _kevCache  = data.vulnerabilities || [];
  _lastSync  = new Date().toISOString();
  const newest = getRecentKev(7);

  onProgress?.(`[INFO] CISA KEV synced. ${_kevCache.length} entries. ${newest.length} added in last 7 days.`);
  if (newest.length > 0) {
    onProgress?.(`[ALERT] Newest KEV: ${newest[0].cveID} — ${newest[0].vendorProject} ${newest[0].product}.`);
  }

  return { count: _kevCache.length, catalogVersion: data.catalogVersion };
}

// ── Query API ────────────────────────────────────────────────────────────────

export function getMitreTechnique(id) {
  if (!_mitreCache) return null;
  return _mitreCache.find(t => t.id === id) ?? null;
}

export function searchMitreByKeyword(keyword) {
  if (!_mitreCache || !keyword) return [];
  const kw = keyword.toLowerCase();
  return _mitreCache
    .filter(t => t.name.toLowerCase().includes(kw) || t.description.toLowerCase().includes(kw))
    .slice(0, 12);
}

export function getMitreByTactic(tactic) {
  if (!_mitreCache) return [];
  return _mitreCache.filter(t => t.tactics.includes(tactic)).slice(0, 20);
}

export function getRecentKev(days = 30) {
  if (!_kevCache) return [];
  const cutoff = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
  return _kevCache
    .filter(v => (v.dateAdded || "") >= cutoff)
    .sort((a, b) => b.dateAdded.localeCompare(a.dateAdded))
    .slice(0, 30);
}

export function getTechniqueList() {
  return _mitreCache ? [..._mitreCache] : [];
}

export function isSynced() {
  return Boolean(_mitreCache && _kevCache);
}

export function getSyncStatus() {
  return {
    mitre:      Boolean(_mitreCache),
    mitreVer:   _mitreVersion,
    mitreCount: _mitreCache?.length ?? 0,
    kev:        Boolean(_kevCache),
    kevCount:   _kevCache?.length ?? 0,
    lastSync:   _lastSync
  };
}
