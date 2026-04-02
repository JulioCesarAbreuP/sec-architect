# Identidad y Cuenta: Fundamentos Arquitectónicos

**Arquitectura de identidad, control de acceso y principios de seguridad moderna.**

---

[Volver al documento principal de Identidad y Cuenta](./identidad-vs-cuenta/index.html)

---

## Introducción

En arquitectura de seguridad cloud, uno de los conceptos menos comprendidos pero más críticos es la distinción entre **identidad** y **cuenta**. A menudo se usan como sinónimos, pero representan capas distintas de un modelo de control de acceso.

Una arquitectura segura, gobernable y escalable comienza cuando los arquitectos entienden esta diferencia y la implementan conscientemente en sus diseños.

Este documento explora esta separación desde una perspectiva arquitectónica, especialmente relevante en Azure y entornos cloud modernos.

---

## 1. Diferencia entre Identidad y Cuenta

### Identidad: El Concepto Abstracto

La **identidad** es la representación lógica y conceptual de un sujeto dentro de un sistema. Es la respuesta a la pregunta: **¿Quién eres?**

- **Ejemplos de identidades**:
  - María García (persona)
  - API de facturación (servicio/aplicación)
  - Servidor de bases de datos (dispositivo/recurso)
  - Partner externo de integración (entidad federated)

**Características de una Identidad**:
- Es única y distinguible dentro de un dominio.
- No depende de contraseñas, tokens o credenciales.
- Puede permanecer inactiva sin credenciales vigentes.
- Tiene atributos (departamento, ubicación, rol, costo), relaciones (manager, equipos) y políticas asociadas.
- Es el sujeto de las decisiones de autorización.

### Cuenta: La Implementación Técnica

La **cuenta** es la materialización de una identidad dentro de un **sistema específico**. Responde a: **¿Dónde y cómo existe esa identidad?**

- **Ejemplos de cuentas**:
  - Una persona María García tiene:
    - Una cuenta en Azure AD (Entra ID)
    - Una cuenta en el servidor SQL de producción
    - Una cuenta en el GitHub corporativo
  - Una aplicación de facturación tiene:
    - Una Managed Identity en Azure
    - Una cuenta de servicio en el cluster Kubernetes
    - Una cuenta técnica en Dataverse

**Características de una Cuenta**:
- Es la representación operativa en un contexto técnico específico.
- Define dónde se validan credenciales.
- Determina las políticas aplicables (password expiration, MFA, etc.).
- Controla qué recursos puede ver, acceder o administrar.
- Genera logs de auditoría en su respectivo dominio.

### Relación Conceptual

```
Identidad (QUIÉN)
    ↓
    ├─ Cuenta en Azure AD (DÓNDE)
    ├─ Cuenta en Kubernetes (DÓNDE)
    └─ Cuenta en SQL Server (DÓNDE)
```

**Una identidad puede tener múltiples cuentas.**
**Todas las cuentas representan al mismo sujeto.**

---

## 2. Rol de Entra ID (Azure AD) en la Arquitectura Moderna

Entra ID (anteriormente Azure AD) es la **autoridad central de identidades** en la mayoría de arquitecturas Azure empresariales. No es simplemente un "gestor de contraseñas"; es el plano de control de identidades.

### Posición de Entra ID en la Arquitectura

```
┌─────────────────────────────────────────────────┐
│         Entra ID (Azure AD)                     │
│    Autoridad Central de Identidades             │
│  (Authentication & Authorization)               │
└────────┬──────────────────────────────────┬─────┘
         │                                  │
    ┌────▼────────┐               ┌────────▼──────┐
    │  Azure      │               │  On-Premises  │
    │  Resources  │               │  AD / LDAP    │
    │             │               │  (Sync)       │
    └─────────────┘               └───────────────┘
         │                                  │
    ┌────▼──────────┐              ┌───────▼──────┐
    │ Key Vault     │              │  Enterprise  │
    │ Storage       │              │  Applications│
    │ SQL Database  │              │  (SSO)       │
    └───────────────┘              └──────────────┘
```

### Funciones de Entra ID

| Función | Descripción | Implicación Arquitectónica |
|---------|-------------|---------------------------|
| **Autenticación** | Verifica que eres quien dices ser | Validación de credenciales centralizada |
| **Autorización** | Determina qué puedes hacer | RBAC, Conditional Access, políticas |
| **Gobernanza** | Auditoría y cumplimiento | Logs, access reviews, certificación periódica |
| **Federación** | Conecta múltiples dominios | Híbrido (on-prem + cloud), partners externos |
| **Token Generation** | Crea tokens para aplicaciones | OAuth 2.0, OpenID Connect, SAML |

