# ADR-005: Shodan/Criminal IP OSINT Integration for External Threat Recon

**Date:** 2026-04-04  
**Status:** ACCEPTED  
**Author(s):** Cloud Security Team  
**Reviewed by:** Architecture Review Board  

---

## Context

The CSPM platform's Azure-internal data (Entra ID, Activity Logs, roles) provides a complete picture of identity risk **inside** the tenant. However, SOC teams also need **external recon** to answer:

- "Is my organization's IP space exposed?"  
- "Are known-bad ports (SSH, RDP, SQL) open on my networks?"  
- "Are there CVEs in open services?"  
- "Is this domain/IP trending on threat intelligence feeds?"  

**Shodan** provides indexed Internet-wide port scan data; **Criminal IP** provides geolocation + threat scoring. Both are used for passive reconnaissance without active scanning (no WAF triggers, no IDS alerts).

---

## Decision

We integrate **Shodan API** and **Criminal IP API** as optional OSINT backends, accessible via the **OSINT Scanner tab** in the CSPM platform.

### Key Design Choices

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| **API Layer** | Client-side API calls (user provides API key) | Avoids key storage on server; user responsible for costs |
| **Auth** | API key passed in request header | Standard for Shodan/Criminal IP |
| **Proxy Support** | Optional CORS proxy (Cloudflare Workers, CORS-Anywhere) | Bypass CORS restrictions for browser requests |
| **Rate Limiting** | Client-side throttle (5s between scans) | Prevents accidental key exhaustion |
| **Caching** | 30-min in-memory cache per target | Reduces redundant API calls within session |
| **Fallback** | Synthetic demo results if API fails or unavailable | Always displays results for demo/training |

### Shodan Query Pattern

```
[target_ip_or_domain]
  ↓
GET /shodan/host/{ip}?key={apiKey}
  ↓
Parse ports, services, banners, CVEs
  ↓
Correlate with default dangerous ports (22, 3389, 445, 1433)
  ↓
Assign risk level (critical if unsafe ports exposed)
```

---

## Consequences

### Positive

- ✅ **External validation** — Confirms misconfigurations are truly externally exposed  
- ✅ **Zero additional infrastructure** — Uses existing Shodan/Criminal IP subscriptions  
- ✅ **Low-cost reconnaissance** — One API call per target (~0.01 credits on Shodan)  
- ✅ **Passive scanning** — No active reconnaissance; won't trigger WAF/IDS  
- ✅ **Narrative enrichment** — OSINT findings drive remediation recommendations  

### Negative / Mitigations

- **⚠️ API key exposure** — User must paste API key in browser (mitigated: SessionStorage only, no logging)  
- **⚠️ CORS restrictions** — Shodan may block browser requests (mitigated: optional proxy relay)  
- **⚠️ Outdated scan data** — Shodan scans every 24–90 days; may not reflect current state (mitigated: disclaimer in UI)  
- **⚠️ Accuracy** — False positives common (e.g., misconfigured proxies); recommend manual validation  

---

## Proxy Strategy

For CORS bypass, we offer an opaque proxy relay. Users can optionally configure:

1. **No proxy (direct)** — Fastest; requires Shodan to allow CORS  
2. **Cloudflare Workers** — User deploys custom worker; complete control  
3. **CORS-Anywhere** — Public relay (slower, less reliable)  

**Recommendation:** Cloudflare Worker owned by organization for compliance.

---

## Implementation Notes

1. **Module:** [`core/osint-engine.js`](../../core/osint-engine.js)  
   - Exports: `shodanScan(target, apiKey, proxy)`, `criminalIpScan(target, apiKey)`  
   - Returns: `{ ip, ports, services, data[], cves, country_code }`  

2. **Risk Summary Logic:**
   ```javascript
   const riskScore = {
     openPorts: ports.length * 5,
     dangerousPorts: [22,3389,445,1433].filter(p => ports.includes(p)).length * 15,
     vulnerabilities: cves.length * 8,
     reputation: criminalIpRiskScore * 0.1
   };
   // Total clamped to 100
   ```

3. **UI Controls:**
   - Input: Target IP/domain, Shodan API key, optional proxy URL  
   - Output: Risk summary card, open ports list, CVE list, narrative  

4. **CSP Entry:**
   ```html
   <meta http-equiv="Content-Security-Policy" content="
     connect-src 'self' 
       https://api.shodan.io
       https://api.criminalip.io
       https://your-cors-proxy.example.com;
   " />
   ```

---

## Privacy & Compliance Notes

- **No scanning without user consent** — Button-triggered only  
- **No IP logging** — Results stored in SessionStorage only  
- **Shodan ToS compliance** — Users responsible for verifying API key is licensed for organizational use  
- **Criminal IP ToS** — Geolocation data subject to export controls (check if applicable to your region)  

---

## Related Decisions

- **ADR-004** (Graph API) — Internal recon complement  
- **ADR-006** (JIT Remediation) — OSINT findings may trigger auto-remediation rules  

---

## References

- [Shodan API Docs](https://developer.shodan.io/)  
- [Criminal IP API Docs](https://www.criminalip.io/developer-api)  
- [OWASP External Reconnaissance](https://owasp.org/www-community/Recon)  
