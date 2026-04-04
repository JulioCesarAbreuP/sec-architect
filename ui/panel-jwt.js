export function initJWTPanel(container, handlers) {
  if (!container) {
    return;
  }

  container.innerHTML = [
    '<section class="panel">',
    '<h2>Panel JWT (SC-300)</h2>',
    '<textarea id="jwt-input" placeholder="Pega JWT para validar claims scp, roles, exp, amr..."></textarea>',
    '<button id="jwt-validate" class="primary-btn">Validar JWT</button>',
    '</section>'
  ].join("");

  const input = container.querySelector("#jwt-input");
  const validateButton = container.querySelector("#jwt-validate");

  validateButton.addEventListener("click", () => {
    if (typeof handlers.onValidate === "function") {
      handlers.onValidate(String(input.value || ""));
    }
  });
}
