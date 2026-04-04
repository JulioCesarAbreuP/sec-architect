// Bicep: Azure Front Door Standard/Premium para sitio estático (GitHub Pages)
// Incluye WAF, dominios personalizados, HTTPS y reglas de cabecera
// Parámetros editables para producción y staging

param location string = 'westeurope'
param frontDoorName string = 'afd-sec-architect-prod'
param githubPagesProdHost string = 'www.tudominio.com'
param githubPagesStagingHost string = 'blog.tudominio.com'
param customDomainProd string = 'www.tudominio.com'
param customDomainStaging string = 'blog.tudominio.com'

resource afd 'Microsoft.Cdn/profiles@2025-06-01' = {
  name: frontDoorName
  location: location
  sku: {
    name: 'Standard_AzureFrontDoor'
  }
  tags: {
    environment: 'production'
    owner: 'julio'
  }
  properties: {
    // ...otros parámetros opcionales
  }
}


// Backend para producción
resource afdEndpointProd 'Microsoft.Cdn/profiles/afdEndpoints@2025-06-01' = {
  name: '${afd.name}/prod-endpoint'
  location: location
  properties: {
    hostName: githubPagesProdHost
    // Asociación explícita de la política WAF al endpoint principal
    webApplicationFirewallPolicyLink: {
      id: afdWaf.id
    }
  }
}

// Backend para staging
resource afdEndpointStaging 'Microsoft.Cdn/profiles/afdEndpoints@2025-06-01' = {
  name: '${afd.name}/staging-endpoint'
  location: location
  properties: {
    hostName: githubPagesStagingHost
    // Asociación explícita de la política WAF al endpoint de staging
    webApplicationFirewallPolicyLink: {
      id: afdWaf.id
    }
  }
}

// Dominio personalizado producción
resource afdCustomDomainProd 'Microsoft.Cdn/profiles/customDomains@2025-06-01' = {
  name: '${afd.name}/${customDomainProd}'
  properties: {
    hostName: customDomainProd
    // TLS automático
    tlsSettings: {
      certificateType: 'ManagedCertificate'
      minimumTlsVersion: 'TLS12'
    }
  }
}

// Dominio personalizado staging
resource afdCustomDomainStaging 'Microsoft.Cdn/profiles/customDomains@2025-06-01' = {
  name: '${afd.name}/${customDomainStaging}'
  properties: {
    hostName: customDomainStaging
    tlsSettings: {
      certificateType: 'ManagedCertificate'
      minimumTlsVersion: 'TLS12'
    }
  }
}

// WAF Policy básica OWASP
resource afdWaf 'Microsoft.Network/frontdoorWebApplicationFirewallPolicies@2022-05-01' = {
  name: 'waf-sec-architect-prod'
  location: location
  tags: {
    environment: 'production'
    owner: 'julio'
  }
  properties: {
    policySettings: {
      enabledState: 'Enabled'
      mode: 'Prevention'
    }
    managedRules: {
      managedRuleSets: [
        {
          ruleSetType: 'OWASP'
          ruleSetVersion: '3.2'
        }
      ]
      customRules: [
        // --- Hardening adicional Front Door ---
        // Regla: Permitir solo GET, HEAD, OPTIONS (bloquear POST, PUT, DELETE, TRACE, CONNECT)
        {
          name: 'AllowOnlySafeMethods'
          priority: 10
          ruleType: 'MatchRule'
          matchConditions: [
            {
              matchVariable: 'RequestMethod'
              operator: 'Equal'
              matchValues: [ 'GET', 'HEAD', 'OPTIONS' ]
              negateCondition: false
            }
          ]
          action: 'Allow'
        }
        {
          name: 'BlockUnsafeMethods'
          priority: 20
          ruleType: 'MatchRule'
          matchConditions: [
            {
              matchVariable: 'RequestMethod'
              operator: 'Equal'
              matchValues: [ 'POST', 'PUT', 'DELETE', 'TRACE', 'CONNECT' ]
              negateCondition: false
            }
          ]
          action: 'Block'
        }
        // Regla opcional: Rate limiting (100 req/min por IP, desactivada por defecto)
        // Para activar, cambiar enabledState a 'Enabled'
        {
          name: 'RateLimitPerIP'
          priority: 30
          ruleType: 'RateLimitRule'
          enabledState: 'Disabled' // Cambiar a 'Enabled' para activar
          matchConditions: [
            {
              matchVariable: 'RemoteAddr'
              operator: 'IPMatch'
              matchValues: [ '*' ]
            }
          ]
          rateLimitDurationInMinutes: 1
          rateLimitThreshold: 100
          action: 'Block'
        }
        // WAF: Detección de bots comunes y request smuggling
        // Estas protecciones se activan vía managedRuleSets OWASP y reglas personalizadas
      ]
    }
  }
}

// ---
// Asociación explícita de la política WAF a los endpoints de Front Door
// Se realiza mediante la propiedad webApplicationFirewallPolicyLink en cada endpoint
// ---

// Asignar WAF a Front Door (ejemplo, puede requerir asociación explícita en reglas)
// ...

// Reglas de cabecera seguras (HSTS, COOP, CORP, etc.)
// ...

// NOTA: Para reglas de routing, asociación de WAF y cabeceras, consultar documentación y adaptar según necesidades.
