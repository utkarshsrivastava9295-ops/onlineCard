variable "location" {
  type    = string
  default = "Central India"
}

variable "vnet_name" {
  type = string
}

variable "vnet_cidr_block" {
  type = string

}

variable "subnets" {
  type = map(object({
    cidr_block = string
  }))

}
variable "cluster_name" {
  type = string
}
variable "default_node_pool" {
  type = object({
    name       = string
    node_count = number
    vm_size    = string
  })

  default = {
    name       = "default"
    node_count = 1
    vm_size    = "Standard_D4s_v3"
  }
}

variable "cluster_identity" {
  type    = string
  default = "SystemAssigned"
}

variable "log_analytics_workspace_name" {
  type = string
}