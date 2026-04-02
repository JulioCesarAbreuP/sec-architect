// =============================================================================
// keyvault.tf — Key Vault with RBAC, soft-delete, and private endpoint
// =============================================================================

locals {
  kv_name = "${var.prefix}-kv-${var.environment}-${substr(sha256(azurerm_resource_group.lab.id), 0, 6)}"
}

resource "azurerm_key_vault" "lab" {
  name                          = local.kv_name
  location                      = azurerm_resource_group.lab.location
  resource_group_name           = azurerm_resource_group.lab.name
  tenant_id                     = data.azurerm_client_config.current.tenant_id
  sku_name                      = "standard"
  enable_rbac_authorization     = true
  soft_delete_retention_days    = 90
  purge_protection_enabled      = true
  public_network_access_enabled = false

  network_acls {
    default_action = "Deny"
    bypass         = "AzureServices"
  }
}

// Key Vault Administrator — admin group
resource "azurerm_role_assignment" "kv_admin" {
  scope                = azurerm_key_vault.lab.id
  role_definition_name = "Key Vault Administrator"
  principal_id         = var.kv_admin_object_id
}

// Key Vault Secrets User — workload managed identity
resource "azurerm_role_assignment" "kv_secrets_user" {
  scope                = azurerm_key_vault.lab.id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = azurerm_user_assigned_identity.workload.principal_id
}

// Private Endpoint
resource "azurerm_private_endpoint" "keyvault" {
  name                = "${var.prefix}-pe-kv-${var.environment}"
  location            = azurerm_resource_group.lab.location
  resource_group_name = azurerm_resource_group.lab.name
  subnet_id           = azurerm_subnet.pe.id

  private_service_connection {
    name                           = "${var.prefix}-pe-kv-${var.environment}"
    private_connection_resource_id = azurerm_key_vault.lab.id
    subresource_names              = ["vault"]
    is_manual_connection           = false
  }

  private_dns_zone_group {
    name                 = "kv-dns-group"
    private_dns_zone_ids = [azurerm_private_dns_zone.keyvault.id]
  }
}
