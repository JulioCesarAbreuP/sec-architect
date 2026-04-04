# ADR-004: Microsoft Graph API Integration with PKCE OAuth2

**Date:** 2026-04-04  
**Status:** ACCEPTED  
**Author(s):** Cloud Security Team  
**Reviewed by:** Architecture Review Board  

---

## Context

The CSPM platform requires real-time access to Azure tenant identity and security posture data to:
- Fetch Conditional Access policies  
- Query Azure Activity Logs for drift detection  
- Retrieve service principal details and role assignments  
- Audit MFA configurations and permission scopes  

Direct Graph API calls provide the most authoritative source of truth versus monitoring agents or external SIEM connectors.

---

## Decision

We adopt **Microsoft Graph API** as the primary integration point for Azure tenant data, utilizing **PKCE OAuth2 flow** (RFC 7636) for browser-based authentication.

### Key Design Choices

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| **Auth Flow** | PKCE (Proof Key for Code Exchange) | Mobile/SPA-safe; avoids client secrets in browser |
| **Token Storage** | SessionStorage (auto-cleared on close) | Balances usability vs. security; no persistent disk storage |
| **Scopes** | Least-privilege (Directory.Read.All, AuditLog.Read.All) | Limits blast radius if token leaked |
| **Refresh Strategy** | Implicit (request new token on 401) | Avoids additional storage; simpler token lifecycle |
| **CSP Relaxation** | Allow `https://graph.microsoft.com` in Content-Security-Policy | Required for API calls from browser context |
| **Redirect URI** | Current page (`window.location.href`) | Works offline in GitHub Pages; no server needed |

### Flow Diagram

```
User clicks "Connect to Azure"
  ↓
Generate PKCE verifier + challenge
  ↓
Redirect to Azure AD login endpoint
  ↓
User authenticates (MFA if required)
  ↓
Consent: App requests permissions
  ↓
Redirect back with authorization code
  ↓
Exchange code + verifier for access token
  ↓
Call Graph API with Bearer token
  ↓
Cache results in-memory (SessionStorage optional)
```

---

## Consequences

### Positive

- ✅ **No backend server required** — Pure browser-based auth, works on GitHub Pages  
- ✅ **Secure token handling** — PKCE prevents authorization code injection; SessionStorage auto-clears  
- ✅ **Least-privilege scopes** — Limits data exposure if token is compromised  
- ✅ **Audit trail** — All Graph API calls logged in Azure Activity Logs  
- ✅ **Real-time data** — Direct Graph API calls vs. async syncs  

### Negative / Mitigations

- **⚠️ Consent re-prompts** — Users re-authenticate for new scopes (rare, mitigated by pre-planning scopes)  
- **⚠️ CORS/CSP stricter** — Must relax CSP for `graph.microsoft.com` (acceptable for trusted endpoint)  
- **⚠️ Token expiration** — User must manage reconnection after 1-hour token lifetime (UI alerts added)  

---

## Implementation Notes

1. **Scope List (ADR-004-APPENDIX-A):**
   - `Directory.Read.All` — Service principals, users, roles  
   - `AuditLog.Read.All` — Activity logs for drift detection  
   - `IdentityRiskEvent.Read.All` — (Optional) Risk detections  

2. **Error Handling:**
   - 401 Unauthorized → Prompt re-authentication  
   - 403 Forbidden → Log insufficient scopes; suggest admin consent  
   - Network errors → Offer synthetic demo data fallback  

3. **CSP Headers in `enterprise-command-center.html`:**
   ```html
   <meta http-equiv="Content-Security-Policy" content="
     script-src 'self' cdn.jsdelivr.net;
     connect-src 'self' https://graph.microsoft.com;
     ...
   " />
   ```

4. **Module:** [`core/azure-connector.js`](../../core/azure-connector.js)  
   - Exports: `initiateGraphLogin`, `handleAuthCallback`, `fetchConditionalAccessPolicies`, `fetchAuditLogs`, `isAuthenticated`, `disconnect`  

---

## Related Decisions

- **ADR-003** (Drift Detection Logic) — Uses Activity Logs fetched via Graph API  
- **ADR-005** (OSINT Integration) — Alternative to Graph API; Shodan for external recon  

---

## References

- [RFC 7636 — PKCE](https://tools.ietf.org/html/rfc7636)  
- [Microsoft Graph Security API Best Practices](https://docs.microsoft.com/en-us/graph/security-concept-overview)  
- [Azure AD Conditional Access via Graph](https://docs.microsoft.com/en-us/graph/api/resources/conditionalaccesspolicy)  
