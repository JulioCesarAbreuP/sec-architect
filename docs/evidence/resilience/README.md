# Ejemplos de estados de resiliencia

## NORMAL
- Sin señales de degradación.
- Estado: NORMAL
- Señales: []

## DEGRADED
- Más de 3 fallos consecutivos en healthcheck
- Latencia media >1500ms
- Más de 10 eventos WAF en 1 min
- Estado: DEGRADED

## CRITICAL
- Más de 5 fallos consecutivos en healthcheck
- Más de 20 eventos WAF en 1 min
- 3 alertas critical en 2 min
- Error cliente + 5xx + WAF: correlación crítica
- Estado: CRITICAL

## Capturas
(Agrega aquí capturas del panel de resiliencia en cada estado)

## JSON de señales
- Ver archivos normal.json, degraded.json, critical.json
