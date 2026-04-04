export const ThreatIntel = {
    fetchLiveThreats: async () => {
        try {
            const res = await fetch('https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json');
            if (!res.ok) throw new Error("CISA Feed Unreachable");
            const catalog = await res.json();
            return catalog.vulnerabilities.slice(0, 5); // Top 5 amenazas activas mundiales
        } catch (e) {
            console.error("[INTEL-ERROR]", e);
            return [{ vulnerabilityName: "Offline Mode: Using Cached Threat Intel", severity: "UNKNOWN" }];
        }
    }
};
