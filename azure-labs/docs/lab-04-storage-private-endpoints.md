# Lab 04 — Storage Account y Private Endpoints

**Dominio:** Data  
**Duración:** ~30 minutos  
**IaC:** [bicep/storage.bicep](../bicep/storage.bicep) · [terraform/storage.tf](../terraform/storage.tf)

---

## Objetivos

- Desplegar un Storage Account con cero exposición a internet público.
- Deshabilitar la autenticación por shared key (forzar Entra ID / RBAC).
- Asociar un private endpoint al subrecurso Blob.
- Validar que los intentos de acceso público fallen.

## Decisiones clave de seguridad

| Configuración | Valor | Motivo |
|---------|-------|-----|
| `allowBlobPublicAccess` | `false` | Sin acceso de lectura anónima a blobs |
| `allowSharedKeyAccess` | `false` | Connection strings y SAS tokens deshabilitados |
| `publicNetworkAccess` | `Disabled` | Todo el tráfico pasa solo por private endpoint |
| `minimumTlsVersion` | `TLS1_2` | Evita ataques de downgrade |
| `supportsHttpsTrafficOnly` | `true` | Cifra los datos en tránsito |

## Resolución DNS de Private Endpoint

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

## Rol RBAC

La workload User-Assigned Managed Identity recibe **Storage Blob Data Contributor** sobre el storage account, suficiente para leer, escribir y eliminar blobs sin usar connection string.

## Cargar un Blob desde una VM en snet-app

```powershell
# Autenticarse con managed identity (no hace falta login en una Azure VM)
Connect-AzAccount -Identity -AccountId "<UAMI_CLIENT_ID>"

# Cargar archivo
$ctx = New-AzStorageContext -StorageAccountName "<storage-name>" -UseConnectedAccount
Set-AzStorageBlobContent -Container "data" -File ".\sample.txt" -Blob "sample.txt" -Context $ctx
```

## Validación

```powershell
# Confirmar que el acceso público de red está deshabilitado
az storage account show \
  --name <storage-name> \
  --resource-group rg-zerotrust-lab \
  --query "publicNetworkAccess"

# Intentar acceso público (debe fallar con AuthorizationFailure o conexión rechazada)
curl "https://<storage-name>.blob.core.windows.net/data/sample.txt"

# Confirmar que el private endpoint existe
az network private-endpoint list \
  --resource-group rg-zerotrust-lab \
  --query "[?contains(name,'blob')].{name:name,state:provisioningState}" \
  --output table
```

## Mapeo a Zero Trust

| Principio | Control |
|-----------|---------|
| Verify Explicitly | Cada operación sobre blobs requiere token de Entra ID + validación del rol RBAC |
| Least Privilege | `Storage Blob Data Contributor`: no puede administrar la configuración de la cuenta |
| Assume Breach | No hay shared key → una connection string robada es inútil; todo el tráfico permanece en la red privada |
