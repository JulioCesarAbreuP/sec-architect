// =============================================================================
// keyvault.bicep — Key Vault with RBAC, private endpoint, and soft-delete
// Zero Trust: no secret in code, identity-based access, private network only
// =============================================================================

param location string
param environment string
param prefix string

@description('AAD Object ID for the Key Vault Administrator role assignment.')
param adminObjectId string

@description('Principal ID of the workload managed identity.')
param managedIdentityPrincipalId string

param privateEndpointSubnetId string
param privateDnsZoneId string
param logAnalyticsWorkspaceId string = ''

var kvName = '${prefix}-kv-${environment}-${uniqueString(resourceGroup().id)}'
var kvPeName = '${prefix}-pe-kv-${environment}'

// Key Vault Administrator role definition ID (built-in)
var kvAdminRoleId = '00482a5a-887f-4fb3-b363-3b7fe8e74483'
// Key Vault Secrets User role definition ID (built-in)
var kvSecretsUserRoleId = '4633458b-17de-408a-b874-0445c86b69e6'

// ---------------------------------------------------------------------------
// Key Vault
// ---------------------------------------------------------------------------
resource keyvault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: kvName
  location: location
  properties: {
    sku: {
      family: 'A'
      name: 'standard'
    }
    tenantId: subscription().tenantId
    enableRbacAuthorization: true
    enableSoftDelete: true
    softDeleteRetentionInDays: 90
    enablePurgeProtection: true
    publicNetworkAccess: 'Disabled'
    networkAcls: {
      defaultAction: 'Deny'
      bypass: 'AzureServices'
      ipRules: []
      virtualNetworkRules: []
    }
  }
}

// ---------------------------------------------------------------------------
// RBAC — Administrator
// ---------------------------------------------------------------------------
resource kvAdminAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(keyvault.id, adminObjectId, kvAdminRoleId)
  scope: keyvault
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', kvAdminRoleId)
    principalId: adminObjectId
    principalType: 'Group'
  }
}

// RBAC — Workload identity (read secrets only)
resource kvSecretsUserAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(keyvault.id, managedIdentityPrincipalId, kvSecretsUserRoleId)
  scope: keyvault
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', kvSecretsUserRoleId)
    principalId: managedIdentityPrincipalId
    principalType: 'ServicePrincipal'
  }
}

// ---------------------------------------------------------------------------
// Private Endpoint
// ---------------------------------------------------------------------------
resource kvPrivateEndpoint 'Microsoft.Network/privateEndpoints@2023-05-01' = {
  name: kvPeName
  location: location
  properties: {
    subnet: { id: privateEndpointSubnetId }
    privateLinkServiceConnections: [
      {
        name: kvPeName
        properties: {
          privateLinkServiceId: keyvault.id
          groupIds: ['vault']
        }
      }
    ]
  }
}

resource kvPeDnsGroup 'Microsoft.Network/privateEndpoints/privateDnsZoneGroups@2023-05-01' = {
  parent: kvPrivateEndpoint
  name: 'kv-dns-group'
  properties: {
    privateDnsZoneConfigs: [
      {
        name: 'privatelink-vaultcore'
        properties: {
          privateDnsZoneId: privateDnsZoneId
        }
      }
    ]
  }
}

// ---------------------------------------------------------------------------
// Diagnostic Settings
// ---------------------------------------------------------------------------
resource kvDiag 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = if (!empty(logAnalyticsWorkspaceId)) {
  name: 'diag-kv'
  scope: keyvault
  properties: {
    workspaceId: logAnalyticsWorkspaceId
    logs: [
      { category: 'AuditEvent', enabled: true }
      { category: 'AzurePolicyEvaluationDetails', enabled: true }
    ]
    metrics: [
      { category: 'AllMetrics', enabled: true }
    ]
  }
}

// ---------------------------------------------------------------------------
// Outputs
// ---------------------------------------------------------------------------
output vaultUri string = keyvault.properties.vaultUri
output vaultName string = keyvault.name
output vaultId string = keyvault.id
