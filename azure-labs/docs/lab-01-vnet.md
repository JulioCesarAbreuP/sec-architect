# Lab 01 — Virtual Network & Network Segmentation

**Domain:** Network  
**Duration:** ~30 minutes  
**IaC:** [bicep/vnet.bicep](../bicep/vnet.bicep) · [terraform/networking.tf](../terraform/networking.tf)

---

## Objectives

- Deploy a hub VNet with three purpose-specific subnets.
- Apply NSGs that implement implicit deny for internet-sourced traffic.
- Create Private DNS Zones for Key Vault and Blob Storage.
- Enable VNet diagnostic logs to Log Analytics.

## Architecture

```
Hub VNet — 10.0.0.0/16
├── AzureBastionSubnet   10.0.3.0/27   (management)
├── snet-app             10.0.1.0/24   (workload compute)
└── snet-privateendpoints 10.0.2.0/24  (data-plane PEs)
```

## NSG Rules Explained

### snet-app NSG

| Priority | Name | Direction | Action | Notes |
|----------|------|-----------|--------|-------|
| 100 | deny-internet-inbound | Inbound | **Deny** | No direct internet exposure |
| 200 | allow-vnet-https-inbound | Inbound | Allow | VNet-to-VNet HTTPS only |

### snet-privateendpoints NSG

| Priority | Name | Direction | Action | Notes |
|----------|------|-----------|--------|-------|
| 100 | deny-internet-inbound | Inbound | **Deny** | PEs reachable only from within VNet |

## Deployment Steps

### Bicep

```powershell
az deployment group create \
  --resource-group rg-zerotrust-lab \
  --template-file bicep/vnet.bicep \
  --parameters location=eastus environment=dev prefix=ztlab
```

### Terraform

```bash
terraform -chdir=terraform init
terraform -chdir=terraform apply -target=module.networking
```

## Validation

```powershell
# Confirm subnets exist
az network vnet subnet list \
  --resource-group rg-zerotrust-lab \
  --vnet-name ztlab-vnet-dev \
  --query "[].{name:name, prefix:addressPrefix}" \
  --output table

# Confirm NSG is associated
az network vnet subnet show \
  --resource-group rg-zerotrust-lab \
  --vnet-name ztlab-vnet-dev \
  --name snet-app \
  --query networkSecurityGroup.id
```

## Zero Trust Mapping

| Principle | Control |
|-----------|---------|
| Assume Breach | Subnets isolated; east-west traffic limited |
| Verify Explicitly | Bastion requires Entra ID auth before RDP/SSH |
| Least Privilege | NSGs default-deny; only required ports open |

## Cleanup

```powershell
./scripts/cleanup.ps1 -ResourceGroup rg-zerotrust-lab
```
