resource "azurerm_virtual_network" "myvnet" {
  name = var.vnet_name
  location = var.location
  resource_group_name = azurerm_resource_group.myrg.name
  address_space = [var.vnet_cidr_block]
}

resource "azurerm_subnet" "name" {
  for_each = var.subnets

  name = each.key
  address_prefixes = [each.value.cidr_block]

  virtual_network_name = azurerm_virtual_network.myvnet.name
  resource_group_name = azurerm_resource_group.myrg.name
}