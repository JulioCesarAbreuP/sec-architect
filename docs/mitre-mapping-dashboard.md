# Mapeo MITRE ATT&CK en el Dashboard

## Integración de tácticas y técnicas
El motor del Command Center asocia hallazgos a tácticas (TA) y técnicas (Txxxx) usando una base de conocimiento local versionada.

## Visualización en alertas
Cada alerta incluye:
- Estado del control.
- Score de riesgo y confianza.
- Contexto MITRE (táctica y técnica).
- Recomendación prioritaria derivada.

## Relación con Knowledge-Base
La Knowledge-Base define técnicas, descripción, severidad, escenarios aplicables y recomendaciones. El dashboard consume esta estructura para enriquecer findings.

## Interpretación por analista
1. Identifica control afectado.
2. Observa técnica MITRE asociada.
3. Entiende impacto en atributo SABSA.
4. Prioriza mitigación según riesgo compuesto.
5. Escala evidencia a arquitectura o gobierno cuando corresponda.
