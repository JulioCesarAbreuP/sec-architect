// =============================================================================
// main.tf — Resource Group and shared data sources
// =============================================================================

data "azurerm_client_config" "current" {}

resource "azurerm_resource_group" "lab" {
  name     = var.resource_group_name
  location = var.location
  tags = {
    environment = var.environment
    managedBy   = "terraform"
    project     = "zero-trust-lab"
  }
}
