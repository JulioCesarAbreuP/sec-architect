/**
 * osint-engine.js
 * OSINT External Attack Surface Scanner — Shodan / Criminal IP.
 * ADR-005: Shodan integration via optional CORS proxy.
 *
 * SECURITY NOTE: API keys are kept in memory only, never persisted.
 * Production deployment should route Shodan requests through a server-side proxy
 * to avoid exposing API keys in browser network traffic.
 */

const SHODAN_BASE     = "https://api.shodan.io";
const CRIMINALIP_BASE = "https://api.criminalip.io/v1";

// Ports that present significant attack surface when publicly exposed
const DANGEROUS_PORTS = new Set([21, 22, 23, 25, 53, 80, 110, 143, 443, 445, 1433, 1521, 3306, 3389, 5432, 5900, 6379, 8080, 8443, 9200, 27017, 50070]);
const CRITICAL_PORTS  = new Set([22, 23, 3389, 5900, 1433, 3306, 27017, 6379, 9200]);

// ── Shodan ───────────────────────────────────────────────────────────────────

/**
 * @param {string} target   IP address or hostname
 * @param {string} apiKey   Shodan API key (stored in memory only)
 * @param {string} [proxy]  Optional CORS proxy base URL
 */
export async function shodanScan(target, apiKey, proxy) {
  if (!apiKey) throw new Error("Shodan API key is required.");
  if (!target) throw new Error("Target IP or hostname is required.");

  const baseUrl = proxy || SHODAN_BASE;
  const url = `${baseUrl}/shodan/host/${encodeURIComponent(target)}?key=${encodeURIComponent(apiKey)}`;

  let res;
  try {
    res = await fetch(url);
  } catch (err) {
    throw new Error(`Network error contacting Shodan: ${err.message}`);
  }

  if (res.status === 404) {
    return { found: false, target, message: "Target not found in Shodan index." };
  }
  if (res.status === 401) throw new Error("Invalid Shodan API key.");
  if (res.status === 429) throw new Error("Shodan rate limit exceeded. Try again later.");
  if (!res.ok) throw new Error(`Shodan API error: HTTP ${res.status}`);

  const data = await res.json();
  return normalizeShodan(data, target);
}

function normalizeShodan(data, target) {
  const ports    = (data.ports || []).sort((a, b) => a - b);
  const vulns    = Object.keys(data.vulns || {});
  const services = (data.data || []).slice(0, 25).map(s => ({
    port:      s.port,
    transport: s.transport || "tcp",
    product:   s.product || s._shodan?.module || "unknown",
    version:   s.version || null,
    banner:    (s.data || "").replace(/\r?\n/g, " ").slice(0, 128)
  }));

  return {
    found:      true,
    target,
    ip:         data.ip_str || target,
    org:        data.org || null,
    isp:        data.isp || null,
    country:    data.country_name || null,
    city:       data.city || null,
    os:         data.os || null,
    ports,
    vulns,
    cveCount:   vulns.length,
    services,
    lastSeen:   data.last_update || null,
    hostnames:  data.hostnames || [],
    tags:       data.tags || []
  };
}

// ── Criminal IP ──────────────────────────────────────────────────────────────

export async function criminalIpScan(target, apiKey) {
  if (!apiKey) throw new Error("Criminal IP API key is required.");
  if (!target) throw new Error("Target IP is required.");

  const res = await fetch(`${CRIMINALIP_BASE}/asset/ip/report?ip=${encodeURIComponent(target)}`, {
    headers: { "x-api-key": apiKey }
  });

  if (res.status === 401) throw new Error("Invalid Criminal IP API key.");
  if (res.status === 429) throw new Error("Criminal IP rate limit exceeded.");
  if (!res.ok) throw new Error(`Criminal IP error: HTTP ${res.status}`);

  const data = await res.json();
  return normalizeCriminalIp(data, target);
}

function normalizeCriminalIp(data, target) {
  return {
    found:     true,
    target,
    score:     data.ip_scoring?.score_name || "unknown",
    riskScore: data.ip_scoring?.inbound_score || 0,
    isVpn:     Boolean(data.issues?.is_vpn),
    isTor:     Boolean(data.issues?.is_tor),
    isProxy:   Boolean(data.issues?.is_proxy),
    isHosting: Boolean(data.issues?.is_hosting),
    ports:     (data.port || []).map(p => p.port),
    country:   data.country,
    city:      data.city,
    org:       data.as_name
  };
}

// ── Risk analysis ────────────────────────────────────────────────────────────

export function buildOsintRiskSummary(result) {
  const findings = [];

  const criticalExposed = (result.ports || []).filter(p => CRITICAL_PORTS.has(p));
  const dangerousExposed = (result.ports || []).filter(p => DANGEROUS_PORTS.has(p) && !CRITICAL_PORTS.has(p));

  if (criticalExposed.length > 0) {
    findings.push({
      severity: "critical",
      finding:  `Critical ports publicly exposed: ${criticalExposed.join(", ")}`,
      mitre:    "T1021 — Remote Services / Lateral Movement"
    });
  }

  if (result.cveCount > 0) {
    findings.push({
      severity: "critical",
      finding:  `Shodan detected ${result.cveCount} CVE(s) on this host`,
      cves:     result.vulns?.slice(0, 5),
      mitre:    "T1190 — Exploit Public-Facing Application"
    });
  }

  if (dangerousExposed.length > 0) {
    findings.push({
      severity: "high",
      finding:  `High-risk ports exposed: ${dangerousExposed.join(", ")}`,
      mitre:    "T1133 — External Remote Services"
    });
  }

  if ((result.ports || []).length > 20) {
    findings.push({
      severity: "medium",
      finding:  `Large attack surface: ${result.ports.length} open ports enumerated`,
      mitre:    "T1046 — Network Service Discovery"
    });
  }

  if (result.isTor || result.isVpn) {
    findings.push({
      severity: "high",
      finding:  `Host is reachable via ${result.isTor ? "Tor" : "VPN"} — anonymisation risk`,
      mitre:    "T1090 — Proxy"
    });
  }

  const level = findings.some(f => f.severity === "critical")
    ? "critical"
    : findings.some(f => f.severity === "high")
      ? "high"
      : findings.length > 0 ? "medium" : "low";

  return { findings, level };
}

export function buildOsintNarrative(result, summary) {
  if (!result.found) return `No Shodan data found for ${result.target}.`;

  const parts = [];
  if (summary.level === "critical") {
    parts.push(`Target ${result.ip} presenta exposición CRÍTICA.`);
  }

  if (result.cveCount > 0) {
    parts.push(`${result.cveCount} CVEs conocidos detectados por Shodan — riesgo de explotación activa.`);
  }

  const critical = (result.ports || []).filter(p => CRITICAL_PORTS.has(p));
  if (critical.length) {
    parts.push(`Puertos de alto riesgo expuestos: ${critical.join(", ")} — acceso remoto sin autenticación potencial.`);
  }

  if (result.hostnames?.length > 0) {
    parts.push(`Hostnames asociados: ${result.hostnames.slice(0, 3).join(", ")}.`);
  }

  return parts.join(" ") || `Target ${result.ip} — ${result.ports?.length || 0} puertos expuestos.`;
}
