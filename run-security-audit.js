import { AzureParser } from './azure-parser.js';
import { ThreatIntel } from './threat-intel.js';
import { IaCEngine } from './iac-engine.js';

async function runSecurityAudit() {
    const rawInput = document.getElementById('code-textarea').value;
    const analysis = AzureParser.analyzeJSON(rawInput);

    if (analysis.status === "PROCESSED") {
        // 1. Movemos el Radar según el riesgo real detectado
        updateRadarChart(analysis.count * 20); 
        
        // 2. Consultamos amenazas reales para contextualizar
        const liveThreats = await ThreatIntel.fetchLiveThreats();
        terminalLog.innerHTML += `<br>> [LIVE-INTEL] Alerta CISA: ${liveThreats[0].vulnerabilityName}`;

        // 3. Generamos la solución técnica inmediata
        const terraformCode = IaCEngine.generateTerraform("MFA_MISSING");
        document.getElementById('iac-panel').innerText = terraformCode;
        
        terminalLog.innerHTML += `<br>> [SUCCESS] Análisis completado. Remediación IaC generada.`;
    }
}
