export const AzureParser = {
    /**
     * Analyzes Azure Conditional Access policies and detects enabled policies missing MFA.
     * Accepts a JSON string or array of objects. Handles missing grantControls, adds timestamp, and provides detailed errors.
     * @param {string|object[]} jsonInput - The policies as a JSON string or array.
     * @returns {object} - { status, risks, count, timestamp, message? }
     */
    analyzeJSON: (jsonInput) => {
        const timestamp = new Date().toISOString();
        let data;
        if (typeof jsonInput === 'string') {
            try {
                data = JSON.parse(jsonInput);
            } catch (e) {
                return { status: "ERROR", message: `Invalid JSON input: ${e.message}`, timestamp };
            }
        } else if (Array.isArray(jsonInput)) {
            data = jsonInput;
        } else {
            return { status: "ERROR", message: "Input must be a JSON string or array", timestamp };
        }
        if (!Array.isArray(data)) {
            return { status: "ERROR", message: "Parsed data is not an array", timestamp };
        }
        const riskyPolicies = data.filter(p => {
            if (!p || typeof p !== 'object') return false;
            if (p.state !== "enabled") return false;
            if (!p.grantControls || typeof p.grantControls !== 'object') return true;
            const builtIn = p.grantControls.builtInControls;
            if (!Array.isArray(builtIn)) return true;
            return !builtIn.includes("mfa");
        });
        return {
            status: "PROCESSED",
            risks: riskyPolicies,
            count: riskyPolicies.length,
            timestamp
        };
    }
};
