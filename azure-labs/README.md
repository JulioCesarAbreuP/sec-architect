# Azure Labs: Laboratorios de Arquitectura Cloud Avanzada

> *La estructura de estos laboratorios sigue una progresión contextual → conceptual → lógica inspirada en marcos de arquitectura como SABSA, donde la seguridad no es una capa superior sino el cimiento de cada decisión de diseño.*

---

## 1. Propósito del Repositorio Azure-Labs

Este módulo contiene **laboratorios prácticos de arquitectura cloud** diseñados para consolidar competencias avanzadas en Azure. No se trata de ejercicios superficiales, sino de implementaciones profundas de patrones de seguridad, gobernanza e identidad que reflejan escenarios empresariales reales.

### Alcance y Orientación

- **Zero Trust Architecture**: Cada laboratorio implementa principios de confianza cero, donde ningún recurso es inherentemente confiable y todo acceso requiere verificación continua.
- **Certificaciones de Referencia**: Alineados con AZ-305 (Azure Solutions Architect), SC-300 (Identity & Access Administrator), SC-100 (Cloud Security Architect) y AZ-500 (Azure Security Engineer).
- **Buenas Prácticas de Seguridad**: Incorporan patrones validados de seguridad defensiva en profundidad, segregación de responsabilidades y principios de least privilege.

### Estructura Modular

Los laboratorios están organizados en capas progresivas:
1. **Networking**: Segmentación de red y aislamiento perimetral.
2. **Identity**: Gestión de identidades con Managed Identities y RBAC.
3. **Key Management**: Protección de secretos con Key Vault y políticas de acceso basadas en identidad.
4. **Storage Security**: Almacenamiento privado con Private Endpoints y encriptación.
5. **Monitoring & Auditing**: Observabilidad y trazabilidad de accesos.

---

## 2. Visión Zero Trust

Zero Trust es un modelo de seguridad que asume que no existe perímetro de confianza. Cada solicitud de acceso se verifica explícitamente, independientemente de su origen. Esta sección detalla cómo se materializa en estos laboratorios.

### 2.1 Identidad como Plano de Control

En una arquitectura Zero Trust, **la identidad es el nuevo perímetro**. Esto significa:

- **Verificación de Identidad Obligatoria**: Todo acceso requiere autenticación y autorización explícita, sin excepciones.
- **Managed Identities para Recursos**: Las aplicaciones y servicios no utilizan credenciales estáticas, sino identidades gestionadas por Azure que pueden ser rotadas automáticamente.
- **Azure AD como Autoridad Central**: Todas las decisiones de acceso se delegan a Azure AD (Entra ID), que actúa como fuente única de verdad para autorizaciones.

**Implementación en Labs**:
```
Aplicación → Managed Identity → Azure AD → Key Vault/Storage/SQL
```

Cada componente verifica la identidad del componente anterior mediante tokens OAuth 2.0 y certificados gestionados automáticamente.

### 2.2 Acceso Mínimo (Least Privilege)

Least Privilege significa que cada recurso tiene **solo los permisos que necesita** para su función específica, nada más.

- **RBAC Granular**: Cada role tiene un alcance específico (Subscription, Resource Group, Resource).
- **Roles Personalizados**: Cuando los roles integrados son demasiado amplios, se crean roles personalizados con permisos exactamente necesarios.
- **Negación Explícita**: Se utilizan Deny assignments para bloquear operaciones peligrosas incluso si un role las permitiría.

**Patrón de asignación**:
| Recurso | Identidad | Rol | Alcance |
|---------|-----------|-----|--------|
| Key Vault | Function App MI | Key Vault Secrets User | /subscriptions/.../keyvaults/kv-prod |
| Storage | Logic App MI | Storage Blob Data Reader | /subscriptions/.../storageAccounts/sa-data/blobServices/default/containers/input |
| Database | App Service MI | SQL DB Data Contributor | /subscriptions/.../servers/sql-main/databases/proddb |

