# GLOSARIO TECNICO - SEC_ARCHITECT

## CSP (Content Security Policy)
**Definicion tecnica:** Politica de seguridad del navegador que restringe origenes permitidos para scripts, estilos, imagenes, formularios y conexiones.

**Riesgos asociados:** Politica laxa puede permitir XSS, carga de recursos maliciosos o exfiltracion.

**Relevancia para este proyecto:** Control principal para reducir superficie de ataque en un sitio estatico.

## Zero Trust
**Definicion tecnica:** Modelo de seguridad basado en "never trust, always verify", con verificacion continua y minimo privilegio.

**Riesgos asociados:** Implementacion parcial puede crear falsa sensacion de seguridad.

**Relevancia para este proyecto:** Guia de decisiones para contenido, flujos y controles del cliente web.

## IG1-IG3 (CIS Implementation Groups)
**Definicion tecnica:** Niveles de madurez en CIS Controls para priorizar controles segun contexto organizacional.

**Riesgos asociados:** Elegir nivel inadecuado puede sobredimensionar o subproteger.

**Relevancia para este proyecto:** Marco para comunicar prioridades de hardening a PYMEs.

## Sanitizacion
**Definicion tecnica:** Proceso de limpieza/filtrado de contenido para remover elementos peligrosos antes de renderizarlo.

**Riesgos asociados:** Sanitizacion incompleta puede habilitar XSS o inyeccion DOM.

**Relevancia para este proyecto:** Critica en render de Markdown dinamico.

## DOMPurify
**Definicion tecnica:** Libreria de sanitizacion HTML cliente para eliminar markup potencialmente peligroso.

**Riesgos asociados:** Configuracion incorrecta o ausencia de actualizaciones reduce efectividad.

**Relevancia para este proyecto:** Referencia para fortalecimiento futuro de sanitizacion del blog.

## MITRE ATT&CK
**Definicion tecnica:** Base de conocimiento de tacticas y tecnicas de adversarios reales.

**Riesgos asociados:** Uso superficial sin contexto operativo puede generar controles poco utiles.

**Relevancia para este proyecto:** Permite mapear amenazas web concretas a mitigaciones priorizadas.

## STRIDE
**Definicion tecnica:** Modelo de amenazas por categorias: Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege.

**Riesgos asociados:** Si no se actualiza, deja brechas sin seguimiento.

**Relevancia para este proyecto:** Estructura analitica para THREAT_MODEL.md.

## WAF (Web Application Firewall)
**Definicion tecnica:** Capa de inspeccion y filtrado HTTP/HTTPS para bloquear patrones de ataque conocidos y personalizados.

**Riesgos asociados:** Reglas mal calibradas pueden generar falsos positivos o bypass.

**Relevancia para este proyecto:** Componente futuro al integrar Azure Front Door.

## Anycast
**Definicion tecnica:** Estrategia de ruteo en la que multiples nodos comparten una misma IP para enrutar al punto mas cercano.

**Riesgos asociados:** Configuracion insuficiente puede dificultar troubleshooting geografico.

**Relevancia para este proyecto:** Base de escalamiento global con menor latencia.

## CDN
**Definicion tecnica:** Red de distribucion de contenido para acelerar entrega y mejorar disponibilidad.

**Riesgos asociados:** Dependencia de terceros, cache poisoning, invalidaciones incorrectas.

**Relevancia para este proyecto:** Evolucion natural para resiliencia y rendimiento global.

## Formspree
**Definicion tecnica:** Servicio externo para procesamiento de formularios sin backend propio.

**Riesgos asociados:** Dependencia externa, abuso de endpoint, leakage de metadata.

**Relevancia para este proyecto:** Canal actual de contacto del sitio.

## GitHub Pages
**Definicion tecnica:** Hosting estatico gestionado por GitHub para publicar contenido HTML/CSS/JS.

**Riesgos asociados:** Limitaciones de cabeceras avanzadas y menor control de edge.

**Relevancia para este proyecto:** Plataforma de publicacion principal actual.

## SVG inline
**Definicion tecnica:** Insercion de SVG directamente en HTML para control de estilo y accesibilidad.

**Riesgos asociados:** SVG malicioso con contenido activo si no se valida origen/contenido.

**Relevancia para este proyecto:** Uso de iconografia oficial en footer y UI.

## Hardening
**Definicion tecnica:** Proceso sistematico de reduccion de superficie de ataque mediante configuraciones seguras.

**Riesgos asociados:** Hardening incompleto deja rutas de explotacion activas.

**Relevancia para este proyecto:** Pilar central de arquitectura y contenido.

## Resiliencia operativa
**Definicion tecnica:** Capacidad de mantener operacion aceptable durante fallos y recuperarse rapidamente.

**Riesgos asociados:** Dependencias no controladas elevan probabilidad de interrupcion.

**Relevancia para este proyecto:** Objetivo principal del sitio y de su narrativa tecnica.
