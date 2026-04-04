export function initIAPanel(container, handlers) {
  if (!container) {
    return;
  }

  container.innerHTML = [
    '<section class="panel">',
    '<h2>Panel IA</h2>',
    '<div class="panel-tabs">',
    '<button class="panel-tab is-active" data-tab="control">Control Mapper</button>',
    '<button class="panel-tab" data-tab="risk">Risk Analyzer</button>',
    '<button class="panel-tab" data-tab="architecture">Architecture Explainer</button>',
    '</div>',
    '<textarea id="ia-input" placeholder="Pega un objeto Azure AD (JSON) o un control tecnico..."></textarea>',
    '<button id="ia-run" class="primary-btn">Ejecutar IA</button>',
    '</section>'
  ].join("");

  let activeTab = "control";
  const tabs = container.querySelectorAll(".panel-tab");
  const runButton = container.querySelector("#ia-run");
  const input = container.querySelector("#ia-input");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      activeTab = tab.getAttribute("data-tab") || "control";
      tabs.forEach((item) => item.classList.remove("is-active"));
      tab.classList.add("is-active");
    });
  });

  runButton.addEventListener("click", async () => {
    const value = String(input.value || "").trim();
    if (!value) {
      return;
    }

    if (activeTab === "control" && typeof handlers.onControl === "function") {
      await handlers.onControl(value);
      return;
    }

    if (activeTab === "risk" && typeof handlers.onRisk === "function") {
      await handlers.onRisk(value);
      return;
    }

    if (activeTab === "architecture" && typeof handlers.onArchitecture === "function") {
      await handlers.onArchitecture(value);
    }
  });
}
