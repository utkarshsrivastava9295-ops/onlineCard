terraform {
  required_version = ">= 1.5"
  required_providers {
    azurerm = {
      version = "~> 4.0"
      source  = "hashicorp/azurerm"
    }
  }
}

provider "azurerm" {
  features {

  }
  use_oidc = true
}