### 2.3 Segmentación de Red

La red no es un perímetro confiable, pero sigue siendo una defensa crítica. Los laboratorios implementan:

- **Virtual Networks Aisladas**: Subredes separadas por función (frontend, backend, datos, management).
- **Network Security Groups (NSGs)**: Reglas explícitas de entrada y salida que deniegan por defecto y permiten solo flujos necesarios.
- **Service Endpoints y Private Endpoints**: Los servicios de Azure no se exponen a internet público, solo a la red privada de la organización.
- **Zero Trust Network (Micro-segmentation)**: Entre aplicaciones internas no hay confianza, cada conversación requiere verificación.

**Topología típica**:
```
Internet → Azure Firewall → App Subnet (Managed Identity) 
         → Data Subnet (Private Storage, Key Vault) 
         → Management Subnet (JIT Access, Bastion)
```

### 2.4 Eliminación de Contraseñas en Código

Una de las vulnerabilidades más críticas es el almacenamiento de secretos en código fuente.

**Cumplimiento vigente**:
- ❌ Credenciales hardcodeadas en código.
- ❌ Secretos en variables de entorno sin encriptación.
- ✅ Azure Managed Identities para aplicaciones.
- ✅ Key Vault para secretos que no pueden usar Managed Identity.
- ✅ DefaultAzureCredential para desarrollo local (utiliza credenciales de Azure CLI/Visual Studio).

**Flujo de Acceso a Secretos**:
```
Application (con Managed Identity) 
  → Azure AD (autentica la Managed Identity) 
  → Key Vault (verifica RBAC) 
  → Retorna secreto encriptado
```

### 2.5 Uso de Managed Identities y Key Vault

#### Managed Identities
Son identidades de servicios que Azure AD crea, gestiona y rota automáticamente. No requieren credenciales.

**Tipos**:
- **System-assigned**: Creada al mismo tiempo que el recurso, muere con el recurso.
- **User-assigned**: Creada independientemente, puede asignarse a múltiples recursos, persiste después de la eliminación del recurso.

**Ventajas**:
- Credenciales rotadas automáticamente cada 24 horas sin intervención.
- Auditoría completa en Azure AD de quién accedió qué.
- No hay secretos que exfiltrar (no existen en memoria como texto plano).

#### Key Vault
Almacén de secretos, certificados y claves con auditoria y control de acceso granular.

**Política de acceso de Key Vault**:
- Basado en RBAC (recomendado) o basado en políticas de acceso (legacy).
- Cada identidad tiene permisos explícitos: get, list, delete, etc.
- Logs de auditoría en Azure Monitor/Log Analytics.

### 2.6 Aislamiento de Recursos mediante Private Endpoints

Los servicios PaaS de Azure expondrían sus API públicamente. Private Endpoints inyectan una interfaz privada en la red virtual.

**Efecto**:
```
Público:  storage.blob.core.windows.net → Internet → Bloqueado por Firewall
Privado: storage.blob.core.windows.net → Private Endpoint → Red Virtual → ✅ Permitido
```

**Beneficios**:
- El servicio no aparece en DNS público.
- La comunicación no sale de la red privada o del backbone de Azure.
- Combinado con Service Endpoints, asegura que solo ciertos recursos pueden acceder.

---

## 3. Alineación con Certificaciones

### 3.1 SC-300: Identity and Access Administrator

**Objetivos cubiertos**:

| Objetivo | Laboratories | Competencia |
|----------|--------------|-------------|
| Implementar autenticación de Azure AD | Lab-03: Managed Identities | Configuración de Managed Identities, asignación de RBAC, flujos de autenticación |
| Gestionar acceso a usuarios | Lab-01, Lab-02 | Principios de Identity-First, RBAC, conditional access |
| Proteger identidades contra ataques | Lab-03 | MFA, passwordless authentication, Managed Identities vs. contraseñas |
| Auditar identidades y accesos | Lab-05: Monitoring | Logs de Azure AD, access reviews, alertas de acceso anómalo |

