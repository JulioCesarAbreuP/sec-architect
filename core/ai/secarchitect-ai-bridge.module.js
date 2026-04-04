import { invokeCopilot } from "./copilot-adapter.module.js";
import { analyzeRisk, buildRiskAnalyzerPrompt, buildSecArchitectAnalysisPrompt, getModes, setMode, getMode } from "./risk-analyzer.module.js";
import { mapControl, buildControlMapperPrompt } from "./control-mapper.module.js";
import { explainArchitecture, buildArchitectureExplainerPrompt } from "./architecture-explainer.module.js";

var DEPRECATION_STORAGE_KEY = "sec_architect_ai_global_usage_v1";
var deprecationWarned = {};

function safeStorage() {
	try {
		return window.sessionStorage;
	} catch (_error) {
		return null;
	}
}

function getUsageMap() {
	var storage = safeStorage();

	if (!storage) {
		return {};
	}

	try {
		var raw = storage.getItem(DEPRECATION_STORAGE_KEY);
		return raw ? JSON.parse(raw) : {};
	} catch (_error) {
		return {};
	}
}

function saveUsageMap(map) {
	var storage = safeStorage();
	if (!storage) {
		return;
	}

	try {
		storage.setItem(DEPRECATION_STORAGE_KEY, JSON.stringify(map));
	} catch (_error) {
		// Ignore persistence issues in bridge telemetry.
	}
}

function registerDeprecatedUsage(apiName) {
	var path = window.location && window.location.pathname ? window.location.pathname : "unknown";
	var key = apiName + "@" + path;
	var usage = getUsageMap();

	usage[key] = usage[key] || {
		api: apiName,
		path: path,
		count: 0,
		firstSeenAt: new Date().toISOString(),
		lastSeenAt: new Date().toISOString()
	};

	usage[key].count += 1;
	usage[key].lastSeenAt = new Date().toISOString();
	saveUsageMap(usage);

	window.__SECARCHITECT_AI_DEPRECATION__ = usage;

	if (!deprecationWarned[key]) {
		deprecationWarned[key] = true;
		console.warn("[SEC_ARCHITECT][DEPRECATION] window.SECArchitectAI." + apiName + " esta deprecado. Usa imports ESM en su lugar.", {
			path: path,
			api: apiName
		});
	}
}

function wrapDeprecated(apiName, fn) {
	return function () {
		registerDeprecatedUsage(apiName);
		return fn.apply(null, arguments);
	};
}

function getDeprecationUsageSnapshot() {
	var usage = getUsageMap();
	var keys = Object.keys(usage);
	var totalCalls = keys.reduce(function (sum, key) {
		return sum + (usage[key].count || 0);
	}, 0);

	return {
		generatedAt: new Date().toISOString(),
		schemaVersion: "1.0.0",
		totalEntries: keys.length,
		totalCalls: totalCalls,
		usage: usage
	};
}

function exportDeprecationUsageJson() {
	var snapshot = getDeprecationUsageSnapshot();
	var blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
	var url = URL.createObjectURL(blob);
	var link = document.createElement("a");

	link.href = url;
	link.download = "sec-architect-deprecation-usage-" + Date.now() + ".json";
	document.body.appendChild(link);
	link.click();
	link.remove();
	URL.revokeObjectURL(url);

	return snapshot;
}

function clearDeprecationUsage() {
	var storage = safeStorage();
	if (storage) {
		try {
			storage.removeItem(DEPRECATION_STORAGE_KEY);
		} catch (_error) {
			// Ignore storage cleanup errors.
		}
	}

	window.__SECARCHITECT_AI_DEPRECATION__ = {};
	deprecationWarned = {};
	return true;
}

window.SECArchitectAI = window.SECArchitectAI || {};
window.SECArchitectAI.invokeCopilot = wrapDeprecated("invokeCopilot", invokeCopilot);
window.SECArchitectAI.analyzeRisk = wrapDeprecated("analyzeRisk", analyzeRisk);
window.SECArchitectAI.mapControl = wrapDeprecated("mapControl", mapControl);
window.SECArchitectAI.explainArchitecture = wrapDeprecated("explainArchitecture", explainArchitecture);
window.SECArchitectAI.buildRiskAnalyzerPrompt = wrapDeprecated("buildRiskAnalyzerPrompt", buildRiskAnalyzerPrompt);
window.SECArchitectAI.buildSecArchitectAnalysisPrompt = wrapDeprecated("buildSecArchitectAnalysisPrompt", buildSecArchitectAnalysisPrompt);
window.SECArchitectAI.buildControlMapperPrompt = wrapDeprecated("buildControlMapperPrompt", buildControlMapperPrompt);
window.SECArchitectAI.buildArchitectureExplainerPrompt = wrapDeprecated("buildArchitectureExplainerPrompt", buildArchitectureExplainerPrompt);
window.SECArchitectAI.getModes = wrapDeprecated("getModes", getModes);
window.SECArchitectAI.setMode = wrapDeprecated("setMode", setMode);
window.SECArchitectAI.getMode = wrapDeprecated("getMode", getMode);
window.SECArchitectAI.getDeprecationUsageSnapshot = getDeprecationUsageSnapshot;
window.SECArchitectAI.exportDeprecationUsageJson = exportDeprecationUsageJson;
window.SECArchitectAI.clearDeprecationUsage = clearDeprecationUsage;
