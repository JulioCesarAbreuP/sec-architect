# ADR-006: Just-In-Time Remediation via GitHub Actions Webhooks

**Date:** 2026-04-04  
**Status:** ACCEPTED  
**Author(s):** Cloud Security Team  
**Reviewed by:** Architecture Review Board  

---

## Context

The CSPM platform identifies security risks (e.g., "excess permissions on service principal," "MFA disabled," "drift detected"). However, identifying risks is useless without **automated response**.

Manual remediation is slow:
1. SOC notifies infrastructure team  
2. Infrastructure team creates ticket  
3. Ticket waits in backlog  
4. **Days/weeks later**, fix is deployed  

Risk windows remain open during this delay.

**Just-In-Time (JIT) Remediation** via GitHub Actions enables:
- **Immediate response** — Fix deployed within seconds of risk detection  
- **Auditable** — All actions tracked in GitHub commit history  
- **Reversible** — Easy rollback if fix causes issues  
- **Extensible** — Teams can add custom remediation workflows  

---

## Decision

We implement **GitHub Actions webhook integration** as the remediation dispatch mechanism.

### Key Design Choices

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| **Trigger** | HTTP POST to GitHub workflow webhook (user-configured URL) | GitHub Actions is version-controlled; fits DevOps workflows |
| **Dispatch Event Type** | Custom `cspm-auto-remediate` workflow dispatch | Explicit workflow vs. generic trigger |
| **Payload Format** | JSON with `event_type`, `client_payload` | Matches GitHub Actions dispatch schema |
| **Authentication** | HTTPS only; GitHub token in workflow (not CSPM) | Leverages GitHub's auth; CSPM never holds token |
| **Prerequisites** | User must create `.github/workflows/cspm-remediate.yaml` in target repo | Gitops principle: remediation code is version-controlled |
| **Confirmation** | CSPM shows dispatch success/failure; no automatic approval | Preserves human oversight of automated responses |
| **Rollback** | GitHub Actions logs link + revert commit instructions | Team can investigate + roll back via Git |

### Remediation Dispatch Flow

```
CSPM Analyzer detects risk
  ↓
Risk score crosses threshold (e.g., > 75)
  ↓
User clicks "Auto-Remediate" button
  ↓
CSPM sends HTTP POST to GitHub webhook URL
  ↓
POST body: { 
  "event_type": "cspm-auto-remediate",
  "client_payload": { 
    "risk": { score, level, breakdown, zeroTrustScore },
    "mitre_technique": "T1078.004",
    "affected_resource": "service-principal-xyz"
  }
}
  ↓
GitHub Actions workflow triggered
  ↓
Workflow runs remediation (e.g., disable service principal, revoke permissions)
  ↓
Workflow commits changes to git repo
  ↓
Commit message: "[AUTO] CSPM Remediation: T1078.004 - Scoped role permissions"
  ↓
CSPM receives 200 OK; shows "Dispatched" status
  ↓
Team reviews commit in PR or git log
```

---

## Consequences

### Positive

- ✅ **Fast response** — Seconds from detection to remediation  
- ✅ **Auditable** — Git history = full audit trail  
- ✅ **Reversible** — Revert commit if needed  
- ✅ **Integrates with existing DevOps** — Teams already use GitHub Actions  
- ✅ **No new infrastructure** — Leverages GitHub;  no additional services  
- ✅ **Least-privilege** — Remediation code written by each team; not centralized  

### Negative / Mitigations

- **⚠️ Requires user setup** — Team must create `.github/workflows/cspm-remediate.yaml` (mitigated: template provided; docs included)  
- **⚠️ Broad permissions needed** — Workflow may require admin-level Azure credentials (mitigated: use service principal with scoped permissions; recommend per-resource service principals)  
- **⚠️ Cascading failures** — Bad fix in workflow breaks infrastructure (mitigated: stage remediation first; run as separate environment branch)  
- **⚠️ Token exposure** — Secrets in workflow could leak (mitigated: GitHub Secrets feature + OIDC Federation recommended)  