### Implicaciones Arquitectónicas

1. **Entra ID es la fuente única de verdad (SSOT) para identidades**:
   - No crees cuentas locales en servicios PaaS sin justificación.
   - Todas las decisiones de acceso fluyen a través de Entra ID.

2. **Integración es obligatoria, no opcional**:
   - Aplicaciones usan Entra ID para autenticación.
   - No hardcodees credenciales de servicios; usa Managed Identities.

3. **Auditoría centralizada**:
   - Entra ID Sign-in Logs y Audit Logs son la verdad.
   - Los logs locales de cada servicio complementan, pero Entra ID es la fuente.

---

## 3. El Plano de Control Basado en Identidad

En seguridad moderna, **la identidad es el nuevo perímetro**. Esto significa que las decisiones de acceso no se basan en "¿de dónde vienes?" sino en "¿quién eres?"

### Del Perímetro Clásico al Plano de Control de Identidad

#### Modelo Antiguo (Perímetro Basado en Red)
```
┌─────────────────────────────────────┐
│  FIREWALL (perímetro confiable)    │
│  ┌──────────────────────────────┐  │
│  │ DENTRO: Todo es de confianza │  │
│  │ FUERA: Nada es confiable     │  │
│  └──────────────────────────────┘  │
└─────────────────────────────────────┘
```

**Problemas**:
- Insider threats no se detectan.
- Movimiento lateral una vez dentro.
- Escalada de privilegios sin fricción.

#### Modelo Moderno (Plano de Control de Identidad - Zero Trust)
```
┌─────────────────────────────────────┐
│  IDENTIDAD (quién eres)            │
│  ├─ Azure AD: Valida quién eres   │
│  ├─ RBAC: Define qué puedes hacer │
│  ├─ Políticas: Impone restricciones│
│  └─ Auditoría: Registra acciones  │
└─────────────────────────────────────┘
```

**Ventajas**:
- Confianza verificada continuamente.
- Auditoría completa de cada acción.
- Restricciones aplicadas en cada capa.
- Reducción de movimiento lateral.

### Implementación en Azure

```powershell
# 1. Identidad (quién eres)
$identity = Get-AzADUser -UserPrincipalName "maria@contoso.com"

# 2. Contexto (dónde estás, desde dónde accedes)
$context = @{
    Location = "IP:203.0.113.42"
    Device = "Compliant MDM Device"
    Time = "Business Hours"
}

# 3. Políticas (qué puedes hacer)
# Entra ID Conditional Access evalúa identidad + contexto
# Si (Identidad = Maria) AND (Location = Outside Corp) 
#   THEN requerir MFA
# Si (Identidad = Service) AND (Intent = Read Secret)
#   THEN verificar RBAC + Key Vault policy
```

---

## 4. Relación con Zero Trust

Zero Trust no es una tecnología; es una **filosofía de arquitectura** que asume que ningún recurso es inherentemente confiable, incluso dentro de la red corporativa.

### Principios Zero Trust Relacionados con Identidad

| Principio | Implicación | Implementación |
|-----------|-------------|-----------------|
| **Verificación Explícita** | Cada solicitud se verifica contra identidad + contexto | Entra ID + Conditional Access |
| **Least Privilege** | Mínimos permisos necesarios | RBAC granular, Privileged Access Management |
| **Asumir Breach** | Presupone que un atacante ya está dentro | Auditoría, segmentación, logs centralizados |
| **Asegurar cada capa** | No confíes en el perímetro | Identidad en cada acceso |

### Flujo Zero Trust de Acceso a Recurso

```
Usuario solicita acceso a Storage Blob
    ↓
1. ¿Quién eres? (Autenticación en Entra ID)
    ↓
2. ¿Desde dónde? (Conditional Access: ubicación, dispositivo, riesgo)
    ↓
3. ¿Qué permiso tienes? (RBAC: Azure Role)
    ↓
4. ¿Está permitido el acceso en el recurso? (Storage Account RBAC)
    ↓
5. ✅ ACCESO PERMITIDO + AUDITORÍA REGISTRADA
```

