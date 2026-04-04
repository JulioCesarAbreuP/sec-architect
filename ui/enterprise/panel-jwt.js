export function createJwtPanelBindings() {
  return {
    input: document.getElementById("jwtInput"),
    validateButton: document.getElementById("validateJwtBtn"),
    output: document.getElementById("jwtOutput")
  };
}
