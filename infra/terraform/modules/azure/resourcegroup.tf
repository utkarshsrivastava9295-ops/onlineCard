resource "azurerm_resource_group" "myrg" {
  name = "example-app"
  location = var.location
}