# Lab 02 — Azure Key Vault

**Domain:** Secrets Management  
**Duration:** ~30 minutes  
**IaC:** [bicep/keyvault.bicep](../bicep/keyvault.bicep) · [terraform/keyvault.tf](../terraform/keyvault.tf)

---

## Objectives

- Deploy Key Vault with RBAC authorization (no legacy access policies).
- Enforce soft-delete (90 days) and purge protection.
- Disable all public network access.
- Attach a private endpoint to `snet-privateendpoints`.
- Grant least-privilege RBAC roles to admin and workload identity.

## Key Security Decisions

| Setting | Value | Why |
|---------|-------|-----|
| `enableRbacAuthorization` | `true` | Centralized Azure RBAC instead of per-vault ACLs |
| `publicNetworkAccess` | `Disabled` | All traffic via Private Endpoint only |
| `enablePurgeProtection` | `true` | Prevents permanent secret destruction |
| `softDeleteRetentionInDays` | `90` | Minimum retention for regulatory compliance |
| `networkAcls.defaultAction` | `Deny` | Deny-by-default; Azure services bypass for ARM operations |

## RBAC Roles Assigned

| Identity | Role | Scope |
|----------|------|-------|
| Admin AAD Group | `Key Vault Administrator` | Key Vault |
| Workload Managed Identity | `Key Vault Secrets User` | Key Vault |

## Deployment Steps

### Bicep

```powershell
# Get admin group object ID
$adminOid = (az ad group show --group "kv-admins" --query id -o tsv)

az deployment group create \
  --resource-group rg-zerotrust-lab \
  --template-file bicep/main.bicep \
  --parameters bicep/parameters.json \
  --parameters kvAdminObjectId=$adminOid
```

### Terraform

```bash
terraform apply \
  -var="kv_admin_object_id=$(az ad group show --group kv-admins --query id -o tsv)"
```

## Validation

```powershell
# Confirm public access is disabled
az keyvault show \
  --name <kv-name> \
  --resource-group rg-zerotrust-lab \
  --query properties.publicNetworkAccess

# Attempt access from internet (should fail)
curl https://<kv-name>.vault.azure.net/secrets?api-version=7.4

# List role assignments
az role assignment list \
  --scope $(az keyvault show --name <kv-name> --resource-group rg-zerotrust-lab --query id -o tsv) \
  --output table
```

## Audit Trail

Key Vault emits `AuditEvent` logs that record every secret read, write, and delete.
These are forwarded to the Log Analytics Workspace configured in `logAnalyticsWorkspaceId`.

```kql
// KQL — show last 50 secret reads
AzureDiagnostics
| where ResourceType == "VAULTS"
| where OperationName == "SecretGet"
| project TimeGenerated, CallerIPAddress, identity_claim_oid_g, ResultSignature
| top 50 by TimeGenerated desc
```

## Zero Trust Mapping

| Principle | Control |
|-----------|---------|
| Verify Explicitly | Every request requires valid Entra ID token + RBAC role |
| Least Privilege | Workload gets `Secrets User` (read only); admin gets `Administrator` |
| Assume Breach | Complete audit trail; purge protection prevents cover-up |
