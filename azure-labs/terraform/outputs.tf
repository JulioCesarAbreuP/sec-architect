// =============================================================================
// outputs.tf — Key deployment outputs
// =============================================================================

output "resource_group_name" {
  description = "Name of the deployed resource group."
  value       = azurerm_resource_group.lab.name
}

output "vnet_id" {
  description = "Resource ID of the lab VNet."
  value       = azurerm_virtual_network.lab.id
}

output "pe_subnet_id" {
  description = "Resource ID of the private endpoint subnet."
  value       = azurerm_subnet.pe.id
}

output "key_vault_uri" {
  description = "URI of the deployed Key Vault."
  value       = azurerm_key_vault.lab.vault_uri
}

output "key_vault_id" {
  description = "Resource ID of the deployed Key Vault."
  value       = azurerm_key_vault.lab.id
}

output "storage_account_name" {
  description = "Name of the deployed Storage Account."
  value       = azurerm_storage_account.lab.name
}

output "managed_identity_client_id" {
  description = "Client ID of the workload User-Assigned Managed Identity."
  value       = azurerm_user_assigned_identity.workload.client_id
}

output "managed_identity_principal_id" {
  description = "Principal ID of the workload User-Assigned Managed Identity."
  value       = azurerm_user_assigned_identity.workload.principal_id
}
