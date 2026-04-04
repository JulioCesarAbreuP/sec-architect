export function createJsonPanelBindings() {
  return {
    input: document.getElementById("graphJsonInput"),
    format: document.getElementById("remediationFormat"),
    runButton: document.getElementById("runInferenceBtn")
  };
}
