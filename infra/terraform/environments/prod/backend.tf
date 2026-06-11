terraform {
  backend "azurerm" {
    key                  = "prod.terraform.tfstate"
    container_name       = "terraformstate"
    resource_group_name  = "terraform-rg"
    storage_account_name = "utkarshterraformms"
  }
}