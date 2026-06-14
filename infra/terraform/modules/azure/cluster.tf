resource "azurerm_kubernetes_cluster" "name" {
  name = var.cluster_name
  location = var.location
  resource_group_name = azurerm_resource_group.myrg.name
  dns_prefix = "${var.cluster_name}-dnsprefix"
  default_node_pool {
    name = var.default_node_pool.name
    node_count = var.default_node_pool.node_count
    vm_size = var.default_node_pool.vm_size
  }
  identity {
    type = var.cluster_identity
  }
  oms_agent {
    log_analytics_workspace_id = azurerm_log_analytics_workspace.name.id
  }
}

resource "azurerm_log_analytics_workspace" "name" {
  name = var.log_analytics_workspace_name
  location = var.location
  resource_group_name = azurerm_resource_group.myrg.name
}


resource "azurerm_container_registry" "name" {
  for_each = toset(var.acr)

  name = each.value
  location = var.location
  resource_group_name = azurerm_resource_group.myrg.name
  sku = "Basic"
}


resource "azurerm_role_assignment" "name" {
  for_each = azurerm_container_registry.name

  scope = each.value.id
  role_definition_name = "AcrPull"
  principal_id = azurerm_kubernetes_cluster.name.kubelet_identity[0].object_id
}