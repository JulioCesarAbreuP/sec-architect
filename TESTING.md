# TESTING - SEC_ARCHITECT

Este documento define una estrategia de pruebas tecnicas y de seguridad para un sitio estatico con blog dinamico en Markdown.

## Alcance
- Home, blog, post, articulos y recursos estaticos.
- JS de formulario, tema global, listado de posts y render Markdown.
- Controles de seguridad de navegador (CSP y cabeceras).

## 1) Pruebas de Lighthouse

### Objetivo
Garantizar calidad minima en Performance, SEO, Best Practices y Accessibility.

### Procedimiento
1. Ejecutar Lighthouse para `index.html`, `blog.html`, `post.html`.
2. Repetir en Desktop y Mobile.
3. Comparar contra baseline historico.

### Criterios sugeridos
- Performance >= 85
- Accessibility >= 90
- Best Practices >= 90
- SEO >= 90

## 2) Pruebas de CSP

### Objetivo
Validar que solo se ejecuten recursos permitidos.

### Casos
- Intentar cargar script remoto no permitido y confirmar bloqueo.
- Inyectar handler inline en DevTools y confirmar denegacion.
- Verificar en consola ausencia de violaciones legitimas.
- Confirmar `form-action` restringido a origenes autorizados.

### Evidencia
- Capturas de consola y Network.
- Registro de directiva violada y ruta.

## 3) Pruebas de sanitizacion del blog

### Objetivo
Evitar XSS y HTML peligroso en contenido Markdown.

### Casos
- Payload con `<script>alert(1)</script>`.
- Payload con `javascript:` en enlaces.
- Payload con atributos `onerror`, `onclick`.
- Payload con `iframe` embebido no permitido.

### Resultado esperado
- Elementos/atributos peligrosos removidos.
- Sin ejecucion de codigo activo en navegador.

## 4) Pruebas del formulario

### Objetivo
Verificar robustez operativa y controles anti-abuso.

### Casos
- Submit valido con campos requeridos.
- Submit invalido (email mal formado, campos vacios).
- Prueba de honeypot `_hp_filter` con valor no vacio.
- Manejo de timeout o error de servicio externo.

### Resultado esperado
- Mensajeria clara al usuario.
- No fuga de detalles internos en errores.

## 5) Pruebas de accesibilidad

### Objetivo
Asegurar uso correcto por teclado y lectores de pantalla.

### Casos
- Navegacion completa con teclado.
- Foco visible en elementos interactivos.
- Contraste suficiente en tema oscuro y claro.
- `aria-label` correcto en iconos sociales y botones.

## 6) Pruebas de carga (simuladas)

### Objetivo
Evaluar comportamiento bajo picos moderados en sitio estatico.

### Casos sugeridos
- Multiples cargas concurrentes de `index.html` y `blog.html`.
- Solicitudes repetidas de assets CSS/JS/SVG.
- Navegacion simultanea a posts dinamicos.

### Metricas
- Tiempo de respuesta promedio.
- Errores HTTP observados.
- Variacion de latencia por recurso.

## 7) Pruebas de resiliencia del sitio estatico

### Objetivo
Comprobar continuidad ante fallos parciales.

### Casos
- Fallo de CDN externo (fuentes/librerias) y degradacion controlada.
- Error en `posts.json` o ausencia de archivo.
- Post inexistente solicitado por query param.
- Falla de Formspree durante envio.

### Resultado esperado
- Mensajes de error controlados.
- Sitio navegable aun con degradacion parcial.

## 8) Pruebas de compatibilidad de navegadores

### Objetivo
Validar funcionamiento en navegadores principales.

### Matriz minima
- Chromium (Chrome/Edge)
- Firefox
- Safari (si aplica)

### Casos
- Render visual consistente.
- Tema oscuro/claro persistente.
- Footer e iconos SVG correctos.
- Blog dinamico funcional.

## 9) Pruebas del modo oscuro y claro

### Objetivo
Asegurar experiencia consistente y persistente.

### Casos
- Carga inicial en oscuro por defecto.
- Cambio manual a claro y persistencia con localStorage.
- Reapertura de pagina manteniendo preferencia.
- Contraste y legibilidad en ambos temas.

## Cadencia recomendada
- En cada PR: smoke test (navegacion, CSP, tema, formulario).
- Semanal: Lighthouse completo + regresion de sanitizacion.
- Mensual: pruebas de resiliencia y compatibilidad cross-browser.

## Evidencia minima por release
- Reporte Lighthouse.
- Checklist de seguridad y CSP.
- Resultado de pruebas de blog/formulario.
- Incidencias abiertas y plan de remediacion.
