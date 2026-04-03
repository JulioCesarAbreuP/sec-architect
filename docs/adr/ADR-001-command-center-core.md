# ADR-001: Command Center como núcleo del framework

## Contexto
SEC_ARCHITECT integra evaluación doctrinal, priorización de riesgo, visualización de hallazgos y narrativa de remediación en un entorno modular.

## Problema
Sin un punto central de correlación, los módulos se perciben como piezas aisladas con baja trazabilidad y menor capacidad de decisión operativa.

## Opciones consideradas
1. Centro único de orquestación (Command Center).
2. Paneles independientes por dominio, sin núcleo central.
3. Navegación lineal documental sin módulo operativo.

## Decisión
Adoptar el Command Center como núcleo funcional y narrativo del framework.

## Justificación
Permite consolidar en un único flujo: entrada de contexto, evaluación SABSA IG, mapeo MITRE ATT&CK, matriz de amenazas y recomendación prioritaria.

## Consecuencias
### Positivas
- Coherencia de arquitectura y operación.
- Mejor lectura ejecutiva y técnica del riesgo.
- Mayor valor demostrativo para arquitectura de seguridad.

### Negativas
- Riesgo de centralización excesiva.
- Mayor criticidad del módulo para la experiencia global.
- Exige mayor disciplina de calidad y pruebas sobre el núcleo.
