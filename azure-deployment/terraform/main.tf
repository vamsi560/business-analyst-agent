# BA Agent - Azure Infrastructure as Code
# Main Terraform Configuration

terraform {
  required_version = ">= 1.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
  
  backend "azurerm" {
    resource_group_name  = "rg-terraform-state"
    storage_account_name = "baagenttfstate"
    container_name       = "terraform-state"
    key                  = "ba-agent.terraform.tfstate"
  }
}

provider "azurerm" {
  features {
    key_vault {
      purge_soft_delete_on_destroy = true
    }
  }
}

# Variables
variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "location" {
  description = "Azure region"
  type        = string
  default     = "eastus2"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "ba-agent"
}

# Local values
locals {
  resource_group_name = "rg-${var.project_name}-${var.environment}"
  common_tags = {
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
    Owner       = "BA-Agent-Team"
  }
}

# Resource Group
resource "azurerm_resource_group" "main" {
  name     = local.resource_group_name
  location = var.location
  tags     = local.common_tags
}

# Virtual Network
resource "azurerm_virtual_network" "main" {
  name                = "vnet-${var.project_name}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  address_space       = ["10.0.0.0/16"]
  tags                = local.common_tags
}

# Subnets
resource "azurerm_subnet" "app" {
  name                 = "snet-app"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = ["10.0.1.0/24"]
}

resource "azurerm_subnet" "db" {
  name                 = "snet-db"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = ["10.0.2.0/24"]
}

# Key Vault
resource "azurerm_key_vault" "main" {
  name                        = "kv-${var.project_name}-${var.environment}"
  location                    = azurerm_resource_group.main.location
  resource_group_name         = azurerm_resource_group.main.name
  enabled_for_disk_encryption = true
  tenant_id                   = data.azurerm_client_config.current.tenant_id
  soft_delete_retention_days  = 7
  purge_protection_enabled    = false
  sku_name                   = "standard"
  tags                       = local.common_tags
}

# Key Vault Access Policy
resource "azurerm_key_vault_access_policy" "main" {
  key_vault_id = azurerm_key_vault.main.id
  tenant_id    = data.azurerm_client_config.current.tenant_id
  object_id    = data.azurerm_client_config.current.object_id

  key_permissions = [
    "Get", "List", "Create", "Delete", "Update"
  ]

  secret_permissions = [
    "Get", "List", "Set", "Delete"
  ]
}

# Storage Account
resource "azurerm_storage_account" "main" {
  name                     = "st${var.project_name}${var.environment}"
  resource_group_name      = azurerm_resource_group.main.name
  location                 = azurerm_resource_group.main.location
  account_tier             = "Standard"
  account_replication_type = "GRS"
  account_kind             = "StorageV2"
  tags                     = local.common_tags
}

# Storage Containers
resource "azurerm_storage_container" "documents" {
  name                  = "documents"
  storage_account_name  = azurerm_storage_account.main.name
  container_access_type = "private"
}

resource "azurerm_storage_container" "temp" {
  name                  = "temp"
  storage_account_name  = azurerm_storage_account.main.name
  container_access_type = "private"
}

resource "azurerm_storage_container" "backups" {
  name                  = "backups"
  storage_account_name  = azurerm_storage_account.main.name
  container_access_type = "private"
}

# SQL Server
resource "azurerm_mssql_server" "main" {
  name                         = "sql-${var.project_name}-${var.environment}"
  resource_group_name          = azurerm_resource_group.main.name
  location                     = azurerm_resource_group.main.location
  version                      = "12.0"
  administrator_login          = "sqladmin"
  administrator_login_password = var.sql_admin_password
  tags                         = local.common_tags
}

# SQL Database
resource "azurerm_mssql_database" "main" {
  name           = "db-${var.project_name}"
  server_id      = azurerm_mssql_server.main.id
  collation      = "SQL_Latin1_General_CP1_CI_AS"
  license_type   = "LicenseIncluded"
  max_size_gb    = 250
  sku_name       = "S2"
  tags           = local.common_tags
}

# App Service Plan
resource "azurerm_service_plan" "main" {
  name                = "asp-${var.project_name}-${var.environment}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  os_type             = "Linux"
  sku_name            = "P1v3"
  tags                = local.common_tags
}