---

## Workflow Template

Teams should create `.github/workflows/cspm-remediate.yaml`:

```yaml
name: CSPM Auto-Remediate

on:
  workflow_dispatch:
    inputs:
      risk_level:
        description: Risk level
        required: true
      affected_resource:
        description: Resource affected
        required: true
      reason:
        description: Remediation reason
        required: true

jobs:
  remediate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Log remediation event
        run: |
          echo "Remediating: ${{ github.event.inputs.affected_resource }}"
          echo "Risk level: ${{ github.event.inputs.risk_level }}"
          echo "Reason: ${{ github.event.inputs.reason }}"
      
      - name: Disable service principal (example)
        env:
          AZURE_CI_CREDENTIAL: ${{ secrets.AZURE_CREDENTIALS }}
        run: |
          az login --service-principal \
            -u ${{ secrets.AZURE_CLIENT_ID }} \
            -p ${{ secrets.AZURE_CLIENT_SECRET }} \
            --tenant ${{ secrets.AZURE_TENANT_ID }}
          
          # Example: Disable service principal
          az ad app update \
            --id "${{ github.event.inputs.affected_resource }}" \
            --set "accountEnabled=false"
      
      - name: Create remediation commit
        run: |
          git config user.email "cspm-automation@company.com"
          git config user.name "CSPM Bot"
          
          # Document remediation
          echo "- Disabled ${{ github.event.inputs.affected_resource }} (Risk: ${{ github.event.inputs.risk_level }})" >> REMEDIATION_LOG.md
          
          git add REMEDIATION_LOG.md
          git commit -m "[AUTO] CSPM Remediation: ${{ github.event.inputs.reason }}"
          git push origin main
      
      - name: Report success
        run: echo "Remediation completed for ${{ github.event.inputs.affected_resource }}"
```

---

## Implementation Notes

1. **Module:** Webhook dispatch in [`main.js`](../../main.js)  
   - Function: `sendWebhook(url, payload)`  
   - Validates HTTPS, shows dispatch status  

2. **Webhook URL Format:**
   ```
   https://github.com/{owner}/{repo}/actions/workflows/cspm-remediate.yaml/dispatches
   Authorization: Bearer {github_token}
   ```
   Note: Token stored in user's GitHub account (not in CSPM)

3. **Payload Structure:**
   ```json
   {
     "ref": "main",
     "inputs": {
       "risk_level": "critical",
       "affected_resource": "sp-app-xyz",
       "reason": "Excess permissions on KeyVault access"
     }
   }
   ```

4. **Error Handling:**
   - Network error → Log and retry manually  
   - 401 Unauthorized → Invalid/expired token  
   - 422 Unprocessable Entity → Workflow not found in repo  

---

## Security Guardrails

1. **HTTPS Only** — Webhook URL must be `https://`; no HTTP  
2. **Rate Limiting** — Max 5 remediations per minute (prevents abuse)  
3. **Scope Limiting** — Remediation can only disable/modify; not delete resources  
4. **Manual Approval Option** — Future: Add 2FA approval before dispatch  
5. **Dry-Run Mode** — Test workflow outputs without committing changes  

---

## Related Decisions

- **ADR-002** (Risk Scoring Engine) — Determines if risk threshold is exceeded  
- **ADR-004** (Graph API) — Provides data for remediation context  
- **ADR-005** (OSINT) — External risk signals may trigger remediation  

---

## References

- [GitHub Actions Workflow Dispatch](https://docs.github.com/en/actions/managing-workflow-runs/manually-running-a-workflow)  
- [GitHub Actions Security Best Practices](https://docs.github.com/en/actions/security-guides)  
- [Azure CLI in GitHub Actions](https://github.com/azure/cli)  
- [Just-In-Time Access in Azure (Microsoft docs)](https://learn.microsoft.com/en-us/azure/active-directory/privileged-identity-management/pim-configure)  
