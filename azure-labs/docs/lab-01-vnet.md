# Lab 01 — Virtual Network y segmentación de red

**Dominio:** Network  
**Duración:** ~30 minutos  
**IaC:** [bicep/vnet.bicep](../bicep/vnet.bicep) · [terraform/networking.tf](../terraform/networking.tf)

---

## Objetivos

- Desplegar una hub VNet con tres subredes definidas por propósito.
- Aplicar NSGs con denegación implícita para tráfico originado en internet.
- Crear Private DNS Zones para Key Vault y Blob Storage.
- Habilitar logs de diagnóstico de VNet hacia Log Analytics.

## Arquitectura

```
Hub VNet — 10.0.0.0/16
├── AzureBastionSubnet   10.0.3.0/27   (management)
├── snet-app             10.0.1.0/24   (workload compute)
└── snet-privateendpoints 10.0.2.0/24  (data-plane PEs)
```

## Reglas de NSG explicadas

### NSG de snet-app

| Prioridad | Nombre | Dirección | Acción | Notas |
|----------|------|-----------|--------|-------|
| 100 | deny-internet-inbound | Inbound | **Deny** | Sin exposición directa a internet |
| 200 | allow-vnet-https-inbound | Inbound | Allow | Solo HTTPS entre recursos dentro de la VNet |

### NSG de snet-privateendpoints

| Prioridad | Nombre | Dirección | Acción | Notas |
|----------|------|-----------|--------|-------|
| 100 | deny-internet-inbound | Inbound | **Deny** | Los Private Endpoints solo son alcanzables desde la VNet |

## Pasos de despliegue

### Bicep

```powershell
az deployment group create \
  --resource-group rg-zerotrust-lab \
  --template-file bicep/vnet.bicep \
  --parameters location=eastus environment=dev prefix=ztlab
```

### Terraform

```bash
terraform -chdir=terraform init
terraform -chdir=terraform apply -target=module.networking
```

## Validación

```powershell
# Confirmar que las subredes existen
az network vnet subnet list \
  --resource-group rg-zerotrust-lab \
  --vnet-name ztlab-vnet-dev \
  --query "[].{name:name, prefix:addressPrefix}" \
  --output table

# Confirmar que el NSG está asociado
az network vnet subnet show \
  --resource-group rg-zerotrust-lab \
  --vnet-name ztlab-vnet-dev \
  --name snet-app \
  --query networkSecurityGroup.id
```

## Mapeo a Zero Trust

| Principio | Control |
|-----------|---------|
| Assume Breach | Subredes aisladas; tráfico este-oeste acotado |
| Verify Explicitly | Bastion requiere autenticación con Entra ID antes de RDP/SSH |
| Least Privilege | Los NSGs deniegan por defecto; solo se abren los puertos necesarios |

## Limpieza

```powershell
./scripts/cleanup.ps1 -ResourceGroup rg-zerotrust-lab
```
