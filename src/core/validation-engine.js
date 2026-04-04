// src/core/validation-engine.js
export const ValidationEngine = {
    validateSchema: (payload) => {
        if (!Array.isArray(payload)) return { valid: false, error: "Payload must be an array." };
        for (const r of payload) {
            if (!r.type || !r.id) return { valid: false, error: "Missing required fields: type or id." };
            if (!r.properties || typeof r.properties !== "object") return { valid: false, error: "Missing or invalid properties block." };
        }
        return { valid: true };
    },

    validateIdentityBlock: (block) => {
        if (!block || typeof block !== "object") return { valid: false, error: "Identity block missing or invalid." };
        if (!block.type || !block.id) return { valid: false, error: "Identity block missing type or id." };
        if (!block.properties || !block.properties.assigned) return { valid: false, error: "Identity block missing assigned property." };
        return { valid: true };
    },

    validateNetworkBlock: (block) => {
        if (!block || typeof block !== "object") return { valid: false, error: "Network block missing or invalid." };
        if (!block.type || !block.id) return { valid: false, error: "Network block missing type or id." };
        if (!block.properties || !block.properties.rules) return { valid: false, error: "Network block missing rules property." };
        if (!Array.isArray(block.properties.rules)) return { valid: false, error: "Network rules must be an array." };
        return { valid: true };
    }
};
