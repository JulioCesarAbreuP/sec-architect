(function () {
  var state = { items: [], filtered: [] };

  function $(id) {
    return document.getElementById(id);
  }

  function normalize(text) {
    return String(text || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  function uniqueValues(items, field) {
    var values = [];
    items.forEach(function (item) {
      (item[field] || []).forEach(function (value) {
        values.push(value);
      });
    });
    return Array.from(new Set(values)).sort(function (a, b) {
      return a.localeCompare(b, "es", { sensitivity: "base" });
    });
  }

  function setVisibility(id, visible) {
    $(id).classList.toggle("hidden", !visible);
  }

  function fillSelect(id, values) {
    var select = $(id);
    values.forEach(function (value) {
      var option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      select.appendChild(option);
    });
  }

  function populateFilters(items) {
    var categories = Array.from(new Set(items.map(function (item) { return item.categoria; })));
    fillSelect("category", categories);
    fillSelect("mitre", uniqueValues(items, "mitre_attack"));
    fillSelect("control", Array.from(new Set(uniqueValues(items, "mapeo_nist_csf").concat(uniqueValues(items, "mapeo_iso_27001")))));
  }

  function buildSearchIndex(item) {
    return normalize([
      item.id,
      item.cve_id,
      item.categoria,
      item.titulo,
      item.descripcion,
      item.escenario,
      item.riesgo,
      item.severidad,
      (item.mitre_attack || []).join(" "),
      (item.mapeo_nist_csf || []).join(" "),
      (item.mapeo_iso_27001 || []).join(" "),
      item.recomendacion_defensiva
    ].join(" "));
  }

  function applyFilters() {
    var q = normalize($("search").value.trim());
    var category = $("category").value;
    var risk = normalize($("risk").value);
    var severity = normalize($("severity").value);
    var mitre = $("mitre").value;
    var control = $("control").value;

    state.filtered = state.items.filter(function (item) {
      var matchesQuery = !q || buildSearchIndex(item).indexOf(q) !== -1;
      var matchesCategory = category === "all" || item.categoria === category;
      var itemRisk = normalize(item.riesgo || "");
      var matchesRisk = risk === "all" || itemRisk === risk;
      var itemSeverity = normalize(item.severidad || "");
      var matchesSeverity = severity === "all" || itemSeverity === severity;
      var matchesMitre = mitre === "all" || (item.mitre_attack || []).indexOf(mitre) !== -1;
      var controls = (item.mapeo_nist_csf || []).concat(item.mapeo_iso_27001 || []);
      var matchesControl = control === "all" || controls.indexOf(control) !== -1;
      return matchesQuery && matchesCategory && matchesRisk && matchesSeverity && matchesMitre && matchesControl;
    });

    render();
  }

  function pills(item) {
    var values = [item.categoria, item.fuente, "Riesgo: " + (item.riesgo || "n/a"), "Severidad: " + (item.severidad || "n/a")];
    return values.map(function (value) {
      return '<span class="pill">' + value + "</span>";
    }).join("");
  }

  function render() {
    var results = $("results");
    results.textContent = "";
    $("count").textContent = state.filtered.length + (state.filtered.length === 1 ? " regla" : " reglas");

    setVisibility("loading", false);
    setVisibility("error", false);
    setVisibility("empty", state.filtered.length === 0);
    setVisibility("results", state.filtered.length > 0);

    if (!state.filtered.length) {
      return;
    }

    var fragment = document.createDocumentFragment();

    state.filtered.forEach(function (item) {
      var card = document.createElement("article");
      card.className = "intel-card";

      var code = item.cve_id || item.id;
      var mitre = (item.mitre_attack || []).join(", ") || "n/a";
      var controls = (item.mapeo_nist_csf || []).concat(item.mapeo_iso_27001 || []).join(", ") || "n/a";

      card.innerHTML = '' +
        '<p class="intel-code">' + code + '</p>' +
        '<h3>' + item.titulo + '</h3>' +
        '<div class="intel-meta">' + pills(item) + '</div>' +
        '<p>' + item.descripcion + '</p>' +
        '<p><strong>Escenario:</strong> ' + item.escenario + '</p>' +
        '<p><strong>MITRE ATT&CK:</strong> ' + mitre + '</p>' +
        '<p><strong>NIST/ISO:</strong> ' + controls + '</p>' +
        '<p><strong>Recomendación defensiva:</strong> ' + item.recomendacion_defensiva + '</p>';

      fragment.appendChild(card);
    });

    results.appendChild(fragment);
  }

  function bind() {
    ["search", "category", "risk", "severity", "mitre", "control"].forEach(function (id) {
      $(id).addEventListener("input", applyFilters);
      $(id).addEventListener("change", applyFilters);
    });

    $("reset").addEventListener("click", function () {
      $("intelFilters").reset();
      applyFilters();
    });
  }

  function fail() {
    setVisibility("loading", false);
    setVisibility("error", true);
    setVisibility("results", false);
    setVisibility("empty", false);
  }

  fetch("data/knowledge-base.json", { cache: "no-store" })
    .then(function (response) {
      if (!response.ok) {
        throw new Error("No se pudo cargar el dataset");
      }
      return response.json();
    })
    .then(function (items) {
      state.items = items;
      state.filtered = items.slice();
      populateFilters(items);
      bind();
      render();
    })
    .catch(fail);
})();