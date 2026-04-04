// src/core/threat-engine.js
export const ThreatEngine = {
    calculateExploitability: (azureResource, globalThreats) => {
        // Busca si el recurso tiene un CVE conocido en el feed de CISA
        const matchingThreat = globalThreats.find(t => azureResource.name.includes(t.vulnerabilityName));
        return {
            score: matchingThreat ? 95 : 40, // De 0 a 100
            priority: matchingThreat ? "IMMEDIATE_ACTION" : "PLAN_REMEDIATION",
            vector: matchingThreat ? matchingThreat.shortDescription : "General Configuration Drift"
        };
    }
};
