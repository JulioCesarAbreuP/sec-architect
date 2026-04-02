// =============================================================================
// outputs.bicep — Aggregated outputs for the Zero Trust lab deployment
// =============================================================================

param vnetId string
param keyvaultUri string
param storageAccountName string
param managedIdentityId string

// All outputs bubble up from sub-modules via this passthrough module,
// making them available as a single deployment outputs object.

output vnetId string = vnetId
output keyvaultUri string = keyvaultUri
output storageAccountName string = storageAccountName
output managedIdentityId string = managedIdentityId
