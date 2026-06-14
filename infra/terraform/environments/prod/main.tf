module "azure" {
  source = "../../modules/azure"

  location                     = var.location
  vnet_name                    = var.vnet_name
  vnet_cidr_block              = var.vnet_cidr_block
  subnets                      = var.subnets
  cluster_name                 = var.cluster_name
  default_node_pool            = var.default_node_pool
  log_analytics_workspace_name = var.log_analytics_workspace_name
  acr                          = var.acr
}