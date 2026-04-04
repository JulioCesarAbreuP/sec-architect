export function initJSONPanel(container, handlers) {
  if (!container) {
    return;
  }

  container.innerHTML = [
    '<section class="panel">',
    '<h2>Panel JSON-to-MITRE</h2>',
    '<textarea id="json-input" placeholder="Pega Conditional Access Policy JSON..."></textarea>',
    '<div class="panel-row">',
    '<button id="json-validate" class="primary-btn">Validar JSON</button>',
    '<select id="remediation-format">',
    '<option value="bicep">Bicep</option>',
    '<option value="terraform">Terraform</option>',
    '</select>',
    '<button id="json-remediate" class="secondary-btn">Auto-Remediar</button>',
    '</div>',
    '</section>'
  ].join("");

  const input = container.querySelector("#json-input");
  const validateButton = container.querySelector("#json-validate");
  const remediateButton = container.querySelector("#json-remediate");
  const formatSelect = container.querySelector("#remediation-format");

  validateButton.addEventListener("click", () => {
    if (typeof handlers.onValidate === "function") {
      handlers.onValidate(String(input.value || ""));
    }
  });

  remediateButton.addEventListener("click", () => {
    if (typeof handlers.onRemediate === "function") {
      handlers.onRemediate(String(input.value || ""), formatSelect.value);
    }
  });
}
