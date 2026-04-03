# Lab 05 — Monitoring y Alerting

**Dominio:** Operations / Visibility  
**Duración:** ~25 minutos

---

## Objetivos

- Enviar logs de diagnóstico desde VNet, Key Vault y Storage hacia Log Analytics.
- Escribir consultas KQL para detectar actividad sospechosa.
- Crear alertas de métricas para throttling de Key Vault e intentos no autorizados.

## Fuentes de logs

| Recurso | Categorías de logs | Métricas |
|----------|---------------|---------|
| VNet / NSG | VMProtectionAlerts | AllMetrics |
| Key Vault | AuditEvent, AzurePolicyEvaluationDetails | AllMetrics |
| Storage | (transaction metrics) | Transaction |

## Consultas KQL útiles

### 1 — Intentos de acceso no autorizado a Key Vault

```kql
AzureDiagnostics
| where ResourceType == "VAULTS"
| where ResultType == "Unauthorized" or ResultSignature == "403"
| project TimeGenerated, Resource, OperationName, CallerIPAddress, identity_claim_oid_g
| order by TimeGenerated desc
```

### 2 — Auditoría de lectura de secretos (quién leyó qué)

```kql
AzureDiagnostics
| where ResourceType == "VAULTS"
| where OperationName == "SecretGet"
| summarize ReadCount = count() by identity_claim_oid_g, Resource, bin(TimeGenerated, 1h)
| order by ReadCount desc
```

### 3 — Eventos de denegación en NSG (posible lateral movement)

```kql
AzureMetrics
| where MetricName == "PacketsDroppedInboundByNSG"
| where Count > 0
| project TimeGenerated, Resource, Count
| order by TimeGenerated desc
```

### 4 — Acceso anómalo a Storage

```kql
StorageTableLogs
| where StatusCode == 403
| project TimeGenerated, AccountName, CallerIpAddress, OperationName
| order by TimeGenerated desc
```

## Crear una alerta — acceso no autorizado a Key Vault

```powershell
az monitor metrics alert create \
  --name "kv-unauthorized-alert" \
  --resource-group rg-zerotrust-lab \
  --scopes $(az keyvault show -n <kv-name> -g rg-zerotrust-lab --query id -o tsv) \
  --condition "count requests where ResponseCode includes 401,403 > 0" \
  --window-size 5m \
  --evaluation-frequency 1m \
  --severity 2 \
  --description "Alert on unauthorized Key Vault access"
```

## Desplegar Log Analytics (si aún no existe)

```powershell
az monitor log-analytics workspace create \
  --resource-group rg-zerotrust-lab \
  --workspace-name ztlab-law-dev \
  --location eastus \
  --sku PerGB2018 \
  --retention-time 90
```

Luego, pasa el workspace ID como parámetro `logAnalyticsWorkspaceId` al desplegar los recursos del laboratorio.

## Mapeo a Zero Trust

| Principio | Control |
|-----------|---------|
| Assume Breach | El monitoreo continuo detecta anomalías de forma temprana |
| Verify Explicitly | Los audit logs registran cada solicitud autenticada |
| Least Privilege | Las alertas evidencian cuándo las cuentas exceden los patrones de acceso esperados |
