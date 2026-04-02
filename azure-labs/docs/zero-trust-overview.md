# Zero Trust Overview — Azure Lab

## What is Zero Trust?

Zero Trust is a security model built on three core principles:

1. **Verify Explicitly** — Authenticate and authorize every request using all available signals (identity, location, device health, service, workload, data classification).
2. **Use Least Privilege Access** — Limit user and workload access with just-in-time (JIT) and just-enough-access (JEA), risk-based adaptive policies, and data protection.
3. **Assume Breach** — Minimize blast radius, segment access, verify end-to-end encryption, and use analytics to get visibility and detect threats early.

## Architecture Pillars in This Lab

| Pillar | Implementation |
|--------|---------------|
| **Identity** | User-Assigned Managed Identities; no service principal passwords |
| **Network** | Hub VNet with NSG-segmented subnets; no route to internet |
| **Data** | Storage with `allowSharedKeyAccess: false`; private endpoints only |
| **Applications** | Workloads authenticate via IMDS → Entra ID token exchange |
| **Infrastructure** | Bicep/Terraform enforced config; IaC reviewed in CI pipeline |
| **Monitoring** | All resource diagnostics → Log Analytics Workspace |

## Control Plane vs. Data Plane

```
Control Plane (Azure Resource Manager / Portal)
  Azure RBAC roles control who can manage resources.

Data Plane (Key Vault secrets API, Blob storage API)
  Azure RBAC roles control who can read/write data.
  Public access DISABLED — traffic must traverse Private Endpoint.
```

## Network Topology

```
Internet
  │
  └─► Azure Bastion (HTTPS 443) ──► AzureBastionSubnet (10.0.3.0/27)
                                           │
                               ┌───────────▼───────────┐
                               │   snet-app             │
                               │   10.0.1.0/24          │
                               │   NSG: deny-internet   │
                               └───────────┬───────────┘
                                           │  Private Link
                               ┌───────────▼───────────┐
                               │   snet-privateendpoints│
                               │   10.0.2.0/24          │
                               │   PE → Key Vault       │
                               │   PE → Blob Storage    │
                               └───────────────────────┘
```

## Threat Mitigations

| Threat | Mitigation |
|--------|-----------|
| Credential theft | No passwords — Managed Identity only |
| Secret exfiltration | Key Vault purge protection + RBAC; audit logs |
| Data exfiltration | Private endpoints; storage public access disabled |
| Lateral movement | NSG deny-internet-inbound on all compute subnets |
| Insider threat | Entra ID Conditional Access; PIM for privileged roles |
| Supply chain | IaC linted and scanned in CI (tfsec / PSRule for Azure) |

## References

- [Microsoft Zero Trust Guidance](https://learn.microsoft.com/security/zero-trust/)
- [Azure network security best practices](https://learn.microsoft.com/azure/security/fundamentals/network-best-practices)
- [Azure Key Vault security](https://learn.microsoft.com/azure/key-vault/general/security-features)
