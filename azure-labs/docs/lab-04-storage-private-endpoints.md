# Lab 04 — Storage Account & Private Endpoints

**Domain:** Data  
**Duration:** ~30 minutes  
**IaC:** [bicep/storage.bicep](../bicep/storage.bicep) · [terraform/storage.tf](../terraform/storage.tf)

---

## Objectives

- Deploy a Storage Account with zero public internet exposure.
- Disable shared key authentication (force Entra ID / RBAC).
- Attach a private endpoint for the Blob sub-resource.
- Validate that public access attempts fail.

## Key Security Decisions

| Setting | Value | Why |
|---------|-------|-----|
| `allowBlobPublicAccess` | `false` | No anonymous read access to blobs |
| `allowSharedKeyAccess` | `false` | Connection strings and SAS tokens disabled |
| `publicNetworkAccess` | `Disabled` | All traffic via private endpoint only |
| `minimumTlsVersion` | `TLS1_2` | Prevent downgrade attacks |
| `supportsHttpsTrafficOnly` | `true` | Encrypt data in transit |

## Private Endpoint DNS Resolution

```
Workload resolves: ztlabstdev123456.blob.core.windows.net
                              │
               Azure DNS → CNAME → privatelink.blob.core.windows.net
                              │
               Private DNS Zone → 10.0.2.x  (PE NIC IP)
                              │
                       Private Endpoint NIC
                              │
                    Storage Account (private network path)
```

## RBAC Role

The workload User-Assigned Managed Identity receives **Storage Blob Data Contributor** on the storage account — sufficient to read, write, and delete blobs without a connection string.

## Upload a Blob from a VM in snet-app

```powershell
# Authenticate with managed identity (no login needed on Azure VM)
Connect-AzAccount -Identity -AccountId "<UAMI_CLIENT_ID>"

# Upload
$ctx = New-AzStorageContext -StorageAccountName "<storage-name>" -UseConnectedAccount
Set-AzStorageBlobContent -Container "data" -File ".\sample.txt" -Blob "sample.txt" -Context $ctx
```

## Validation

```powershell
# Confirm public network access is disabled
az storage account show \
  --name <storage-name> \
  --resource-group rg-zerotrust-lab \
  --query "publicNetworkAccess"

# Attempt public access (should fail with AuthorizationFailure or connection refused)
curl "https://<storage-name>.blob.core.windows.net/data/sample.txt"

# Confirm private endpoint exists
az network private-endpoint list \
  --resource-group rg-zerotrust-lab \
  --query "[?contains(name,'blob')].{name:name,state:provisioningState}" \
  --output table
```

## Zero Trust Mapping

| Principle | Control |
|-----------|---------|
| Verify Explicitly | Every blob operation requires Entra ID token + RBAC role check |
| Least Privilege | `Storage Blob Data Contributor` — cannot manage account settings |
| Assume Breach | No shared key → stolen connection string is useless; all traffic in private network |