### 3.2 SC-100: Cloud Security Architect

**Objetivos cubiertos**:

| Objetivo | Laboratories | Competencia |
|----------|--------------|-------------|
| Diseñar arquitectura cloud segura | Todos los labs | Visión holística de seguridad en capas |
| Implementar Zero Trust | Lab-01 a Lab-04 | Segmentación, múltiples capas de control, verificación continua |
| Gobernanza y cumplimiento | Lab-02, Lab-05 | Políticas de Key Vault, auditoría, compliance frameworks |
| Monitoreo de seguridad | Lab-05 | Detección de amenazas, alertas, investigación de incidentes |

### 3.3 AZ-305: Azure Solutions Architect

**Objetivos cubiertos**:

| Objetivo | Laboratories | Competencia |
|----------|--------------|-------------|
| Diseñar infraestructura de red | Lab-01 | VNets, subredes, NSGs, routing, high-availability |
| Diseñar seguridad y gobernanza | Lab-02, Lab-03 | RBAC, policies, blueprints, Key Vault |
| Diseñar almacenamiento | Lab-04 | Storage accounts, tiers, redundancy, encryption, Private Endpoints |
| Evaluar indicadores de costo/rendimiento | Todos | Alineación con buenas prácticas para optimización |

### 3.4 AZ-500: Azure Security Engineer

**Objetivos cubiertos**:

| Objetivo | Laboratories | Competencia |
|----------|--------------|-------------|
| Gestionar identidad y acceso | Lab-03 | Implementación práctica de Managed Identities, RBAC |
| Asegurar red y almacenamiento | Lab-01, Lab-04 | NSGs, firewalls, Private Endpoints, encryption |
| Gestionar secretos | Lab-02 | Key Vault, rotación de secretos, auditoría |
| Monitorear seguridad | Lab-05 | Azure Monitor, Log Analytics, alertas de seguridad |

---

## 4. Cómo Ejecutar los Labs

### 4.1 Prerequisitos

#### Software y Extensiones
```powershell
# Azure CLI (última versión)
az --version  # v2.50.0 o superior

# PowerShell (5.1 o superior)
$PSVersionTable.PSVersion

# Extensiones requeridas
az extension add --name azure-devops  # Para pipelines (opcional)
az extension add --name storage-preview  # Para características avanzadas
```

#### Credenciales y RBAC
- **Cuenta Azure**: Acceso a una suscripción donde puedas desplegar recursos.
- **Permisos Mínimos Requeridos**:
  - Contributor en el Resource Group destino, O
  - Owner en el Resource Group destino (recomendado para algunos labs).
- **Verificar Permisos**:
```powershell
az role assignment list --assignee (az account show --query user.name -o tsv) --output table
```

#### Parámetros de Configuración
Antes de ejecutar, establece variables de entorno:
```powershell
$env:AZURE_SUBSCRIPTION_ID = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
$env:AZURE_RESOURCE_GROUP = "rg-azure-labs"
$env:AZURE_LOCATION = "westeurope"  # o tu región preferida
$env:ENVIRONMENT = "dev"
```

### 4.2 Pasos para Despliegue

#### Paso 1: Autenticación
```powershell
# Login interactivo
az login

# Seleccionar suscripción
az account set --subscription $env:AZURE_SUBSCRIPTION_ID

# Verificar contexto actual
az account show
```

#### Paso 2: Crear Resource Group
```powershell
az group create `
  --name $env:AZURE_RESOURCE_GROUP `
  --location $env:AZURE_LOCATION
```

#### Paso 3: Validar IaC (Bicep o Terraform)

**Para Bicep**:
```powershell
# Ubicarse en ./bicep
cd ./azure-labs/bicep

# Validar sintaxis
az bicep build --file main.bicep

# Validar despliegue (sin aplicar cambios)
az deployment group create \
  --resource-group $env:AZURE_RESOURCE_GROUP \
  --template-file main.bicep \
  --parameters parameters.json \
  --what-if
```

