// src/core/iac-engine.js
export const IaCEngine = {
    generateTerraformFix: (risk) => {
        if (risk === "IMMEDIATE_ACTION" || risk === "NSG") {
            return IaCEngine.templates.nsgLockdown;
        }
        if (risk === "IDENTITY") {
            return IaCEngine.templates.identityHardening;
        }
        if (risk === "STORAGE") {
            return IaCEngine.templates.storageSecureDefaults;
        }
        return "// No remediation template for this risk.";
    },

    generateHardenedModule: (resource) => {
        if (resource.type && resource.type.includes("networkSecurityGroup")) {
            return IaCEngine.templates.nsgLockdown;
        }
        if (resource.type && resource.type.includes("identity")) {
            return IaCEngine.templates.identityHardening;
        }
        if (resource.type && resource.type.includes("storage")) {
            return IaCEngine.templates.storageSecureDefaults;
        }
        return "// No hardened module template for this resource.";
    },

    templates: {
        nsgLockdown: `
resource "azurerm_network_security_group" "lockdown" {
  name                = "nsg-lockdown"
  location            = var.location
  resource_group_name = var.resource_group

  security_rule {
    name                       = "DenyAllInbound"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Deny"
    protocol                   = "*"
    source_port_range          = "*"
    destination_port_range     = "*"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }
}
        `.trim(),

        identityHardening: `
resource "azurerm_user_assigned_identity" "hardened" {
  name                = "identity-hardened"
  location            = var.location
  resource_group_name = var.resource_group
}

resource "azurerm_role_assignment" "identity_hardened_role" {
  scope                = azurerm_user_assigned_identity.hardened.id
  role_definition_name = "Reader"
  principal_id         = azurerm_user_assigned_identity.hardened.principal_id
}
        `.trim(),

        storageSecureDefaults: `
resource "azurerm_storage_account" "secure" {
  name                     = "securestorage${random_id.suffix.hex}"
  resource_group_name      = var.resource_group
  location                 = var.location
  account_tier             = "Standard"
  account_replication_type = "GRS"
  enable_https_traffic_only = true
  min_tls_version           = "TLS1_2"
  allow_blob_public_access  = false
  network_rules {
    default_action             = "Deny"
    bypass                     = ["AzureServices"]
    ip_rules                   = []
    virtual_network_subnet_ids = []
  }
}
        `.trim()
    }
};
