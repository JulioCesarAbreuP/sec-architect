# Lab 03 — Managed Identities

**Dominio:** Identity  
**Duración:** ~20 minutos  
**IaC:** [bicep/identity.bicep](../bicep/identity.bicep) · [terraform/identity.tf](../terraform/identity.tf)

---

## Objetivos

- Crear una User-Assigned Managed Identity (UAMI) para la autenticación del workload.
- Comprender la diferencia entre identidades System-Assigned y User-Assigned.
- Obtener un access token desde IMDS en código, sin requerir credenciales.
- Asignar la UAMI a un recurso downstream (Key Vault, Storage).

## System-Assigned vs User-Assigned

| | System-Assigned | User-Assigned |
|--|----------------|--------------|
| Ciclo de vida | Ligada al recurso | Recurso independiente |
| Reutilización entre recursos | No | Sí |
| Las asignaciones de rol sobreviven a la eliminación del recurso | No | Sí |
| Mejor para | Workloads de un solo recurso | Infraestructura compartida, scale sets |

Este laboratorio usa **User-Assigned** para permitir que la misma identidad acceda tanto a Key Vault como a Storage.

## Cómo funciona la obtención de tokens

Cuando un workload se ejecuta en Azure (VM, Container App, Functions):

1. El código llama a `GET http://169.254.169.254/metadata/identity/oauth2/token?resource=https://vault.azure.net/&api-version=2018-02-01` (IMDS).
2. Azure devuelve un JWT firmado por Entra ID.
3. El workload presenta el JWT como `Authorization: Bearer <token>` ante Key Vault/Storage.
4. El recurso valida los claims del JWT y verifica el rol RBAC del llamador.

### Ejemplo en Python (usando `azure-identity`)

```python
from azure.identity import ManagedIdentityCredential
from azure.keyvault.secrets import SecretClient

credential = ManagedIdentityCredential(client_id="<UAMI_CLIENT_ID>")
client = SecretClient(vault_url="https://<kv-name>.vault.azure.net", credential=credential)
secret = client.get_secret("my-secret")
print(secret.value)
```

### Ejemplo en PowerShell

```powershell
$token = (Invoke-RestMethod `
  -Uri "http://169.254.169.254/metadata/identity/oauth2/token?api-version=2018-02-01&resource=https://vault.azure.net/" `
  -Method GET `
  -Headers @{Metadata = "true"}).access_token

Invoke-RestMethod `
  -Uri "https://<kv-name>.vault.azure.net/secrets/my-secret?api-version=7.4" `
  -Headers @{Authorization = "Bearer $token"}
```

## Pasos de despliegue

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

## Validación

```powershell
az identity show \
  --name ztlab-id-workload-dev \
  --resource-group rg-zerotrust-lab \
  --query "{clientId:clientId, principalId:principalId}"
```

## Mapeo a Zero Trust

| Principio | Control |
|-----------|---------|
| Verify Explicitly | Identidad criptográfica emitida por Entra ID; no hay contraseña que robar |
| Least Privilege | La UAMI solo recibe los roles que necesita sobre recursos específicos |
| Assume Breach | Si un token es interceptado expira en ≤1 hora; no existe una credencial de larga duración |
