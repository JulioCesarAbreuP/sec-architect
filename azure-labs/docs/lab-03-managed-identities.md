# Lab 03 — Managed Identities

**Domain:** Identity  
**Duration:** ~20 minutes  
**IaC:** [bicep/identity.bicep](../bicep/identity.bicep) · [terraform/identity.tf](../terraform/identity.tf)

---

## Objectives

- Create a User-Assigned Managed Identity (UAMI) for workload authentication.
- Understand the difference between System-Assigned and User-Assigned identities.
- Retrieve an access token from IMDS in code — no credentials required.
- Assign the UAMI to a downstream resource (Key Vault, Storage).

## System-Assigned vs User-Assigned

| | System-Assigned | User-Assigned |
|--|----------------|--------------|
| Lifecycle | Tied to resource | Independent resource |
| Reuse across resources | No | Yes |
| Role assignments survive resource delete | No | Yes |
| Best for | Single-resource workloads | Shared infra, scale sets |

This lab uses **User-Assigned** to allow the same identity to access both Key Vault and Storage.

## How Token Acquisition Works

When a workload runs on Azure (VM, Container App, Functions):

1. Code calls `GET http://169.254.169.254/metadata/identity/oauth2/token?resource=https://vault.azure.net/&api-version=2018-02-01` (IMDS).
2. Azure returns a JWT signed by Entra ID.
3. Workload presents the JWT as `Authorization: Bearer <token>` to Key Vault/Storage.
4. The resource validates the JWT claims and checks the caller's RBAC role.

### Python Example (using `azure-identity`)

```python
from azure.identity import ManagedIdentityCredential
from azure.keyvault.secrets import SecretClient

credential = ManagedIdentityCredential(client_id="<UAMI_CLIENT_ID>")
client = SecretClient(vault_url="https://<kv-name>.vault.azure.net", credential=credential)
secret = client.get_secret("my-secret")
print(secret.value)
```

### PowerShell Example

```powershell
$token = (Invoke-RestMethod `
  -Uri "http://169.254.169.254/metadata/identity/oauth2/token?api-version=2018-02-01&resource=https://vault.azure.net/" `
  -Method GET `
  -Headers @{Metadata = "true"}).access_token

Invoke-RestMethod `
  -Uri "https://<kv-name>.vault.azure.net/secrets/my-secret?api-version=7.4" `
  -Headers @{Authorization = "Bearer $token"}
```

## Deployment Steps

### Bicep

```powershell
az deployment group create \
  --resource-group rg-zerotrust-lab \
  --template-file bicep/identity.bicep \
  --parameters location=eastus environment=dev prefix=ztlab
```

### Terraform

```bash
terraform apply -target=azurerm_user_assigned_identity.workload
```

## Validation

```powershell
az identity show \
  --name ztlab-id-workload-dev \
  --resource-group rg-zerotrust-lab \
  --query "{clientId:clientId, principalId:principalId}"
```

## Zero Trust Mapping

| Principle | Control |
|-----------|---------|
| Verify Explicitly | Cryptographic identity issued by Entra ID; no password to steal |
| Least Privilege | UAMI only receives roles it needs on specific resources |
| Assume Breach | If token is intercepted it expires in ≤1 hour; no long-lived credential |
