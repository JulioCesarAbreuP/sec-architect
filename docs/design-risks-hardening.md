# Riesgos de Diseño y Endurecimiento (Conceptual)

## Riesgos de centralización del Command Center
- Punto único de fallo funcional y narrativo.
- Sobrecarga del módulo central con múltiples responsabilidades.
- Dependencia excesiva de un único flujo de interpretación.

## Riesgos de exposición conceptual
- Confusión entre demo técnica y operación productiva enterprise.
- Sobreinterpretación de scoring heurístico como evidencia final.

## Riesgos de diseño pedagógico
- Simplificación de escenarios complejos.
- Riesgo de sesgo didáctico al priorizar claridad sobre fidelidad operativa completa.

## Recomendaciones de endurecimiento
- Separar explícitamente modo demo y modo enterprise.
- Firmar y versionar catálogos de reglas y mapeos.
- Introducir auditoría de cambios con revisión obligatoria.
- Definir umbrales de calidad para publicar reglas nuevas.
- Incorporar CI de seguridad y validación de metadatos como gate.
