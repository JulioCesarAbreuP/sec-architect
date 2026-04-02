// =============================================================================
// networking.tf — VNet, Subnets, NSGs, Private DNS Zones
// =============================================================================

locals {
  vnet_name    = "${var.prefix}-vnet-${var.environment}"
  nsg_app_name = "${var.prefix}-nsg-app-${var.environment}"
  nsg_pe_name  = "${var.prefix}-nsg-pe-${var.environment}"
}

// ---------------------------------------------------------------------------
// NSGs
// ---------------------------------------------------------------------------
resource "azurerm_network_security_group" "app" {
  name                = local.nsg_app_name
  location            = azurerm_resource_group.lab.location
  resource_group_name = azurerm_resource_group.lab.name

  security_rule {
    name                       = "deny-internet-inbound"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Deny"
    protocol                   = "*"
    source_port_range          = "*"
    destination_port_range     = "*"
    source_address_prefix      = "Internet"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "allow-vnet-https-inbound"
    priority                   = 200
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "443"
    source_address_prefix      = "VirtualNetwork"
    destination_address_prefix = "*"
  }
}

resource "azurerm_network_security_group" "pe" {
  name                = local.nsg_pe_name
  location            = azurerm_resource_group.lab.location
  resource_group_name = azurerm_resource_group.lab.name

  security_rule {
    name                       = "deny-internet-inbound"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Deny"
    protocol                   = "*"
    source_port_range          = "*"
    destination_port_range     = "*"
    source_address_prefix      = "Internet"
    destination_address_prefix = "*"
  }
}

// ---------------------------------------------------------------------------
// Virtual Network
// ---------------------------------------------------------------------------
resource "azurerm_virtual_network" "lab" {
  name                = local.vnet_name
  location            = azurerm_resource_group.lab.location
  resource_group_name = azurerm_resource_group.lab.name
  address_space       = [var.address_space]
}

resource "azurerm_subnet" "app" {
  name                                          = "snet-app"
  resource_group_name                           = azurerm_resource_group.lab.name
  virtual_network_name                          = azurerm_virtual_network.lab.name
  address_prefixes                              = [var.app_subnet_prefix]
  private_endpoint_network_policies             = "Disabled"
}

resource "azurerm_subnet" "pe" {
  name                                          = "snet-privateendpoints"
  resource_group_name                           = azurerm_resource_group.lab.name
  virtual_network_name                          = azurerm_virtual_network.lab.name
  address_prefixes                              = [var.pe_subnet_prefix]
  private_endpoint_network_policies             = "Disabled"
}

resource "azurerm_subnet" "bastion" {
  name                 = "AzureBastionSubnet"
  resource_group_name  = azurerm_resource_group.lab.name
  virtual_network_name = azurerm_virtual_network.lab.name
  address_prefixes     = [var.bastion_subnet_prefix]
}

// NSG associations
resource "azurerm_subnet_network_security_group_association" "app" {
  subnet_id                 = azurerm_subnet.app.id
  network_security_group_id = azurerm_network_security_group.app.id
}

resource "azurerm_subnet_network_security_group_association" "pe" {
  subnet_id                 = azurerm_subnet.pe.id
  network_security_group_id = azurerm_network_security_group.pe.id
}

// ---------------------------------------------------------------------------
// Private DNS Zones
// ---------------------------------------------------------------------------
resource "azurerm_private_dns_zone" "keyvault" {
  name                = "privatelink.vaultcore.azure.net"
  resource_group_name = azurerm_resource_group.lab.name
}

resource "azurerm_private_dns_zone_virtual_network_link" "keyvault" {
  name                  = "${local.vnet_name}-kv-link"
  resource_group_name   = azurerm_resource_group.lab.name
  private_dns_zone_name = azurerm_private_dns_zone.keyvault.name
  virtual_network_id    = azurerm_virtual_network.lab.id
  registration_enabled  = false
}

resource "azurerm_private_dns_zone" "blob" {
  name                = "privatelink.blob.core.windows.net"
  resource_group_name = azurerm_resource_group.lab.name
}

resource "azurerm_private_dns_zone_virtual_network_link" "blob" {
  name                  = "${local.vnet_name}-blob-link"
  resource_group_name   = azurerm_resource_group.lab.name
  private_dns_zone_name = azurerm_private_dns_zone.blob.name
  virtual_network_id    = azurerm_virtual_network.lab.id
  registration_enabled  = false
}
