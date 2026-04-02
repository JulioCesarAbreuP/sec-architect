variable "location" {
  description = "Azure region for all resources."
  type        = string
  default     = "eastus"
}

variable "environment" {
  description = "Short environment tag: dev | staging | prod"
  type        = string
  default     = "dev"
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "environment must be dev, staging, or prod."
  }
}

variable "prefix" {
  description = "Project prefix used in all resource names (3-8 characters)."
  type        = string
  default     = "ztlab"
  validation {
    condition     = length(var.prefix) >= 3 && length(var.prefix) <= 8
    error_message = "prefix must be between 3 and 8 characters."
  }
}

variable "resource_group_name" {
  description = "Name of the target resource group."
  type        = string
}

variable "kv_admin_object_id" {
  description = "AAD Object ID (user or group) to receive Key Vault Administrator role."
  type        = string
}

variable "log_analytics_workspace_id" {
  description = "Resource ID of the Log Analytics Workspace for diagnostics. Leave empty to skip."
  type        = string
  default     = ""
}

variable "address_space" {
  description = "VNet address space CIDR."
  type        = string
  default     = "10.0.0.0/16"
}

variable "app_subnet_prefix" {
  description = "Application subnet CIDR."
  type        = string
  default     = "10.0.1.0/24"
}

variable "pe_subnet_prefix" {
  description = "Private endpoint subnet CIDR."
  type        = string
  default     = "10.0.2.0/24"
}

variable "bastion_subnet_prefix" {
  description = "Azure Bastion subnet CIDR (must be /27 or larger)."
  type        = string
  default     = "10.0.3.0/27"
}
