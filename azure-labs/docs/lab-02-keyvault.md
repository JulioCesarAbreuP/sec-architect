# Lab 02 — Azure Key Vault

**Dominio:** Secrets Management  
**Duración:** ~30 minutos  
**IaC:** [bicep/keyvault.bicep](../bicep/keyvault.bicep) · [terraform/keyvault.tf](../terraform/keyvault.tf)

---

## Objetivos

- Desplegar Key Vault con autorización basada en RBAC (sin access policies legacy).
- Aplicar soft-delete (90 días) y purge protection.
- Deshabilitar todo acceso público de red.
- Asociar un private endpoint a `snet-privateendpoints`.
- Asignar roles RBAC de least privilege a la identidad administrativa y al workload.

## Decisiones clave de seguridad

| Configuración | Valor | Motivo |
|---------|-------|-----|
| `enableRbacAuthorization` | `true` | Azure RBAC centralizado en lugar de ACL por vault |
| `publicNetworkAccess` | `Disabled` | Todo el tráfico pasa solo por Private Endpoint |
| `enablePurgeProtection` | `true` | Evita la destrucción permanente de secretos |
| `softDeleteRetentionInDays` | `90` | Retención mínima para cumplimiento regulatorio |
| `networkAcls.defaultAction` | `Deny` | Denegación por defecto; los servicios de Azure exceptúan esta restricción en operaciones de ARM |

## Roles RBAC asignados

| Identidad | Rol | Alcance |
|----------|------|-------|
| Admin AAD Group | `Key Vault Administrator` | Key Vault |
| Workload Managed Identity | `Key Vault Secrets User` | Key Vault |

## Pasos de despliegue

### Bicep

```powershell
# Obtener el object ID del grupo administrador
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

## Validación

```powershell
# Confirmar que el acceso público está deshabilitado
az keyvault show \
  --name <kv-name> \
  --resource-group rg-zerotrust-lab \
  --query properties.publicNetworkAccess

# Intentar acceso desde internet (debe fallar)
curl https://<kv-name>.vault.azure.net/secrets?api-version=7.4

# Listar asignaciones de rol
az role assignment list \
  --scope $(az keyvault show --name <kv-name> --resource-group rg-zerotrust-lab --query id -o tsv) \
  --output table
```

## Ruta de auditoría (Audit Trail)

Key Vault emite logs `AuditEvent` que registran cada lectura, escritura y eliminación de secretos.
Estos eventos se envían al Log Analytics Workspace configurado en `logAnalyticsWorkspaceId`.

```kql
// KQL — mostrar las últimas 50 lecturas de secretos
AzureDiagnostics
| where ResourceType == "VAULTS"
| where OperationName == "SecretGet"
| project TimeGenerated, CallerIPAddress, identity_claim_oid_g, ResultSignature
| top 50 by TimeGenerated desc
```

## Mapeo a Zero Trust

| Principio | Control |
|-----------|---------|
| Verify Explicitly | Cada solicitud requiere un token válido de Entra ID + un rol RBAC |
| Least Privilege | El workload recibe `Secrets User` (solo lectura); el administrador recibe `Administrator` |
| Assume Breach | Audit trail completo; purge protection evita encubrimiento o eliminación definitiva |
