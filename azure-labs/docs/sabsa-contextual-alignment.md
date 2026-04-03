# Alineación contextual de SABSA — Zero Trust Azure Lab

## Visión general

SABSA (Sherwood Applied Business Security Architecture) proporciona un marco en capas para alinear la arquitectura de seguridad con los objetivos del negocio.
Este documento alinea los controles del Zero Trust Azure Lab con las capas **Contextual** y **Conceptual** de SABSA.

---

## Capas de SABSA aplicadas

| Capa | Qué responde | Artefacto del laboratorio |
|-------|----------------|--------------|
| Contextual (Business) | ¿Por qué hacemos esto? | Factores de riesgo de negocio descritos más abajo |
| Conceptual (Architecture) | ¿Qué protegemos? | Activos y límites de confianza (trust boundaries) |
| Logical (Design) | ¿Cómo funciona? | Principios de Zero Trust |
| Physical (Technology) | ¿Con qué? | Servicios de Azure |
| Component (Implementation) | ¿Cómo exactamente? | Módulos de Bicep / Terraform |

---

## Capa Contextual — factores de riesgo del negocio

| Riesgo | Impacto de negocio | Probabilidad |
|------|----------------|-----------|
| Credential compromise | Brecha de datos, multa regulatoria | Alta |
| Insider threat | Robo de propiedad intelectual, sabotaje | Media |
| Lateral movement después de una brecha inicial | Compromiso completo del entorno | Alta |
| Secretos expuestos en código | Punto de entrada para supply chain attack | Alta |
| Datos en tránsito sin cifrar | Incumplimiento regulatorio | Media |

---

## Capa Conceptual — activos y límites de confianza

```
┌─────────────────────────────────────────────┐
│  TRUST BOUNDARY: Azure Subscription         │
│                                             │
│  ┌──────────────────────────────────────┐   │
│  │  TRUST BOUNDARY: Resource Group      │   │
│  │                                      │   │
│  │  ┌────────────────┐                  │   │
│  │  │  IDENTITY PLANE│  Entra ID        │   │
│  │  │  (Managed ID)  │  IMDS token flow │   │
│  │  └───────┬────────┘                  │   │
│  │          │ Token                     │   │
│  │  ┌───────▼────────┐                  │   │
│  │  │  NETWORK PLANE │  VNet + NSG      │   │
│  │  │  snet-app      │  Private DNS     │   │
│  │  └───────┬────────┘                  │   │
│  │          │ Private Link              │   │
│  │  ┌───────▼────────┐                  │   │
│  │  │  DATA PLANE    │  Key Vault       │   │
│  │  │  snet-pe       │  Blob Storage    │   │
│  │  └────────────────┘                  │   │
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

---

## Capa Logical — mapa de controles de Zero Trust

| Principio de Zero Trust | Atributo de seguridad SABSA | Control |
|---------------------|------------------------|---------|
| Verify Explicitly | Authenticity | Managed Identity + token de Entra ID |
| Verify Explicitly | Non-repudiation | Logs `AuditEvent` de Key Vault |
| Least Privilege | Confidentiality | Roles RBAC acotados por recurso |
| Least Privilege | Integrity | `allowSharedKeyAccess: false` |
| Assume Breach | Availability | Los private endpoints eliminan la superficie de ataque pública |
| Assume Breach | Auditability | Log Analytics + consultas y alertas KQL |

---

## Capa Physical — mapeo de servicios de Azure

| Función de seguridad | Servicio de Azure |
|-------------------|--------------|
| Identity Provider | Microsoft Entra ID |
| Secret Store | Azure Key Vault |
| Segmentación de red | Azure Virtual Network + NSG |
| Conectividad privada | Azure Private Endpoint + Private DNS |
| Acceso privilegiado | Azure Bastion |
| SIEM / agregación de logs | Azure Log Analytics Workspace |
| Cumplimiento de IaC | Bicep / Terraform + validación en CI |

---

## Referencias

- SABSA Institute: https://sabsa.org
- Microsoft Zero Trust: https://learn.microsoft.com/security/zero-trust/
- NIST SP 800-207 Zero Trust Architecture: https://doi.org/10.6028/NIST.SP.800-207
