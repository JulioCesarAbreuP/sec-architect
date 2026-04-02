// =============================================================================
// identity.tf — User-Assigned Managed Identity
// =============================================================================

resource "azurerm_user_assigned_identity" "workload" {
  name                = "${var.prefix}-id-workload-${var.environment}"
  location            = azurerm_resource_group.lab.location
  resource_group_name = azurerm_resource_group.lab.name
  tags = {
    environment = var.environment
    purpose     = "zero-trust-workload"
  }
}
