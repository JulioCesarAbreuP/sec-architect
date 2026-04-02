// =============================================================================
// storage.tf — Storage Account with private endpoint, no public access
// =============================================================================

resource "azurerm_storage_account" "lab" {
  name                          = lower("${var.prefix}st${var.environment}${substr(sha256(azurerm_resource_group.lab.id), 0, 6)}")
  location                      = azurerm_resource_group.lab.location
  resource_group_name           = azurerm_resource_group.lab.name
  account_tier                  = "Standard"
  account_replication_type      = "LRS"
  account_kind                  = "StorageV2"
  access_tier                   = "Hot"
  https_traffic_only_enabled    = true
  min_tls_version               = "TLS1_2"
  allow_nested_items_to_be_public = false
  shared_access_key_enabled     = false
  public_network_access_enabled = false

  network_rules {
    default_action = "Deny"
    bypass         = ["AzureServices"]
  }
}

// Storage Blob Data Contributor — workload managed identity
resource "azurerm_role_assignment" "blob_contributor" {
  scope                = azurerm_storage_account.lab.id
  role_definition_name = "Storage Blob Data Contributor"
  principal_id         = azurerm_user_assigned_identity.workload.principal_id
}

// Private Endpoint
resource "azurerm_private_endpoint" "storage_blob" {
  name                = "${var.prefix}-pe-blob-${var.environment}"
  location            = azurerm_resource_group.lab.location
  resource_group_name = azurerm_resource_group.lab.name
  subnet_id           = azurerm_subnet.pe.id

  private_service_connection {
    name                           = "${var.prefix}-pe-blob-${var.environment}"
    private_connection_resource_id = azurerm_storage_account.lab.id
    subresource_names              = ["blob"]
    is_manual_connection           = false
  }

  private_dns_zone_group {
    name                 = "blob-dns-group"
    private_dns_zone_ids = [azurerm_private_dns_zone.blob.id]
  }
}
