import { initEnterpriseUIController } from "./ui/enterprise/ui-controller.js";

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    initEnterpriseUIController().catch(() => {});
  });
} else {
  initEnterpriseUIController().catch(() => {});
}
