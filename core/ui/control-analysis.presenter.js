(function (w) {
  "use strict";

  function byId(id) {
    return document.getElementById(id);
  }

  function setText(id, value) {
    var node = byId(id);
    if (node) {
      node.textContent = value;
    }
  }

  function clearList(id) {
    var list = byId(id);
    if (list) {
      list.textContent = "";
    }
  }

  function renderList(id, values) {
    var list = byId(id);
    if (!list) {
      return;
    }

    list.textContent = "";
    values.forEach(function (value) {
      var item = document.createElement("li");
      item.textContent = value;
      list.appendChild(item);
    });
  }

  function renderRecommendations(rows) {
    var body = byId("recommendationBody");
    if (!body) {
      return;
    }

    body.textContent = "";

    rows.forEach(function (row) {
      var tr = document.createElement("tr");
      [row.priority, row.action, row.responsible, row.evidence].forEach(function (cellValue) {
        var td = document.createElement("td");
        td.textContent = cellValue;
        tr.appendChild(td);
      });
      body.appendChild(tr);
    });
  }

  function renderResult(result) {
    setText("analysisStatus", "Analisis generado");
    setText("domainValue", result.classification.domain.label + " (confianza " + result.classification.domain.confidence + ")");
    setText("typeValue", result.classification.controlType.label);
    setText("riskValue", result.analysis.residualRisk.level.toUpperCase() + " (" + result.analysis.residualRisk.score + "/100)");
    setText("summaryValue", result.analysis.technicalSummary);
    setText("executiveValue", result.analysis.executiveSummary);

    renderList("nistList", result.analysis.nistCsf);
    renderList("cisList", result.analysis.cisControlsV8);
    renderList("mitreList", result.analysis.mitreAttack);
    renderList("zeroTrustList", result.analysis.zeroTrust);
    renderRecommendations(result.analysis.recommendations);

    setText("rawJson", JSON.stringify(result, null, 2));
  }

  function clearView() {
    setText("analysisStatus", "Pendiente de analisis");
    setText("domainValue", "- ");
    setText("typeValue", "- ");
    setText("riskValue", "- ");
    setText("summaryValue", "- ");
    setText("executiveValue", "- ");
    ["nistList", "cisList", "mitreList", "zeroTrustList"].forEach(clearList);

    var tableBody = byId("recommendationBody");
    if (tableBody) {
      tableBody.textContent = "";
    }

    setText("rawJson", "{}");
  }

  function bindUi() {
    var input = byId("controlInput");
    var analyzeBtn = byId("analyzeControlBtn");
    var clearBtn = byId("clearControlBtn");

    if (!input || !analyzeBtn || !clearBtn) {
      return;
    }

    clearView();

    analyzeBtn.addEventListener("click", function () {
      var api = w.SECArchitectAI;
      var text = String(input.value || "").trim();

      if (!api || typeof api.analyzeControl !== "function") {
        setText("analysisStatus", "Motor no disponible");
        return;
      }

      var result = api.analyzeControl(text);

      if (!result.ok) {
        setText("analysisStatus", "Entrada invalida");
        setText("summaryValue", result.message || "No fue posible procesar el control.");
        return;
      }

      renderResult(result);
    });

    clearBtn.addEventListener("click", function () {
      input.value = "";
      clearView();
      input.focus();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindUi);
  } else {
    bindUi();
  }
})(window);