# App Service (Backend)
resource "azurerm_linux_web_app" "api" {
  name                = "app-${var.project_name}-api-${var.environment}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  service_plan_id     = azurerm_service_plan.main.id
  tags                = local.common_tags

  site_config {
    application_stack {
      python_version = "3.11"
    }
    
    application_stack {
      docker {
        registry_url = "https://index.docker.io"
        image_name   = "ba-agent-api:latest"
      }
    }
  }

  app_settings = {
    "WEBSITES_PORT"                    = "5000"
    "PYTHON_VERSION"                   = "3.11"
    "SCM_DO_BUILD_DURING_DEPLOYMENT"  = "true"
    "DATABASE_URL"                     = "postgresql://${azurerm_mssql_server.main.administrator_login}:${var.sql_admin_password}@${azurerm_mssql_server.main.fully_qualified_domain_name}:1433/${azurerm_mssql_database.main.name}"
    "AZURE_STORAGE_CONNECTION_STRING" = azurerm_storage_account.main.primary_connection_string
    "AZURE_SEARCH_ENDPOINT"           = azurerm_search_service.main.primary_endpoint
    "GEMINI_API_KEY"                  = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault_secret.gemini_api_key.versionless_id})"
    "ADO_PAT"                         = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault_secret.ado_pat.versionless_id})"
    "ACS_CONNECTION_STRING"           = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault_secret.acs_connection_string.versionless_id})"
  }

  identity {
    type = "SystemAssigned"
  }
}

# Search Service
resource "azurerm_search_service" "main" {
  name                = "search-${var.project_name}-${var.environment}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku                 = "standard"
  replica_count       = 2
  partition_count     = 1
  tags                = local.common_tags
}

# Application Insights
resource "azurerm_application_insights" "main" {
  name                = "appi-${var.project_name}-${var.environment}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  application_type    = "web"
  tags                = local.common_tags
}

# Front Door
resource "azurerm_frontdoor" "main" {
  name                = "fd-${var.project_name}-${var.environment}"
  resource_group_name = azurerm_resource_group.main.name
  tags                = local.common_tags

  routing_rule {
    name               = "api-rule"
    accepted_protocols = ["Http", "Https"]
    patterns_to_match   = ["/*"]
    frontend_endpoints = ["api-endpoint"]
    forwarding_configuration {
      forwarding_protocol = "MatchRequest"
      backend_pool_name   = "api-pool"
    }
  }

  backend_pool_load_balancing {
    name = "api-load-balancing"
  }

  backend_pool_health_probe {
    name = "api-health-probe"
  }

  backend_pool {
    name = "api-pool"
    backend {
      host_header = azurerm_linux_web_app.api.name
      address     = azurerm_linux_web_app.api.name
      http_port   = 80
      https_port  = 443
    }

    load_balancing_name = "api-load-balancing"
    health_probe_name   = "api-health-probe"
  }

  frontend_endpoint {
    name                              = "api-endpoint"
    host_name                         = "fd-${var.project_name}-${var.environment}.azurefd.net"
    session_affinity_enabled          = true
    session_affinity_ttl_seconds      = 300
  }
}

# Key Vault Secrets
resource "azurerm_key_vault_secret" "gemini_api_key" {
  name         = "GEMINI-API-KEY"
  value        = var.gemini_api_key
  key_vault_id = azurerm_key_vault.main.id
}

resource "azurerm_key_vault_secret" "ado_pat" {
  name         = "ADO-PAT"
  value        = var.ado_pat
  key_vault_id = azurerm_key_vault.main.id
}

resource "azurerm_key_vault_secret" "acs_connection_string" {
  name         = "ACS-CONNECTION-STRING"
  value        = var.acs_connection_string
  key_vault_id = azurerm_key_vault.main.id
}

# Data sources
data "azurerm_client_config" "current" {}

# Variables
variable "sql_admin_password" {
  description = "SQL Server administrator password"
  type        = string
  sensitive   = true
}

variable "gemini_api_key" {
  description = "Google Gemini API Key"
  type        = string
  sensitive   = true
}

variable "ado_pat" {
  description = "Azure DevOps Personal Access Token"
  type        = string
  sensitive   = true
}

variable "acs_connection_string" {
  description = "Azure Communication Services connection string"
  type        = string
  sensitive   = true
}

# Outputs
output "resource_group_name" {
  value = azurerm_resource_group.main.name
}

output "app_service_url" {
  value = "https://${azurerm_linux_web_app.api.default_hostname}"
}

output "front_door_url" {
  value = "https://${azurerm_frontdoor.main.frontend_endpoint[0].host_name}"
}

output "storage_account_name" {
  value = azurerm_storage_account.main.name
}

output "database_name" {
  value = azurerm_mssql_database.main.name
}

output "search_service_name" {
  value = azurerm_search_service.main.name
}

output "key_vault_name" {
  value = azurerm_key_vault.main.name
} 