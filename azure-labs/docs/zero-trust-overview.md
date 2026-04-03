# Visión general de Zero Trust — Azure Lab

## ¿Qué es Zero Trust?

Zero Trust es un modelo de seguridad basado en tres principios centrales:

1. **Verify Explicitly** — Autenticar y autorizar cada solicitud usando todas las señales disponibles (identidad, ubicación, estado del dispositivo, servicio, workload y clasificación de datos).
2. **Use Least Privilege Access** — Limitar el acceso de usuarios y workloads con just-in-time (JIT), just-enough-access (JEA), políticas adaptativas basadas en riesgo y protección de datos.
3. **Assume Breach** — Minimizar el radio de impacto, segmentar accesos, verificar cifrado de extremo a extremo y usar analítica para obtener visibilidad y detectar amenazas de forma temprana.

## Pilares de arquitectura en este laboratorio

| Pilar | Implementación |
|--------|---------------|
| **Identity** | User-Assigned Managed Identities; sin contraseñas de service principal |
| **Network** | Hub VNet con subredes segmentadas por NSG; sin ruta a internet |
| **Data** | Storage con `allowSharedKeyAccess: false`; solo private endpoints |
| **Applications** | Los workloads se autentican mediante IMDS → intercambio de tokens con Entra ID |
| **Infrastructure** | Configuración impuesta con Bicep/Terraform; IaC revisada en pipeline de CI |
| **Monitoring** | Todos los diagnósticos de recursos → Log Analytics Workspace |

## Control Plane vs. Data Plane

```
Control Plane (Azure Resource Manager / Portal)
  Azure RBAC roles controlan quién puede administrar recursos.

Data Plane (Key Vault secrets API, Blob storage API)
  Azure RBAC roles controlan quién puede leer/escribir datos.
  Public access DISABLED: el tráfico debe pasar por Private Endpoint.
```

## Topología de red

```
Internet
  │
  └─► Azure Bastion (HTTPS 443) ──► AzureBastionSubnet (10.0.3.0/27)
                                           │
                               ┌───────────▼───────────┐
                               │   snet-app             │
                               │   10.0.1.0/24          │
                               │   NSG: deny-internet   │
                               └───────────┬───────────┘
                                           │  Private Link
                               ┌───────────▼───────────┐
                               │   snet-privateendpoints│
                               │   10.0.2.0/24          │
                               │   PE → Key Vault       │
                               │   PE → Blob Storage    │
                               └───────────────────────┘
```

## Mitigaciones de amenazas

| Amenaza | Mitigación |
|--------|-----------|
| Credential theft | Sin contraseñas: solo Managed Identity |
| Exfiltración de secretos | Key Vault purge protection + RBAC; audit logs |
| Exfiltración de datos | Private endpoints; acceso público a Storage deshabilitado |
| Lateral movement | NSG `deny-internet-inbound` en todas las subredes de cómputo |
| Insider threat | Entra ID Conditional Access; PIM para roles privilegiados |
| Supply chain | IaC validada y analizada en CI (`tfsec` / PSRule for Azure) |

## Referencias

- [Microsoft Zero Trust Guidance](https://learn.microsoft.com/security/zero-trust/)
- [Azure network security best practices](https://learn.microsoft.com/azure/security/fundamentals/network-best-practices)
- [Azure Key Vault security](https://learn.microsoft.com/azure/key-vault/general/security-features)
