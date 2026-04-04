export function getPanelRefs() {
  return {
    root: document.getElementById("enterpriseRoot"),
    status: document.getElementById("command-status"),
    escalationBanner: document.getElementById("threatEscalationBanner"),
    jsonInput: document.getElementById("graphJsonInput"),
    parserInfo: document.getElementById("parserObjectType"),
    runBtn: document.getElementById("runInferenceBtn"),
    formatSelect: document.getElementById("remediationFormat"),
    aiOutput: document.getElementById("aiAnalysisOutput"),
    memoryNote: document.getElementById("operationalMemoryNarrative"),
    remediationOutput: document.getElementById("terraformFixOutput"),
    copyFixBtn: document.getElementById("copyFixBtn"),
    shadowConsole: document.getElementById("shadowConsole"),
    jwtInput: document.getElementById("jwtInput"),
    jwtBtn: document.getElementById("validateJwtBtn"),
    jwtOutput: document.getElementById("jwtOutput"),
    attackSelect: document.getElementById("attackTechniqueSelect"),
    attackBtn: document.getElementById("runSimulationBtn"),
    attackOutput: document.getElementById("attackSimulationOutput"),
    architectureQuestion: document.getElementById("architectureQuestion"),
    architectureAskBtn: document.getElementById("askArchitectureBtn"),
    architectureRefreshBtn: document.getElementById("refreshArchitectureBtn"),
    architectureTitle: document.getElementById("architectureAnswerTitle"),
    architectureContent: document.getElementById("architectureBoardContent"),
    socNightModeBtn: document.getElementById("socNightMode"),
    radarCanvas: document.getElementById("riskRadar")
  };
}