Si cualquier paso falla → ACCESO DENEGADO + ALERTA.

---

## 5. Riesgos Comunes Cuando Identidad y Cuenta Se Confunden

Cuando la arquitectura no distingue claramente entre identidad y cuenta, aparecen vulnerabilidades y problemas de gobernanza:

### 1. Privilegios Excesivos No Auditables

**Problema**:
```
Escenario: Un desarrollador necesita acceso a una base de datos.
Error: Se crea una credencial local en SQL Server a su nombre.

Resultado:
- La credencial no está ligada a su identidad en Entra ID.
- Los logs de SQL Server no se correlacionan con Entra ID.
- Si se va de la empresa, la credencial local se olvida limpiar.
- Auditoría incompleta.
```

**Solución Correcta**:
```
1. Entra ID valida la identidad del desarrollador.
2. Azure RBAC asigna "SQL DB Data Contributor" al grupo de desarrolladores.
3. El desarrollador se autentica contra Entra ID.
4. Azure propaga la identidad a SQL Server.
5. SQL Server valida contra la identidad de Azure.
6. Logs en Entra ID + SQL Server se correlacionan.
```

### 2. Identidades Huérfanas

**Problema**:
```
Escenario: Una aplicación se autenticaba con un "user=app_svc, password=abc123".
La contraseña está en un .config file, un vault, o en memoria.
La aplicación se migra, se cambia el código, pero la credencial vieja queda activa.

Resultado:
- Credencial fantasma en el sistema.
- Auditoría incompleta (solo el user, sin contexto).
- Si se expone la credencial, acceso no autorizado sin detectar.
```

**Solución Correcta**:
```
Usar Managed Identities:
- Azure crea una identidad automáticamente.
- Credenciales rotadas automáticamente cada 24h.
- Sin secretos en código, archivos o vaults.
- Auditoría con contexto completo.
```

### 3. Cuentas Sin Propósito Claro

**Problema**:
```
Escenario: Auditoría detecta 500 cuentas activas en un SQL Server.
¿Cuántas de esas 500 se siguen usando?
¿Cuántas tienen permisos excesivos?

Resultado:
- Superficie de ataque ampliada.
- Mantenimiento complejo.
- Violaciones de least privilege.
- Obsolescencia impredecible.
```

**Solución Correcta**:
```
1. Cada cuenta debe tener propósito documentado.
2. Propietario responsable de la cuenta.
3. Revisión periódica de acceso (access review).
4. Si no se usa → desactivar.
5. Si se desactiva un tiempo → eliminar.
```

### 4. Negación de Acceso Confusa

**Problema**:
```
"¿Por qué no podemos acceder a este storage account?"

Causas posibles (sin claridad):
- ¿Falta autenticación en Entra ID?
- ¿Problema de RBAC en Azure?
- ¿Falta política en el Storage Account?
- ¿Bloqueo a nivel de firewall?
- ¿Credencial expirada en la aplicación?
```

**Solución Correcta**:
```
Arquitectura clara:
1. Identidad validada en Entra ID. ← Entra ID logs
2. RBAC evaluado en Azure Resource Manager. ← Azure logs
3. Políticas del recurso específico evaluadas. ← Resource logs
4. Cada capa registra su decisión.
5. Troubleshooting sigue un árbol de decisión claro.
```

---

## 6. Buenas Prácticas para PYMEs

Las pequeñas y medianas empresas a menudo no tienen equipos dedicados de seguridad. Aquí hay recomendaciones prácticas:

### 1. Centralizar Identidades en Entra ID (O-365)

**Por qué**: Un único lugar de verdad reduce complejidad y errores.

**Cómo**:
- Si tienen Microsoft 365, Entra ID está incluido.
- Migrar cuentas locales de AD a Entra ID (sincronización o migración pura).
- Configurar SSO para aplicaciones cloud.

**Costo**: Básicamente incluido en suscripciones Office 365.

### 2. Evitar Credenciales Locales en Servicios

**Por qué**: Las credenciales locales no son auditables.

**Cómo**:
- Usar Managed Identities para aplicaciones en Azure.
- Si no es posible, minimalizar cuentas locales y documentar cada una.
- Implementar rotación automática de credenciales.

**Costo**: Managed Identities son gratuitas.

### 3. Implementar Access Reviews Trimestrales

**Por qué**: Los permisos cían con el tiempo sin actualización.

