# Azure Security Labs — Zero Trust Infrastructure

Hands-on labs for building a Zero Trust architecture on Azure using Bicep and Terraform.
Each lab isolates a specific security domain and maps to the SABSA contextual alignment model.

## Prerequisites

- Azure CLI >= 2.50
- Bicep CLI >= 0.22
- Terraform >= 1.6
- PowerShell >= 7.3
- An Azure subscription with Contributor + User Access Administrator rights

## Lab Overview

| Lab | Domain | IaC |
|-----|--------|-----|
| [01 — VNet & Segmentation](docs/lab-01-vnet.md) | Network | Bicep / Terraform |
| [02 — Key Vault](docs/lab-02-keyvault.md) | Secrets | Bicep / Terraform |
| [03 — Managed Identities](docs/lab-03-managed-identities.md) | Identity | Bicep / Terraform |
| [04 — Storage + Private Endpoints](docs/lab-04-storage-private-endpoints.md) | Data | Bicep / Terraform |
| [05 — Monitoring & Alerts](docs/lab-05-monitoring.md) | Operations | Bicep / Terraform |

## Quick Start

```powershell
# Bicep deployment
./scripts/deploy-bicep.ps1 -ResourceGroup "rg-zerotrust-lab" -Location "eastus"

# Terraform deployment
./scripts/deploy-terraform.ps1 -ResourceGroup "rg-zerotrust-lab" -Location "eastus"

# Cleanup all resources
./scripts/cleanup.ps1 -ResourceGroup "rg-zerotrust-lab"
```

## Architecture

All labs deploy into a shared resource group under a hub-spoke VNet topology.
See [Zero Trust Overview](docs/zero-trust-overview.md) and [SABSA Alignment](docs/sabsa-contextual-alignment.md) for design rationale.

## Repository Structure

```
azure-labs/
├── bicep/          # Modular Bicep templates
├── terraform/      # Equivalent Terraform configuration
├── diagrams/       # draw.io architecture diagrams
├── docs/           # Lab walkthroughs and design docs
└── scripts/        # Deployment and validation scripts
```

## Security Notes

- All secrets are stored in Key Vault; no credentials in code.
- Managed Identities replace service principal passwords throughout.
- Private Endpoints disable public network access on all data-plane resources.
- Diagnostic logs are forwarded to a Log Analytics Workspace.
