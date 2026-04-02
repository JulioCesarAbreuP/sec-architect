# SABSA Contextual Alignment — Zero Trust Azure Lab

## Overview

SABSA (Sherwood Applied Business Security Architecture) provides a layered framework for aligning security architecture to business objectives.
This document maps the Zero Trust Azure lab controls to the **Contextual** and **Conceptual** layers of SABSA.

---

## SABSA Layers Applied

| Layer | What it answers | Lab artefact |
|-------|----------------|--------------|
| Contextual (Business) | Why are we doing this? | Business risk drivers below |
| Conceptual (Architecture) | What do we protect? | Assets and trust boundaries |
| Logical (Design) | How does it work? | Zero Trust principles |
| Physical (Technology) | With what? | Azure services |
| Component (Implementation) | How exactly? | Bicep / Terraform modules |

---

## Contextual Layer — Business Risk Drivers

| Risk | Business Impact | Likelihood |
|------|----------------|-----------|
| Credential compromise | Data breach, regulatory fine | High |
| Insider threat | IP theft, sabotage | Medium |
| Lateral movement after initial breach | Full environment compromise | High |
| Secrets leaked in code | Supply chain attack entry point | High |
| Unencrypted data in transit | Compliance violation | Medium |

---

## Conceptual Layer — Assets and Trust Boundaries

```
┌─────────────────────────────────────────────┐
│  TRUST BOUNDARY: Azure Subscription         │
│                                             │
│  ┌──────────────────────────────────────┐   │
│  │  TRUST BOUNDARY: Resource Group      │   │
│  │                                      │   │
│  │  ┌────────────────┐                  │   │
│  │  │  IDENTITY PLANE│  Entra ID        │   │
│  │  │  (Managed ID)  │  IMDS token flow │   │
│  │  └───────┬────────┘                  │   │
│  │          │ Token                     │   │
│  │  ┌───────▼────────┐                  │   │
│  │  │  NETWORK PLANE │  VNet + NSG      │   │
│  │  │  snet-app      │  Private DNS     │   │
│  │  └───────┬────────┘                  │   │
│  │          │ Private Link              │   │
│  │  ┌───────▼────────┐                  │   │
│  │  │  DATA PLANE    │  Key Vault       │   │
│  │  │  snet-pe       │  Blob Storage    │   │
│  │  └────────────────┘                  │   │
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

---

## Logical Layer — Zero Trust Controls Map

| Zero Trust Principle | SABSA Security Attribute | Control |
|---------------------|------------------------|---------|
| Verify Explicitly | Authenticity | Managed Identity + Entra ID token |
| Verify Explicitly | Non-repudiation | Key Vault AuditEvent logs |
| Least Privilege | Confidentiality | Scoped RBAC roles per resource |
| Least Privilege | Integrity | `allowSharedKeyAccess: false` |
| Assume Breach | Availability | Private endpoints eliminate public attack surface |
| Assume Breach | Auditability | Log Analytics + KQL alerts |

---

## Physical Layer — Azure Service Mapping

| Security Function | Azure Service |
|-------------------|--------------|
| Identity Provider | Microsoft Entra ID |
| Secret Store | Azure Key Vault |
| Network Segmentation | Azure Virtual Network + NSG |
| Private Connectivity | Azure Private Endpoint + Private DNS |
| Privileged Access | Azure Bastion |
| SIEM / Log Aggregation | Azure Log Analytics Workspace |
| IaC Enforcement | Bicep / Terraform + CI Validation |

---

## References

- SABSA Institute: https://sabsa.org
- Microsoft Zero Trust: https://learn.microsoft.com/security/zero-trust/
- NIST SP 800-207 Zero Trust Architecture: https://doi.org/10.6028/NIST.SP.800-207
