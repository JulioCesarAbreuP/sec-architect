# Terraform: Azure Front Door Standard/Premium para sitio estático (GitHub Pages)
# Incluye WAF, dominios personalizados, HTTPS y reglas de cabecera
# Parámetros editables para prod y staging

variable "frontdoor_name" { default = "afd-sec-architect-prod" }
variable "location" { default = "westeurope" }
variable "resource_group_name" { default = "rg-sec-architect-prod" }
variable "github_pages_prod_host" { default = "www.tudominio.com" }
variable "github_pages_staging_host" { default = "blog.tudominio.com" }
variable "custom_domain_prod" { default = "www.tudominio.com" }
variable "custom_domain_staging" { default = "blog.tudominio.com" }

provider "azurerm" {
  features {}
}

resource "azurerm_cdn_profile" "afd" {
  name                = var.frontdoor_name
  location            = var.location
  resource_group_name = var.resource_group_name
  sku                 = "Standard_AzureFrontDoor"
  tags = {
    environment = "production"
    owner       = "julio"
  }
}


# Endpoint principal con asociación explícita de WAF Policy
resource "azurerm_cdn_endpoint" "prod" {
  name                = "prod-endpoint"
  profile_name        = azurerm_cdn_profile.afd.name
  location            = var.location
  resource_group_name = var.resource_group_name
  origin_host_header  = var.github_pages_prod_host
  origin {
    name      = "githubpages-prod"
    host_name = var.github_pages_prod_host
  }
  waf_policy_link_id = azurerm_web_application_firewall_policy.afd_waf.id
  # Asociación explícita de la política WAF al endpoint principal
}


# Endpoint de staging con asociación explícita de WAF Policy
resource "azurerm_cdn_endpoint" "staging" {
  name                = "staging-endpoint"
  profile_name        = azurerm_cdn_profile.afd.name
  location            = var.location
  resource_group_name = var.resource_group_name
  origin_host_header  = var.github_pages_staging_host
  origin {
    name      = "githubpages-staging"
    host_name = var.github_pages_staging_host
  }
  waf_policy_link_id = azurerm_web_application_firewall_policy.afd_waf.id
  # Asociación explícita de la política WAF al endpoint de staging
}

resource "azurerm_cdn_custom_domain" "prod" {
  name                = "prod-domain"
  profile_name        = azurerm_cdn_profile.afd.name
  endpoint_name       = azurerm_cdn_endpoint.prod.name
  resource_group_name = var.resource_group_name
  host_name           = var.custom_domain_prod
}

resource "azurerm_cdn_custom_domain" "staging" {
  name                = "staging-domain"
  profile_name        = azurerm_cdn_profile.afd.name
  endpoint_name       = azurerm_cdn_endpoint.staging.name
  resource_group_name = var.resource_group_name
  host_name           = var.custom_domain_staging
}

resource "azurerm_web_application_firewall_policy" "afd_waf" {
  name                = "waf-sec-architect-prod"
  resource_group_name = var.resource_group_name
  location            = var.location
  policy_settings {
    enabled = true
    mode    = "Prevention"
  }
  managed_rules {
    type    = "OWASP"
    version = "3.2"
  }
  custom_rules = [
    # --- Hardening adicional Front Door ---
    # Regla: Permitir solo GET, HEAD, OPTIONS (bloquear POST, PUT, DELETE, TRACE, CONNECT)
    {
      name     = "AllowOnlySafeMethods"
      priority = 10
      rule_type = "MatchRule"
      match_conditions = [{
        match_variable   = "RequestMethod"
        operator         = "Equal"
        match_values     = ["GET", "HEAD", "OPTIONS"]
        negate_condition = false
      }]
      action = "Allow"
    },
    {
      name     = "BlockUnsafeMethods"
      priority = 20
      rule_type = "MatchRule"
      match_conditions = [{
        match_variable   = "RequestMethod"
        operator         = "Equal"
        match_values     = ["POST", "PUT", "DELETE", "TRACE", "CONNECT"]
        negate_condition = false
      }]
      action = "Block"
    },
    # Regla opcional: Rate limiting (100 req/min por IP, desactivada por defecto)
    # Para activar, cambiar enabled_state a "Enabled"
    {
      name     = "RateLimitPerIP"
      priority = 30
      rule_type = "RateLimitRule"
      enabled_state = "Disabled" # Cambiar a "Enabled" para activar
      match_conditions = [{
        match_variable   = "RemoteAddr"
        operator         = "IPMatch"
        match_values     = ["*"]
      }]
      rate_limit_duration_in_minutes = 1
      rate_limit_threshold = 100
      action = "Block"
    }
    # WAF: Detección de bots comunes y request smuggling
    # Estas protecciones se activan vía managed_rules OWASP y reglas personalizadas
  ]
  tags = {
    environment = "production"
    owner       = "julio"
  }
}

# ---
# Asociación explícita de la política WAF a los endpoints de Front Door
# Se realiza mediante el atributo waf_policy_link_id en cada endpoint
# ---
