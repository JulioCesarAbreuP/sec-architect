/**
 * iac-generator.js
 * Policy-as-Code Generator & Blueprint Architect.
 * Generates Terraform HCL and Bicep for secure Azure resource baselines.
 */

// ── Blueprint registry ───────────────────────────────────────────────────────

const BLUEPRINTS = {
  "secure-storage": {
    label:       "Secure Azure Storage",
    description: "HTTPS-only, private endpoint, no public blob, GRS, versioning, soft-delete.",
    terraform: `# Blueprint: Secure Azure Storage — CIS Azure Benchmark Level 2
# ADR-006: JIT remediation via CSPM platform
variable "storage_name"    {}
variable "resource_group"  {}
variable "location"        { default = "eastus" }
variable "subnet_id"       {}
variable "owner_tag"       {}

resource "azurerm_storage_account" "secure" {
  name                            = var.storage_name
  resource_group_name             = var.resource_group
  location                        = var.location
  account_tier                    = "Standard"
  account_replication_type        = "GRS"
  enable_https_traffic_only       = true
  min_tls_version                 = "TLS1_2"
  allow_nested_items_to_be_public = false
  shared_access_key_enabled       = false

  blob_properties {
    delete_retention_policy { days = 30 }
    versioning_enabled = true
    change_feed_enabled = true
  }

  network_rules {
    default_action = "Deny"
    bypass         = ["AzureServices", "Logging", "Metrics"]
  }

  identity { type = "SystemAssigned" }

  tags = {
    security_baseline = "CIS-Azure-v2-Level2"
    managed_by        = "cspm-platform"
    owner             = var.owner_tag
  }
}

resource "azurerm_private_endpoint" "storage_blob" {
  name                = "pe-\${var.storage_name}-blob"
  location            = var.location
  resource_group_name = var.resource_group
  subnet_id           = var.subnet_id

  private_service_connection {
    name                           = "psc-\${var.storage_name}"
    private_connection_resource_id = azurerm_storage_account.secure.id
    is_manual_connection           = false
    subresource_names              = ["blob"]
  }
}`,
    bicep: `// Blueprint: Secure Azure Storage — CIS Azure Benchmark Level 2
param storageName string
param location string = resourceGroup().location
param subnetId string

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: storageName
  location: location
  sku: { name: 'Standard_GRS' }
  kind: 'StorageV2'
  properties: {
    supportsHttpsTrafficOnly: true
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: false
    allowSharedKeyAccess: false
    networkAcls: {
      defaultAction: 'Deny'
      bypass: 'AzureServices'
    }
  }
}

resource blobService 'Microsoft.Storage/storageAccounts/blobServices@2023-05-01' = {
  parent: storageAccount
  name: 'default'
  properties: {
    deleteRetentionPolicy: { enabled: true, days: 30 }
    isVersioningEnabled: true
    changeFeed: { enabled: true }
  }
}

resource privateEndpoint 'Microsoft.Network/privateEndpoints@2023-09-01' = {
  name: 'pe-\${storageName}-blob'
  location: location
  properties: {
    subnet: { id: subnetId }
    privateLinkServiceConnections: [{
      name: 'psc-\${storageName}'
      properties: {
        privateLinkServiceId: storageAccount.id
        groupIds: ['blob']
      }
    }]
  }
}`
  },

  "secure-keyvault": {
    label:       "Secure Key Vault",
    description: "RBAC auth, private endpoint, purge protection, 90-day soft delete, no public access.",
    terraform: `# Blueprint: Secure Azure Key Vault — Zero Trust baseline
variable "keyvault_name"  {}
variable "resource_group" {}
variable "location"       { default = "eastus" }
variable "subnet_id"      {}

data "azurerm_client_config" "current" {}

resource "azurerm_key_vault" "secure" {
  name                        = var.keyvault_name
  location                    = var.location
  resource_group_name         = var.resource_group
  tenant_id                   = data.azurerm_client_config.current.tenant_id
  sku_name                    = "standard"
  enable_rbac_authorization   = true
  purge_protection_enabled    = true
  soft_delete_retention_days  = 90

  network_acls {
    default_action = "Deny"
    bypass         = "AzureServices"
  }

  tags = {
    security_baseline = "NIST-CSF"
    managed_by        = "cspm-platform"
  }
}

resource "azurerm_private_endpoint" "kv" {
  name                = "pe-\${var.keyvault_name}"
  location            = var.location
  resource_group_name = var.resource_group
  subnet_id           = var.subnet_id

  private_service_connection {
    name                           = "psc-\${var.keyvault_name}"
    private_connection_resource_id = azurerm_key_vault.secure.id
    is_manual_connection           = false
    subresource_names              = ["vault"]
  }
}

resource "azurerm_monitor_diagnostic_setting" "kv_diag" {
  name                       = "diag-\${var.keyvault_name}"
  target_resource_id         = azurerm_key_vault.secure.id
  log_analytics_workspace_id = var.log_workspace_id

  enabled_log { category = "AuditEvent" }
  metric { category = "AllMetrics" enabled = true }
}`,
    bicep: `// Blueprint: Secure Azure Key Vault
param keyVaultName string
param location string = resourceGroup().location
param subnetId string

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: keyVaultName
  location: location
  properties: {
    tenantId: subscription().tenantId
    sku: { family: 'A', name: 'standard' }
    enableRbacAuthorization: true
    enableSoftDelete: true
    softDeleteRetentionInDays: 90
    enablePurgeProtection: true
    networkAcls: {
      defaultAction: 'Deny'
      bypass: 'AzureServices'
    }
  }
}

resource privateEndpoint 'Microsoft.Network/privateEndpoints@2023-09-01' = {
  name: 'pe-\${keyVaultName}'
  location: location
  properties: {
    subnet: { id: subnetId }
    privateLinkServiceConnections: [{
      name: 'psc-\${keyVaultName}'
      properties: {
        privateLinkServiceId: keyVault.id
        groupIds: ['vault']
      }
    }]
  }
}`
  },

  "secure-appservice": {
    label:       "Secure App Service",
    description: "HTTPS-only, TLS 1.2+, no FTP, managed identity, diagnostics enabled.",
    terraform: `# Blueprint: Secure Azure App Service — CIS v8 Level 1
variable "app_name"        {}
variable "plan_name"       {}
variable "resource_group"  {}
variable "location"        { default = "eastus" }
variable "log_workspace_id" {}

resource "azurerm_service_plan" "secure" {
  name                = var.plan_name
  location            = var.location
  resource_group_name = var.resource_group
  os_type             = "Linux"
  sku_name            = "P1v3"
}

resource "azurerm_linux_web_app" "secure" {
  name                = var.app_name
  location            = var.location
  resource_group_name = var.resource_group
  service_plan_id     = azurerm_service_plan.secure.id
  https_only          = true

  site_config {
    minimum_tls_version       = "1.2"
    ftps_state                = "Disabled"
    http2_enabled             = true
    vnet_route_all_enabled    = true
    application_stack {
      node_version = "20-lts"
    }
  }

  identity { type = "SystemAssigned" }

  app_settings = {
    WEBSITE_RUN_FROM_PACKAGE       = "1"
    SCM_DO_BUILD_DURING_DEPLOYMENT = "false"
  }

  logs {
    http_logs {
      retention_in_days = 30
    }
  }
}

resource "azurerm_monitor_diagnostic_setting" "app_diag" {
  name                       = "diag-\${var.app_name}"
  target_resource_id         = azurerm_linux_web_app.secure.id
  log_analytics_workspace_id = var.log_workspace_id

  enabled_log { category = "AppServiceHTTPLogs" }
  enabled_log { category = "AppServiceConsoleLogs" }
  enabled_log { category = "AppServiceAuditLogs" }
  metric { category = "AllMetrics" enabled = true }
}`,
    bicep: `// Blueprint: Secure App Service
param appName string
param planName string
param location string = resourceGroup().location

resource serverFarm 'Microsoft.Web/serverfarms@2023-01-01' = {
  name: planName
  location: location
  sku: { name: 'P1v3', tier: 'PremiumV3' }
  properties: { reserved: true }
  kind: 'linux'
}

resource webApp 'Microsoft.Web/sites@2023-01-01' = {
  name: appName
  location: location
  identity: { type: 'SystemAssigned' }
  properties: {
    serverFarmId: serverFarm.id
    httpsOnly: true
    siteConfig: {
      minTlsVersion: '1.2'
      ftpsState: 'Disabled'
      http20Enabled: true
      linuxFxVersion: 'NODE|20-lts'
      vnetRouteAllEnabled: true
    }
  }
}`
  },

  "enforce-mfa": {
    label:       "Enforce MFA — Conditional Access",
    description: "Conditional Access Policy requiring MFA for all privileged admin roles.",
    terraform: `# Blueprint: Enforce MFA for Privileged Roles — Conditional Access Policy
# MITRE Mitigation: M1032 — Multi-factor Authentication
resource "azuread_conditional_access_policy" "require_mfa_admins" {
  display_name = "CSPM-Baseline: Require MFA for Privileged Roles"
  state        = "enabled"

  conditions {
    client_app_types = ["all"]

    users {
      included_roles = [
        "62e90394-69f5-4237-9190-012177145e10",  # Global Administrator
        "e8611ab8-c189-46e8-94e1-60213ab1f814",  # Privileged Role Administrator
        "b0f54661-2d74-4c50-afa3-1ec803f12bbe",  # Billing Administrator
        "9b895d92-2cd3-44c7-9d02-a6ac2d5ea5c3",  # Application Administrator
        "c4e39bd9-1100-46d3-8c65-fb160da0071f"   # Authentication Administrator
      ]
    }

    applications { included_applications = ["All"] }

    locations {
      included_locations = ["All"]
      excluded_locations = ["AllTrusted"]
    }
  }

  grant_controls {
    operator          = "OR"
    built_in_controls = ["mfa"]
  }

  session_controls {
    sign_in_frequency        = 8
    sign_in_frequency_period = "hours"
  }
}`,
    bicep: null
  },

  "zero-trust-network": {
    label:       "Zero Trust Network Baseline",
    description: "NSG with deny-all default, VNet with no public routes, DDoS protection.",
    terraform: `# Blueprint: Zero Trust Network Baseline
variable "vnet_name"      {}
variable "nsg_name"       {}
variable "resource_group" {}
variable "location"       { default = "eastus" }

resource "azurerm_network_security_group" "zero_trust" {
  name                = var.nsg_name
  location            = var.location
  resource_group_name = var.resource_group

  # Deny all inbound by default — explicit allow only
  security_rule {
    name                       = "DenyAllInbound"
    priority                   = 4096
    direction                  = "Inbound"
    access                     = "Deny"
    protocol                   = "*"
    source_port_range          = "*"
    destination_port_range     = "*"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  tags = { managed_by = "cspm-platform" }
}

resource "azurerm_virtual_network" "secure" {
  name                = var.vnet_name
  location            = var.location
  resource_group_name = var.resource_group
  address_space       = ["10.0.0.0/16"]

  ddos_protection_plan {
    id     = azurerm_network_ddos_protection_plan.main.id
    enable = true
  }
}

resource "azurerm_subnet" "private" {
  name                                          = "snet-private"
  resource_group_name                           = var.resource_group
  virtual_network_name                          = azurerm_virtual_network.secure.name
  address_prefixes                              = ["10.0.1.0/24"]
  private_endpoint_network_policies_enabled     = true
  private_link_service_network_policies_enabled = true
}`,
    bicep: `// Blueprint: Zero Trust Network Baseline
param vnetName string
param nsgName string
param location string = resourceGroup().location

resource nsg 'Microsoft.Network/networkSecurityGroups@2023-09-01' = {
  name: nsgName
  location: location
  properties: {
    securityRules: [{
      name: 'DenyAllInbound'
      properties: {
        priority: 4096
        direction: 'Inbound'
        access: 'Deny'
        protocol: '*'
        sourcePortRange: '*'
        destinationPortRange: '*'
        sourceAddressPrefix: '*'
        destinationAddressPrefix: '*'
      }
    }]
  }
}

resource vnet 'Microsoft.Network/virtualNetworks@2023-09-01' = {
  name: vnetName
  location: location
  properties: {
    addressSpace: { addressPrefixes: ['10.0.0.0/16'] }
    subnets: [{
      name: 'snet-private'
      properties: {
        addressPrefix: '10.0.1.0/24'
        networkSecurityGroup: { id: nsg.id }
        privateEndpointNetworkPolicies: 'Enabled'
      }
    }]
  }
}`
  }
};