**Para Terraform**:
```powershell
# Ubicarse en ./terraform
cd ./azure-labs/terraform

# Inicializar Terraform (descarga providers y módulos)
terraform init

# Validar sintaxis
terraform validate

# Plan (mostrar cambios sin aplicarlos)
terraform plan -out=tfplan -var-file="terraform.tfvars"
```

#### Paso 4: Desplegar Infraestructura

**Con Bicep (Recomendado)**:
```powershell
# Ejecutar script de despliegue
.\azure-labs\scripts\deploy-bicep.ps1 `
  -ResourceGroupName $env:AZURE_RESOURCE_GROUP `
  -Location $env:AZURE_LOCATION `
  -Environment $env:ENVIRONMENT
```

**Con Terraform**:
```powershell
# Ejecutar script de despliegue
.\azure-labs\scripts\deploy-terraform.ps1 `
  -ResourceGroupName $env:AZURE_RESOURCE_GROUP `
  -Location $env:AZURE_LOCATION `
  -Environment $env:ENVIRONMENT
```

#### Paso 5: Validar Despliegue
```powershell
# Verificar que todos los recursos se crearon
az resource list --resource-group $env:AZURE_RESOURCE_GROUP --output table

# Ejecutar script de validación
.\azure-labs\scripts\validate-bicep.ps1 `
  -ResourceGroupName $env:AZURE_RESOURCE_GROUP
```

### 4.3 Estructura de Scripts

#### deploy-bicep.ps1
```
Tarea: Desplegar infraestructura usando Bicep
Pasos:
  1. Valida parametros de entrada
  2. Verifica credenciales de Azure
  3. Valida sintaxis de Bicep (az bicep build)
  4. Despliega con az deployment group create
  5. Captura outputs (IDs, endpoints, etc.)
  6. Exporta variables para siguientes scripts
```

#### validate-bicep.ps1
```
Tarea: Validar que la arquitectura cumple Zero Trust
Pasos:
  1. Verifica NSGs (solo flujos permitidos)
  2. Verifica Managed Identities y RBAC
  3. Verifica Private Endpoints en servicios PaaS
  4. Verifica encriptación en Key Vault y Storage
  5. Genera reporte de compliance
```

#### cleanup.ps1
```
Tarea: Eliminar recursos (importante para no incurrir en costos)
Pasos:
  1. Pide confirmación explícita
  2. Elimina Resource Group (elimina todo automáticamente)
  3. Verifica eliminación
```

---

## 5. Cómo Validar la Arquitectura

### 5.1 Validación de Red

```powershell
# Listar NSGs en el Resource Group
az network nsg list --resource-group $env:AZURE_RESOURCE_GROUP --output json

# Inspeccionar reglas de un NSG específico
az network nsg rule list --resource-group $env:AZURE_RESOURCE_GROUP `
  --nsg-name "nsg-backend" --output table

# Verificar que não há reglas permitiendo * (Allow Any)
az network nsg rule list --resource-group $env:AZURE_RESOURCE_GROUP `
  --nsg-name "nsg-backend" `
  --query "[?access=='Allow' && properties.destinationPortRange=='*']" `
  --output table
```

**Criterios de validación**:
- ✅ No hay reglas que permitan tráfico desde Internet (*)
- ✅ Entrada solo de subnets específicas (least privilege)
- ✅ Salida restringida al mínimo (no wildcard)
- ✅ Conexiones intersubredes requieren reglas explícitas

### 5.2 Validación de Identidad

```powershell
# Listar Managed Identities
az identity list --resource-group $env:AZURE_RESOURCE_GROUP --output json

# Verificar RBAC (role assignments) para una Managed Identity
$miResourceId = "/subscriptions/.../resourceGroups/.../providers/Microsoft.ManagedIdentity/userAssignedIdentities/mi-app"
az role assignment list --assignee $miResourceId --output table

