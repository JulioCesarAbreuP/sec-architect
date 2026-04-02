// =============================================================================
// main.bicep — Zero Trust Lab Orchestrator
// Deploys all modules in dependency order.
// =============================================================================

targetScope = 'resourceGroup'

@description('Azure region for all resources.')
param location string = resourceGroup().location

@description('Short environment tag: dev | staging | prod')
@allowed(['dev', 'staging', 'prod'])
param environment string = 'dev'

@description('Project prefix used in all resource names.')
@minLength(3)
@maxLength(8)
param prefix string = 'ztlab'

@description('Object ID of the AAD group that will be Key Vault Administrator.')
param kvAdminObjectId string

@description('Log Analytics Workspace ID for diagnostics.')
param logAnalyticsWorkspaceId string = ''

// ---------------------------------------------------------------------------
// Managed Identities  (no dependencies)
// ---------------------------------------------------------------------------
module identity 'identity.bicep' = {
  name: 'identity-deploy'
  params: {
    location: location
    environment: environment
    prefix: prefix
  }
}

// ---------------------------------------------------------------------------
// Networking  (no dependencies)
// ---------------------------------------------------------------------------
module vnet 'vnet.bicep' = {
  name: 'vnet-deploy'
  params: {
    location: location
    environment: environment
    prefix: prefix
    logAnalyticsWorkspaceId: logAnalyticsWorkspaceId
  }
}

// ---------------------------------------------------------------------------
// Key Vault  (depends on identity, vnet)
// ---------------------------------------------------------------------------
module keyvault 'keyvault.bicep' = {
  name: 'keyvault-deploy'
  params: {
    location: location
    environment: environment
    prefix: prefix
    adminObjectId: kvAdminObjectId
    managedIdentityPrincipalId: identity.outputs.principalId
    privateEndpointSubnetId: vnet.outputs.privateEndpointSubnetId
    privateDnsZoneId: vnet.outputs.kvPrivateDnsZoneId
    logAnalyticsWorkspaceId: logAnalyticsWorkspaceId
  }
}

// ---------------------------------------------------------------------------
// Storage  (depends on identity, vnet)
// ---------------------------------------------------------------------------
module storage 'storage.bicep' = {
  name: 'storage-deploy'
  params: {
    location: location
    environment: environment
    prefix: prefix
    managedIdentityPrincipalId: identity.outputs.principalId
    privateEndpointSubnetId: vnet.outputs.privateEndpointSubnetId
    privateDnsZoneId: vnet.outputs.blobPrivateDnsZoneId
    logAnalyticsWorkspaceId: logAnalyticsWorkspaceId
  }
}

// ---------------------------------------------------------------------------
// Outputs
// ---------------------------------------------------------------------------
module outputs 'outputs.bicep' = {
  name: 'outputs-collect'
  params: {
    vnetId: vnet.outputs.vnetId
    keyvaultUri: keyvault.outputs.vaultUri
    storageAccountName: storage.outputs.storageAccountName
    managedIdentityId: identity.outputs.identityId
  }
}