**Cómo**:
```powershell
# En Azure:
# 1. Azure Identity Governance → Access Reviews
# 2. Crear una revisión para cada grupo/rol crítico
# 3. Propietario del grupo revisa quién tiene acceso
# 4. Si no está vigente → remover

# Periodicidad: Trimestral (Q1, Q2, Q3, Q4)
```

**Costo**: Incluido en Azure Free Tier o licencias estándar.

### 4. Implementar Least Privilege (Lentamente)

**Por qué**: Reducir la superficie de ataque.

**Cómo**:
- No asignar roles Contributor a todos.
- Crear grupos por función (Developers, DBAs, Ops).
- Asignar roles específicos a esos grupos.
- Revisar permisos excesivos anualmente.

**Costo**: Ninguno; es una práctica operacional.

### 5. Auditoría Básica

**Por qué**: Detectar compromiso, cumplir regulaciones.

**Cómo**:
- Habilitar diagnósticos en Entra ID (Sign-in logs, Audit logs).
- Enviar a Log Analytics.
- Crear alertas para eventos sospechosos (múltiples fallos de login, permisos deletreados, etc.).

**Costo**: ~$5-30/mes por GB en Log Analytics.

---

## 7. Alineación con Certificaciones Microsoft

### SC-300: Identity and Access Administrator

**Temas cubiertos por este documento**:
- Planificación e implementación de autenticación.
- Gestión de usuarios y grupos.
- RBAC y políticas de acceso.
- Auditoría de identidades.

**Relevancia**: Este documento es **fundacional** para SC-300. Entiende la distinción identidad ↔ cuenta antes de profundizar en políticas.

### SC-100: Security Engineering on Azure

**Temas cubiertos**:
- Diseño de arquitectura segura (Identidad como plano de control).
- Zero Trust implementation.
- Gobernanza de identidades.

**Relevancia**: La visión arquitectónica de este documento alinea directamente con la mentalidad SC-100.

### AZ-305: Azure Solutions Architect

**Temas cubiertos**:
- Diseño de soluciones seguras y gobernable.
- Integración de seguridad en arquitectura.
- Buenas prácticas de RBAC y gobernanza.

**Relevancia**: Un arquitecto AZ-305 debe dominar esta separación conceptual para diseñar soluciones escalables.

### AZ-500: Azure Security Engineer

**Temas cubiertos**:
- Implementación de Entra ID.
- RBAC y Privileged Access Management.
- Auditoría y monitoreo.

**Relevancia**: Este documento proporciona el contexto conceptual para las implementaciones técnicas de AZ-500.

---

## SABSA y Progresión Arquitectónica

> *Este análisis sigue una progresión contextual → conceptual → lógica coherente con marcos de arquitectura como SABSA.*

**SABSA** (Sherwood Applied Business Security Architecture) propone que la seguridad debe diseñarse en capas:

1. **Contextual** (¿por qué?): Negocio requiere diferenciación entre identidad y cuenta.
2. **Conceptual** (¿qué?): Definiciones claras e independientes.
3. **Lógica** (¿cómo?): Implementación en Entra ID, RBAC, políticas.
4. **Física** (¿dónde?): Servidores, bases de datos, aplicaciones.

Por eso este documento no comienza con "instala Entra ID"; comienza con el modelo mental correcto.

---

## Puntos Clave

- **Identidad** = Quién eres (concepto abstracto).
- **Cuenta** = Dónde existes (implementación en un sistema).
- **Una identidad puede tener múltiples cuentas.**
- **Entra ID es la autoridad central de identidades** en arquitecturas Azure modernas.
- **Identidad es el nuevo perímetro**: Las decisiones de acceso se basan en "quién eres", no en "de dónde vienes".
- **Zero Trust verifica identidad en cada capa**: Autenticación, autorización, auditoría.
- **Riesgos comunes**: Privilegios excesivos, identidades huérfanas, cuentas sin propósito, auditoría incompleta.
- **Buenas prácticas para PYMEs**: Centralizar en Entra ID, evitar credenciales locales, access reviews, least privilege, auditoría.
- **Relevancia para certificaciones**: Fundacional para SC-300, SC-100, AZ-305, AZ-500.
- **Arquitectura correcta**: Separación clara de conceptos → diseños seguros y gobernables.

---

**Última Actualización**: 2026-04-03  
**Categoría**: Arquitectura de Identidad  
**Nivel**: Arquitecto / Senior Engineer