# Verificar que no hay roles Owner o Contributor asignados (anti-pattern)
az role assignment list --assignee $miResourceId `
  --query "[?roleDefinitionName IN ('Owner', 'Contributor')]" `
  --output table
```

**Criterios de validación**:
- ✅ Managed Identities (no credenciales hardcodeadas) para aplicaciones
- ✅ Roles granulares (Reader, Secrets User, Blob Data Contributor)
- ✅ Alcance limitado a recursos específicos
- ✅ Logs de auditoría en Azure AD de acceso a secretos

### 5.3 Validación de Key Vault

```powershell
# Obtener propiedades del Key Vault
$kvId = "/subscriptions/.../resourceGroups/.../providers/Microsoft.KeyVault/vaults/kv-prod"
az keyvault show --id $kvId --output json

# Verificar configuración de firewall (debe permitir solo VNet)
az keyvault show --id $kvId `
  --query "properties.networkAcls" --output json

# Listar políticas de acceso (RBAC recomendado, legacy deprecated)
az keyvault show --id $kvId `
  --query "properties.accessPolicies" --output json

# Auditoría: Logs de acceso a secretos
az monitor log-analytics query \
  --workspace $env:LOGANALYTICS_WORKSPACE_ID \
  --analytics-query "AzureDiagnostics | where ResourceType == 'VAULTS' and OperationName == 'SecretGet'"
```

**Criterios de validación**:
- ✅ Firewall habilitado (default deny)
- ✅ Service Endpoints o VNet rules configurados
- ✅ RBAC usado (no Access Policies legacy)
- ✅ Permisos granulares (get, list separados)
- ✅ Logs de auditoría en Log Analytics

### 5.4 Validación de Storage

```powershell
# Obtener propiedades de Storage Account
$saId = "/subscriptions/.../resourceGroups/.../providers/Microsoft.Storage/storageAccounts/sa-data"
az storage account show --id $saId --output json

# Verificar HTTPS only
az storage account show --id $saId `
  --query "supportsHttpsTrafficOnly" --output tsv

# Verificar acceso mínimo (no public access a blobs/containers)
az storage account show --id $saId `
  --query "properties.networkAcls" --output json

# Verificar Private Endpoints
az network private-endpoint list --resource-group $env:AZURE_RESOURCE_GROUP \
  --query "[?privateLinkServiceConnections[0].privateLinkServiceId contains('storage')]" \
  --output table

# Verificar encriptación
az storage account encryption show --account-name "saproduction" --resource-group $env:AZURE_RESOURCE_GROUP
```

**Criterios de validación**:
- ✅ HTTPS only habilitado
- ✅ Acceso público deshabilitado (default deny)
- ✅ Private Endpoints para acceso privado desde VNet
- ✅ Encriptación en reposo (AES-256, managed keys)
- ✅ Encriptación en tránsito (TLS 1.2 mínimo)

### 5.5 Validación de Logs y Diagnósticos

```powershell
# Verificar que diagnostic settings están habilitados
az monitor diagnostic-settings list --resource $kvId

# Ejemplo: Enviar logs a Log Analytics
az monitor diagnostic-settings create `
  --resource $kvId `
  --logs '[{"category":"AuditEvent","enabled":true}]' `
  --workspace $env:LOGANALYTICS_WORKSPACE_ID

# Query para revisar intentos fallidos de acceso a Key Vault
az monitor log-analytics query \
  --workspace $env:LOGANALYTICS_WORKSPACE_ID \
  --analytics-query "AzureDiagnostics | where ResultSignature == 'Unauthorized' | summarize count() by OperationName"
```

**Criterios de validación**:
- ✅ Diagnostic settings habilitados en todos los servicios PaaS
- ✅ Logs enviados a Log Analytics
- ✅ Auditoría de operaciones sensibles (secretGet, policyUpdate, etc.)
- ✅ Alertas configuradas para eventos anómalos