// ── Public API ───────────────────────────────────────────────────────────────

export function listBlueprints() {
  return Object.entries(BLUEPRINTS).map(([id, bp]) => ({
    id,
    label:       bp.label,
    description: bp.description,
    hasBicep:    Boolean(bp.bicep)
  }));
}

export function generateBlueprint(blueprintId, format = "terraform") {
  const bp = BLUEPRINTS[blueprintId];
  if (!bp) throw new Error(`Blueprint "${blueprintId}" not found.`);

  const code = format === "bicep" ? bp.bicep : bp.terraform;
  if (!code) throw new Error(`Blueprint "${blueprintId}" has no ${format} implementation.`);

  return { id: blueprintId, label: bp.label, format, code };
}

/**
 * Generate contextual remediation IaC from active findings.
 * ADR-006: JIT remediation based on live CSPM scan.
 */
export function generateContextualRemediation(flags, format = "terraform") {
  const blocks = [];

  const identityToken = sanitizeToken(flags.identityToken || flags.role || "identity");
  const resourceToken = sanitizeToken(flags.resourceToken || flags.resource || "resource");

  if (!flags.mfaEnabled) {
    blocks.push(BLUEPRINTS["enforce-mfa"].terraform);
  }

  if (flags.hasDangerousRole || flags.hasExcessivePermissions) {
    blocks.push(`# Fix: Scope down excessive role — principle of least privilege
resource "azurerm_role_assignment" "scoped_least_privilege" {
  scope                = "${resourceToken}"
  role_definition_name = "Reader"
  principal_id         = "${identityToken}"
}

# Revoke overprivileged assignment (run after validating the above)
# az role assignment delete --assignee "${identityToken}" --role "Owner" --scope "${resourceToken}"`);
  }

  if (flags.targetsKeyVault) {
    blocks.push(`# Fix: Lock Key Vault against unauthorized write operations
resource "azurerm_management_lock" "kv_remediation_lock" {
  name       = "cspm-lock-${resourceToken}"
  scope      = var.key_vault_id
  lock_level = "ReadOnly"
  notes      = "CSPM automated lock — review and remove only after risk assessment"
}`);
  }

  if (flags.targetsStorage) {
    blocks.push(`# Fix: Disable public blob access on Storage Account
resource "azurerm_storage_account" "harden" {
  name                            = "${resourceToken}"
  resource_group_name             = var.resource_group
  location                        = var.location
  account_tier                    = "Standard"
  account_replication_type        = "GRS"
  allow_nested_items_to_be_public = false
  shared_access_key_enabled       = false
  min_tls_version                 = "TLS1_2"
}`);
  }

  if (blocks.length === 0) {
    blocks.push(`# No critical findings detected.
# Configuration appears compliant with current rule set.
# Continue monitoring via CSPM drift engine.`);
  }

  const joined = blocks.join("\n\n");

  if (format === "bicep") {
    return `// Auto-generated Bicep remediation — review before apply\n// Convert from Terraform HCL using: tf2bicep or az bicep decompile\n\n` + joined;
  }

  return joined;
}

function sanitizeToken(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "resource";
}
