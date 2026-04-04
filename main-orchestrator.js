import { AzureParser } from './azure-parser.js';
import { ThreatIntel } from './threat-intel.js';
import { IaCEngine } from './iac-engine.js';

export async function executeSecurityWorkflow(rawJson) {
    console.log(">> [SYSTEM] Iniciando Ciclo de Defensa Activa...");
    const analysis = AzureParser.analyzeJSON(rawJson);
    if (analysis.status === "ERROR") {
        updateUIConsole("Error de parseo: El payload no es un JSON de Azure válido.", "error");
        return;
    }
    const activeThreats = await ThreatIntel.fetchLiveThreats();
    const topThreat = activeThreats[0] || { vulnerabilityName: "No nuevas amenazas críticas hoy" };
    const riskScore = calculateSABSAScore(analysis.count);
    updateRadarChart(riskScore);
    let terraformOutput = "";
    if (analysis.count > 0) {
        terraformOutput = IaCEngine.generateTerraform("MFA_MISSING");
        updateUIConsole(`[ALERT] Detectadas ${analysis.count} brechas de MFA. Técnica MITRE T1556 vinculada a ${topThreat.vulnerabilityName}`, "warning");
    } else {
        updateUIConsole("[PASS] Configuración alineada con Best Practices de Microsoft.", "success");
    }
    renderRemediationPanel(terraformOutput);
}

function calculateSABSAScore(riskCount) {
    return Math.max(0, 100 - (riskCount * 25));
}
