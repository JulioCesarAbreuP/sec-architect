import { AzureParser } from './core/azure-parser.js';
import { ThreatIntel } from './core/threat-intel.js';
import { IaCEngine } from './iac-engine.js';

export async function securityAuditFlow(payload) {
    console.log(">> [SYSTEM] Iniciando Ciclo de Defensa Activa...");
    
    const analysis = AzureParser.analyzeJSON(payload);
    if (analysis.status === "ERROR") return analysis;

    const liveThreats = await ThreatIntel.fetchLiveThreats();
    
    let remediation = "";
    if (analysis.count > 0) {
        remediation = IaCEngine.generateTerraform("MFA_MISSING");
    }

    return {
        score: Math.max(0, 100 - (analysis.count * 20)),
        threats: liveThreats,
        remediation: remediation,
        metadata: analysis
    };
}
