location        = "Central India"
vnet_name       = "exampleappvnet"
vnet_cidr_block = "10.0.0.0/24"
subnets = {
  "private_subnet_1" = {
    cidr_block = "10.0.0.0/28"
  }
  "private_subnet_2" = {
    cidr_block = "10.0.0.16/28"
  }
  "private_subnet_3" = {
    cidr_block = "10.0.0.64/26"
  }
  "private_subnet_4" = {
    cidr_block = "10.0.0.128/28"
  }
}
cluster_name                 = "myexamplecluster"
log_analytics_workspace_name = "exampleloganalytic"
acr = [ "frontend", "catalog" ]