---

## 6. Cómo Extender los Labs

### 6.1 Añadir Azure Firewall

**Propósito**: Crear un perímetro controlado en la salida de tráfico desde aplicaciones hacia internet.

**Pasos**:
1. Crear subnet dedicado para Firewall.
2. Desplegar Azure Firewall en esa subnet.
3. Crear tabla de rutas (UDRs) que redirige tráfico de aplicaciones al Firewall.
4. Configurar reglas de Firewall (DenyAll por defecto, permitir solo destinos conocidos).

**Bicep**:
```bicep
resource firewall 'Microsoft.Network/azureFirewalls@2023-06-01' = {
  name: 'fw-${environment}'
  location: location
  properties: {
    ipConfigurations: [
      {
        name: 'fw-pip'
        properties: {
          subnet: {
            id: firewallSubnet.id
          }
          publicIPAddress: {
            id: firewallPIP.id
          }
        }
      }
    ]
  }
}
```

### 6.2 Añadir Application Gateway con WAF

**Propósito**: TLS Termination, anti-DDoS, protección contra ataques web (OWASP Top 10).

**Pasos**:
1. Crear subnet para Application Gateway.
2. Crear certificado TLS en Key Vault.
3. Desplegar Application Gateway con SKU premium (WAF_v2).
4. Configurar reglas WAF (OWASP, custom).
5. Apuntar backend pools a aplicaciones internas.

### 6.3 Añadir Defender for Cloud

**Propósito**: Monitoreo continuo de vulnerabilidades, amenazas y postura de seguridad.

**Pasos**:
1. Habilitar Defender for Cloud en la suscripción.
2. Habilitar planes avanzados (Servers, Databases, etc.).
3. Integrar con Log Analytics para análisis avanzado.
4. Crear alertas personalizadas basadas en eventos de seguridad.

### 6.4 Añadir Automatización con GitHub Actions

**Propósito**: CI/CD para despliegues consistentes y validación automática de seguridad.

**Flujo**:
```yaml
trigger: Merge a main
  ↓
Validate Bicep/Terraform
  ↓
Deploy a Staging
  ↓
Run security scans (SAST, DAST, secrets scan)
  ↓
Approval requerida
  ↓
Deploy a Production
  ↓
Post-deployment validation
```

**Fichero**: `.github/workflows/deploy.yml`

### 6.5 Adicionar Módulos Complementarios de Zero Trust

#### Conditional Access
```
Política: Si acceso desde RED no corporativa, requerir MFA
Implementación: En Azure AD, no en Bicep
```

#### Passwordless Sign-In
```
Métodos:
- Windows Hello for Business (on-premises)
- FIDO2 security keys
- Microsoft Authenticator app
```

#### Encryption & Key Rotation
```
Automatizar rotación de secretos en Key Vault usando EventGrid y Functions
```

---

## 7. Estructura de Ficheros

### Organización de Directorios

```
azure-labs/
├── README.md (este fichero)
├── bicep/
│   ├── main.bicep          # Orquestador principal
│   ├── identity.bicep      # Managed Identities + RBAC
│   ├── keyvault.bicep      # Key Vault + policies
│   ├── vnet.bicep          # Virtual Network + subnets + NSGs
│   ├── storage.bicep       # Storage Account + Private Endpoints
│   ├── outputs.bicep       # Outputs del despliegue
│   └── parameters.json     # Valors para despliegue (dev/prod)
├── terraform/
│   ├── main.tf             # Orquestador principal
│   ├── identity.tf         # Definiciones de identidad
│   ├── keyvault.tf         # Definiciones de Key Vault
│   ├── networking.tf       # VNet, subnets, NSGs
│   ├── storage.tf          # Storage + Private Endpoints
│   ├── providers.tf        # Provider Azure
│   ├── variables.tf        # Variables de entrada
│   ├── outputs.tf          # Outputs
│   └── terraform.tfvars    # Valores por defecto
├── scripts/
│   ├── deploy-bicep.ps1    # Script de despliegue Bicep
│   ├── deploy-terraform.ps1 # Script de despliegue Terraform
│   ├── validate-bicep.ps1  # Validación post-despliegue
│   ├── validate-terraform.ps1
│   └── cleanup.ps1         # Eliminar recursos
├── docs/
│   ├── zero-trust-overview.md       # Conceptos Zero Trust
│   ├── lab-01-vnet.md               # Networking lab
│   ├── lab-02-keyvault.md           # Key Vault lab
│   ├── lab-03-managed-identities.md # Identidad lab
│   ├── lab-04-storage-private-endpoints.md # Storage lab
│   ├── lab-05-monitoring.md         # Observabilidad lab
│   └── sabsa-contextual-alignment.md # Alineación arquitectónica
└── diagrams/
    ├── zero-trust-architecture.drawio
    ├── identity-flow.drawio
    ├── keyvault-access-flow.drawio
    └── network-segmentation.drawio
```

