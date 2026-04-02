// =============================================================================
// identity.bicep — User-Assigned Managed Identity for workload authentication
// Zero Trust: no passwords, cryptographic identity, least-privilege scopes
// =============================================================================

param location string
param environment string
param prefix string

var identityName = '${prefix}-id-workload-${environment}'

// ---------------------------------------------------------------------------
// User-Assigned Managed Identity
// ---------------------------------------------------------------------------
resource managedIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: identityName
  location: location
  tags: {
    environment: environment
    purpose: 'zero-trust-workload'
  }
}

// ---------------------------------------------------------------------------
// Outputs
// ---------------------------------------------------------------------------
output identityId string = managedIdentity.id
output principalId string = managedIdentity.properties.principalId
output clientId string = managedIdentity.properties.clientId
output identityName string = managedIdentity.name
