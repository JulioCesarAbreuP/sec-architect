# Lab 05 — Monitoring & Alerting

**Domain:** Operations / Visibility  
**Duration:** ~25 minutes

---

## Objectives

- Forward diagnostic logs from VNet, Key Vault, and Storage to Log Analytics.
- Write KQL queries to detect suspicious activity.
- Create metric alerts for Key Vault throttling and unauthorized attempts.

## Log Sources

| Resource | Log Categories | Metrics |
|----------|---------------|---------|
| VNet / NSG | VMProtectionAlerts | AllMetrics |
| Key Vault | AuditEvent, AzurePolicyEvaluationDetails | AllMetrics |
| Storage | (transaction metrics) | Transaction |

## Useful KQL Queries

### 1 — Key Vault unauthorized access attempts

```kql
AzureDiagnostics
| where ResourceType == "VAULTS"
| where ResultType == "Unauthorized" or ResultSignature == "403"
| project TimeGenerated, Resource, OperationName, CallerIPAddress, identity_claim_oid_g
| order by TimeGenerated desc
```

### 2 — Secret read audit (who read what)

```kql
AzureDiagnostics
| where ResourceType == "VAULTS"
| where OperationName == "SecretGet"
| summarize ReadCount = count() by identity_claim_oid_g, Resource, bin(TimeGenerated, 1h)
| order by ReadCount desc
```

### 3 — NSG deny hits (potential lateral movement)

```kql
AzureMetrics
| where MetricName == "PacketsDroppedInboundByNSG"
| where Count > 0
| project TimeGenerated, Resource, Count
| order by TimeGenerated desc
```

### 4 — Storage anomalous access

```kql
StorageTableLogs
| where StatusCode == 403
| project TimeGenerated, AccountName, CallerIpAddress, OperationName
| order by TimeGenerated desc
```

## Creating an Alert — Key Vault Unauthorized Access

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

## Deploying Log Analytics (if not existing)

```powershell
az monitor log-analytics workspace create \
  --resource-group rg-zerotrust-lab \
  --workspace-name ztlab-law-dev \
  --location eastus \
  --sku PerGB2018 \
  --retention-time 90
```

Then pass the workspace ID as `logAnalyticsWorkspaceId` parameter when deploying lab resources.

## Zero Trust Mapping

| Principle | Control |
|-----------|---------|
| Assume Breach | Continuous monitoring detects anomalies early |
| Verify Explicitly | Audit logs record every authenticated request |
| Least Privilege | Alerts surface when accounts exceed expected access patterns |