---

## 8. Recomendaciones Operacionales

### 8.1 Governance

- **Tags**: Etiquetar todos los recursos con `environment=dev|prod`, `owner=team`, `cost-center=xxxx`.
- **Policies**: Usar Azure Policy para enforcetar tagging, encryption, HTTPS, etc.
- **Resource Locks**: Aplicar CanNotDelete lock a recursos críticos en producción.

### 8.2 Costos

Los labs utilizan componentes mínimos pero incurren en costos:

| Recurso | Costo / mes (est.) | Nota |
|---------|------------------|------|
| Virtual Network | $0.05/hora | Hay que limpiar después |
| Key Vault | $0.6 | 10 operaciones secretas = $0.04 |
| Storage Account | $0.023/GB | Depende del tamaño |
| Managed Identity | $0 (gratuito) | |

**Recomendación**: Ejecutar cleanup.ps1 después de cada lab.

### 8.3 Testing

Cada despliegue debe validated automáticamente:

```powershell
# Validación sintactica
az bicep build --file main.bicep

# Validación de despliegue (what-if)
az deployment group create --what-if ...

# Validación post-despliegue
.\validate-bicep.ps1
```

---

## 9. Resources y Referencias

### Documentación Oficial
- [Azure Verified Modules (AVM)](https://azure.github.io/Azure-Verified-Modules/)
- [Azure Bicep Best Practices](https://docs.microsoft.com/en-us/azure/azure-resource-manager/bicep/best-practices)
- [Azure Security Benchmark](https://docs.microsoft.com/en-us/security/benchmark/azure/)
- [Zero Trust Implementation with Azure](https://docs.microsoft.com/en-us/security/zero-trust/)

### Certificaciones
- [AZ-305 Study Guide](https://learn.microsoft.com/en-us/credentials/certifications/azure-solutions-architect/)
- [SC-300 Study Guide](https://learn.microsoft.com/en-us/credentials/certifications/identity-and-access-administrator/)
- [SC-100 Study Guide](https://learn.microsoft.com/en-us/credentials/certifications/cloud-security-architect/)

### Frameworks de Arquitectura
- [SABSA: Sherwood Applied Business Security Architecture](https://sabsa.org/)
- [Microsoft Cloud Architecture Reference](https://docs.microsoft.com/en-us/azure/architecture/)

---

## 10. Contacto y Contribuciones

Estos laboratorios están diseñados como material de aprendizaje avanzado. Si encuentras errores, deseas mejorar contenido, o aspiras a añadir nuevos labs:

1. Revisa la sección **6. Cómo Extender** para ideas de expansión.
2. Asegúrate de que tu extensión mantiene los principios Zero Trust.
3. Documenta nuevos conceptos en `docs/`.
4. Valida que los scripts de despliegue funcionan end-to-end.

---

**Última Actualización**: 2026-04-03  
**Versión**: 1.0  
**Mantenedor**: Cloud Architecture Team
