# SEC_ARCHITECT | Enterprise Resilience Architecture

Este repositorio implementa una plataforma editorial y de concienciacion tecnica orientada a arquitectura de seguridad, identidad y resiliencia operacional en entornos cloud.

No se trata de una pagina estatica convencional: el proyecto modela controles de hardening, sanitizacion y gobernanza de acceso bajo un enfoque de defensa en profundidad.

La estructura de este proyecto sigue una progresion contextual -> conceptual -> logica inspirada en marcos de arquitectura como SABSA.

## Objetivo Arquitectonico

1. Traducir principios de identidad moderna (identidad, cuenta, credencial) en controles tecnicos verificables.
2. Exponer un dashboard educativo de riesgo de credenciales sin comprometer privacidad del usuario.
3. Mantener trazabilidad de mitigaciones alineadas con Zero Trust, RBAC y operaciones seguras.

## Controles de Seguridad Implementados

El repositorio incluye además una Base de Conocimiento estructurada en [data/knowledge-base.json](data/knowledge-base.json), con 50 reglas técnicas defensivas agrupadas en NSA, CISA, MITRE, NIST/ISO y CVE.

### 1. Mitigacion Avanzada de XSS e Injection

- Content Security Policy (CSP) v3 para restringir origenes de scripts, estilos, fuentes y conexiones.
- Sanitizacion defensiva de contenido dinamico en el renderizado de blog y post para reducir riesgo de inyeccion en el DOM.

### 2. Integridad y Transporte Seguro

- Uso de cabeceras de endurecimiento: X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy.
- Enforzamiento de HTTPS con upgrade-insecure-requests y bloqueo de mixed content.

### 3. Resiliencia Operativa

- Flujo de contacto robusto con validaciones de estado y degradacion controlada.
- Motor de blog dinamico compatible con posts.json y resolucion segura de rutas relativas.

## k-Anonymity en la API de contrasenas

El dashboard integra una evaluacion de brechas usando el modelo k-Anonymity sobre hashes SHA-1.

### Como funciona

1. La contrasena se transforma localmente en un hash SHA-1 dentro del navegador.
2. Se separa el hash en:
- Prefijo: primeros 5 caracteres.
- Sufijo: resto del hash.
3. Solo el prefijo se envia al endpoint de rango.
4. El servicio responde con multiples sufijos candidatos y conteos de exposicion.
5. La comparacion final se hace localmente: el hash completo nunca sale del cliente.

### Por que protege la privacidad del hash

- El servidor no recibe la huella completa, por lo tanto no puede reconstruir de forma directa la contrasena evaluada.
- Cada prefijo corresponde a un conjunto amplio de hashes posibles (anonimato por conjunto), lo que reduce capacidad de correlacion individual.
- La validacion final en cliente elimina necesidad de transmitir material sensible completo durante el transito.

### Diagrama textual de flujo (k-Anonymity)

```text
[Usuario ingresa contrasena]
		  |
		  v
[Navegador calcula SHA-1 local]
		  |
		  v
[Divide hash: PREFIJO(5) + SUFIJO(35)]
		  |
		  v
[Envia solo PREFIJO a API /range]
		  |
		  v
[API devuelve lista de SUFIJOS candidatos + conteos]
		  |
		  v
[Cliente compara SUFIJO local contra respuesta]
		  |
		  v
[Dashboard determina nivel de riesgo]
```

## Dashboard de Riesgo de Credenciales

El dashboard incorpora tres componentes educativos:

1. Exposicion en brechas mediante k-Anonymity.
2. Entropia estimada en bits.
3. Simulacion matematica de tiempo de crackeo (sin ejecutar ataques reales).

El color #ff4d4d se reserva exclusivamente para riesgo critico.

## Mitigacion Paso a Paso

Esta seccion se muestra en el dashboard unicamente cuando el riesgo evaluado es ROJO (critico). El objetivo es orientar contencion segura y no destructiva.

1. Deshabilitar cuenta comprometida.
2. Requerir MFA.
3. Revisar roles RBAC.
4. Rotar credenciales.

Comando PowerShell seguro de contencion:

```powershell
Update-AzureADUser -ObjectId <ID> -AccountEnabled $false
```

## Amenaza vs Mitigacion

| Amenaza | Herramienta | Mitigacion |
|--------|-------------|------------|
| Credential Stuffing | Auditor HIBP (k-Anonymity) | MFA resistente a phishing (SC-300) |
| Password Reuse | Auditor de brechas | Rotacion + Passwordless |
| Exposicion de cuentas privilegiadas | Dashboard de riesgo | Revision RBAC + PIM |

## Managed Identities (AZ-104 / SC-300)

En arquitectura moderna, la mejor cuenta para aplicaciones en Azure es una Managed Identity.

### Motivo arquitectonico

- Representa la identidad de la carga de trabajo sin secretos embebidos en codigo.
- Elimina dependencia de credenciales estaticas de larga vida.
- Habilita trazabilidad completa de accesos con contexto de identidad real.

### Secretless Architecture

Un enfoque secretless evita almacenar contrasenas, client secrets o llaves privadas en archivos de configuracion, variables de entorno permanentes o repositorios.

Patron recomendado:

1. Aplicacion autenticada con Managed Identity.
2. Autorizacion por RBAC de minimo privilegio.
3. Acceso a recursos (Key Vault, Storage, SQL, APIs) sin secretos persistentes en codigo.

### Relacion con Zero Trust

- Verificacion explicita: cada solicitud se valida por identidad y contexto.
- Minimo privilegio: permisos granulares y revisables.
- Asumir breach: reduccion del impacto al no exponer secretos reutilizables.

## Alineacion con Certificaciones y Marcos

- Microsoft Azure AZ-104: identidad de cargas de trabajo, RBAC y operacion segura.
- Microsoft SC-300: gobierno de acceso, MFA y proteccion de identidades.
- AZ-305: decisiones de arquitectura de seguridad a escala.
- CIS Controls v8 y NIST: disciplina de proteccion, deteccion y respuesta.

## Contacto Profesional

[LinkedIn - Julio Cesar Abreu](https://www.linkedin.com/in/juliocesarabreup)
