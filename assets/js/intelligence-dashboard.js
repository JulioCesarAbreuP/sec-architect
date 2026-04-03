(function () {
  var state = { items: [], filtered: [] };
  var FETCH_TIMEOUT_MS = 8000;

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

  function fetchWithTimeout(url, options, timeoutMs) {
    var controller = typeof AbortController === "function" ? new AbortController() : null;
    var timer = null;
    var config = options || {};

    if (controller) {
      config.signal = controller.signal;
      timer = window.setTimeout(function () {
        controller.abort();
      }, timeoutMs || FETCH_TIMEOUT_MS);
    }

    return fetch(url, config).finally(function () {
      if (timer) {
        window.clearTimeout(timer);
      }
    });
  }

  function asSafeText(value) {
    return String(value == null ? "" : value);
  }

  function asArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function normalizeItem(item) {
    if (!item || typeof item !== "object") {
      return null;
    }

    var code = asSafeText(item.cve_id || item.id).trim();
    var title = asSafeText(item.titulo).trim();
    if (!code || !title) {
      return null;
    }

    return {
      id: asSafeText(item.id).trim(),
      cve_id: asSafeText(item.cve_id).trim(),
      categoria: asSafeText(item.categoria).trim(),
      fuente: asSafeText(item.fuente).trim(),
      titulo: title,
      descripcion: asSafeText(item.descripcion).trim(),
      escenario: asSafeText(item.escenario).trim(),
      riesgo: asSafeText(item.riesgo).trim(),
      severidad: asSafeText(item.severidad).trim(),
      recomendacion_defensiva: asSafeText(item.recomendacion_defensiva).trim(),
      mitre_attack: asArray(item.mitre_attack).map(asSafeText),
      mapeo_nist_csf: asArray(item.mapeo_nist_csf).map(asSafeText),
      mapeo_iso_27001: asArray(item.mapeo_iso_27001).map(asSafeText)
    };
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
    var wrap = document.createElement("div");

    values.forEach(function (value) {
      var badge = document.createElement("span");
      badge.className = "pill";
      badge.textContent = value;
      wrap.appendChild(badge);
    });

    return wrap;
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

      var codeElement = document.createElement("p");
      codeElement.className = "intel-code";
      codeElement.textContent = code;

      var heading = document.createElement("h3");
      heading.textContent = item.titulo;

      var meta = document.createElement("div");
      meta.className = "intel-meta";
      meta.appendChild(pills(item));

      var description = document.createElement("p");
      description.textContent = item.descripcion;

      var scenario = document.createElement("p");
      scenario.textContent = "Escenario: " + (item.escenario || "n/a");

      var mitreText = document.createElement("p");
      mitreText.textContent = "MITRE ATT&CK: " + mitre;

      var controlsText = document.createElement("p");
      controlsText.textContent = "NIST/ISO: " + controls;

      var recommendation = document.createElement("p");
      recommendation.textContent = "Recomendación defensiva: " + (item.recomendacion_defensiva || "n/a");

      card.appendChild(codeElement);
      card.appendChild(heading);
      card.appendChild(meta);
      card.appendChild(description);
      card.appendChild(scenario);
      card.appendChild(mitreText);
      card.appendChild(controlsText);
      card.appendChild(recommendation);

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

  fetchWithTimeout("data/knowledge-base.json", { cache: "no-store" }, FETCH_TIMEOUT_MS)
    .then(function (response) {
      if (!response.ok) {
        throw new Error("No se pudo cargar el dataset");
      }
      return response.json();
    })
    .then(function (items) {
      if (!Array.isArray(items)) {
        throw new Error("Dataset inválido");
      }

      var safeItems = items.map(normalizeItem).filter(Boolean);
      if (!safeItems.length) {
        throw new Error("Dataset vacío o inválido");
      }

      state.items = safeItems;
      state.filtered = safeItems.slice();
      populateFilters(safeItems);
      bind();
      render();
    })
    .catch(fail);
})();