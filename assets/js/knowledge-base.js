(function () {
  var DATASET_URL = "../data/knowledge-base.json";
  var CATEGORY_LABELS = {
    NSA: "NSA",
    CISA: "CISA",
    MITRE: "MITRE",
    NIST_ISO: "NIST/ISO",
    CVE: "CVE"
  };
  var RISK_LABELS = {
    critico: "Crítico",
    critica: "Crítica",
    alto: "Alto",
    alta: "Alta",
    medio: "Medio",
    media: "Media",
    baja: "Baja"
  };
  var SORT_LABELS = {
    relevance: "Relevancia",
    "risk-desc": "Riesgo: mayor a menor",
    "source-asc": "Fuente",
    "category-asc": "Categoría",
    "code-asc": "Código"
  };
  var RISK_ORDER = {
    critico: 3,
    critica: 3,
    alto: 2,
    alta: 2,
    medio: 1
  };

  var state = {
    items: [],
    filtered: [],
    currentPage: 1,
    pageSize: 12
  };

  function $(id) {
    return document.getElementById(id);
  }

  function normalize(text) {
    return String(text || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  function categoryLabel(value) {
    return CATEGORY_LABELS[value] || value;
  }

  function riskLabel(value) {
    return RISK_LABELS[value] || value;
  }

  function sortLabel(value) {
    return SORT_LABELS[value] || value;
  }

  function currentFilters() {
    return {
      search: $("searchInput").value.trim(),
      category: $("categoryFilter").value,
      source: $("sourceFilter").value,
      risk: $("riskFilter").value,
      cveSeverity: $("cveSeverityFilter").value,
      mitre: selectedValues("mitreFilter"),
      nist: selectedValues("nistFilter"),
      iso: selectedValues("isoFilter"),
      sort: $("sortFilter").value,
      pageSize: Number($("pageSizeFilter").value) || 12
    };
  }

  function selectedValues(selectId) {
    return Array.from($(selectId).selectedOptions).map(function (option) {
      return option.value;
    }).filter(Boolean);
  }

  function setMultiSelectValues(selectId, values) {
    var selectedMap = {};
    values.forEach(function (value) {
      selectedMap[value] = true;
    });

    Array.from($(selectId).options).forEach(function (option) {
      option.selected = !!selectedMap[option.value];
    });
  }

  function clearMultiSelect(selectId) {
    Array.from($(selectId).options).forEach(function (option) {
      option.selected = false;
    });
  }

  function currentPageItems() {
    var start = (state.currentPage - 1) * state.pageSize;
    return state.filtered.slice(start, start + state.pageSize);
  }

  function totalPages() {
    return Math.max(1, Math.ceil(state.filtered.length / state.pageSize));
  }

  function riskRank(item) {
    return RISK_ORDER[normalize(item.riesgo || item.severidad || "medio")] || 0;
  }

  function itemCode(item) {
    return item.cve_id || item.id || "";
  }

  function compareText(left, right) {
    return left.localeCompare(right, "es", { sensitivity: "base" });
  }

  function sortItems(items, sortValue) {
    var sorted = items.slice();

    sorted.sort(function (left, right) {
      if (sortValue === "risk-desc") {
        return riskRank(right) - riskRank(left) || compareText(itemCode(left), itemCode(right));
      }
      if (sortValue === "source-asc") {
        return compareText(left.fuente || "", right.fuente || "") || compareText(itemCode(left), itemCode(right));
      }
      if (sortValue === "category-asc") {
        return compareText(categoryLabel(left.categoria), categoryLabel(right.categoria)) || compareText(itemCode(left), itemCode(right));
      }
      if (sortValue === "code-asc") {
        return compareText(itemCode(left), itemCode(right));
      }

      return (left._order || 0) - (right._order || 0);
    });

    return sorted;
  }

  function syncUrl(filters) {
    var url = new URL(window.location.href);

    url.searchParams.delete("q");
    url.searchParams.delete("category");
    url.searchParams.delete("source");
    url.searchParams.delete("risk");
    url.searchParams.delete("cve_severity");
    url.searchParams.delete("mitre");
    url.searchParams.delete("nist");
    url.searchParams.delete("iso");
    url.searchParams.delete("sort");
    url.searchParams.delete("page");
    url.searchParams.delete("size");

    if (filters.search) {
      url.searchParams.set("q", filters.search);
    }
    if (filters.category && filters.category !== "all") {
      url.searchParams.set("category", filters.category);
    }
    if (filters.source && filters.source !== "all") {
      url.searchParams.set("source", filters.source);
    }
    if (filters.risk && filters.risk !== "all") {
      url.searchParams.set("risk", filters.risk);
    }
    if (filters.cveSeverity && filters.cveSeverity !== "all") {
      url.searchParams.set("cve_severity", filters.cveSeverity);
    }
    filters.mitre.forEach(function (value) {
      url.searchParams.append("mitre", value);
    });
    filters.nist.forEach(function (value) {
      url.searchParams.append("nist", value);
    });
    filters.iso.forEach(function (value) {
      url.searchParams.append("iso", value);
    });
    if (filters.sort && filters.sort !== "relevance") {
      url.searchParams.set("sort", filters.sort);
    }
    if (state.currentPage > 1) {
      url.searchParams.set("page", String(state.currentPage));
    }
    if (filters.pageSize && filters.pageSize !== 12) {
      url.searchParams.set("size", String(filters.pageSize));
    }

    window.history.replaceState({}, "", url.toString());
  }

  function applyUrlState() {
    var params = new URLSearchParams(window.location.search);
    var search = params.get("q") || "";
    var category = params.get("category") || "all";
    var source = params.get("source") || "all";
    var risk = params.get("risk") || "all";
    var cveSeverity = params.get("cve_severity") || "all";
    var mitre = params.getAll("mitre");
    var nist = params.getAll("nist");
    var iso = params.getAll("iso");
    var sort = params.get("sort") || "relevance";
    var page = Number(params.get("page") || "1");
    var size = Number(params.get("size") || "12");

    $("searchInput").value = search;
    $("sourceFilter").value = source;
    $("riskFilter").value = risk;
    $("cveSeverityFilter").value = cveSeverity;
    $("sortFilter").value = sort;
    $("pageSizeFilter").value = ["6", "12", "24"].indexOf(String(size)) !== -1 ? String(size) : "12";
    state.currentPage = page > 0 ? page : 1;
    state.pageSize = [6, 12, 24].indexOf(size) !== -1 ? size : 12;

    return {
      category: category,
      source: source,
      cveSeverity: cveSeverity,
      mitre: mitre,
      nist: nist,
      iso: iso
    };
  }

  function shareCurrentView() {
    var button = $("copyLink");
    var link = window.location.href;
    var originalText = button.textContent;

    function setButtonLabel(text) {
      button.textContent = text;
      window.setTimeout(function () {
        button.textContent = originalText;
      }, 1600);
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(link)
        .then(function () {
          setButtonLabel("Enlace copiado");
        })
        .catch(function () {
          setButtonLabel("Copia manualmente la URL");
        });
      return;
    }

    setButtonLabel("Copia manualmente la URL");
  }

  function createTag(label) {
    var tag = document.createElement("span");
    tag.className = "result-tag";
    tag.textContent = label;
    return tag;
  }

  function createMappingChips(values) {
    var wrapper = document.createElement("div");
    wrapper.className = "mapping-list";

    (values || []).forEach(function (value) {
      var chip = document.createElement("span");
      chip.className = "mapping-chip";
      chip.textContent = value;
      wrapper.appendChild(chip);
    });

    return wrapper;
  }

  function setVisibility(element, visible) {
    element.classList.toggle("is-hidden", !visible);
  }

  function populateCategoryFilter(items) {
    var select = $("categoryFilter");
    var categories = Array.from(new Set(items.map(function (item) {
      return item.categoria;
    }))).sort();

    categories.forEach(function (category) {
      var option = document.createElement("option");
      option.value = category;
      option.textContent = categoryLabel(category);
      select.appendChild(option);
    });
  }

  function populateValueFilter(selectId, values) {
    var select = $(selectId);

    values.forEach(function (value) {
      var option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      select.appendChild(option);
    });
  }

  function uniqueValues(items, field) {
    var allValues = [];

    items.forEach(function (item) {
      (item[field] || []).forEach(function (value) {
        allValues.push(value);
      });
    });

    return Array.from(new Set(allValues)).sort(compareText);
  }

  function renderSummary(items) {
    var total = items.length;
    var families = new Set(items.map(function (item) { return item.categoria; })).size;
    var priority = items.filter(function (item) {
      return item.riesgo === "critico" || item.riesgo === "alto" || item.severidad === "critica" || item.severidad === "alta";
    }).length;

    $("summaryTotal").textContent = String(total);
    $("summaryFamilies").textContent = String(families);
    $("summaryPriority").textContent = String(priority);
  }

  function buildSearchIndex(item) {
    return normalize([
      item.id,
      item.cve_id,
      item.categoria,
      item.fuente,
      item.titulo,
      item.descripcion,
      item.escenario,
      item.categoria_vulnerabilidad,
      item.recomendacion_defensiva,
      (item.controles_defensivos || []).join(" "),
      (item.mitre_attack || []).join(" "),
      (item.mapeo_nist_csf || []).join(" "),
      (item.mapeo_iso_27001 || []).join(" ")
    ].join(" "));
  }

  function filterItems() {
    var filters = currentFilters();
    var searchValue = normalize(filters.search);
    var categoryValue = filters.category;
    var sourceValue = filters.source;
    var riskValue = filters.risk;
    var cveSeverityValue = filters.cveSeverity;
    var mitreValue = filters.mitre;
    var nistValue = filters.nist;
    var isoValue = filters.iso;

    state.pageSize = filters.pageSize;

    state.filtered = state.items.filter(function (item) {
      var matchesSearch = !searchValue || buildSearchIndex(item).indexOf(searchValue) !== -1;
      var matchesCategory = categoryValue === "all" || item.categoria === categoryValue;
      var matchesSource = sourceValue === "all" || item.fuente === sourceValue;
      var normalizedRisk = normalize(item.riesgo || item.severidad || "");
      var matchesRisk = riskValue === "all" || normalizedRisk === riskValue;
      var isCve = normalize(item.categoria) === "cve";
      var normalizedSeverity = normalize(item.severidad || "");
      var matchesCveSeverity = cveSeverityValue === "all" || (isCve && normalizedSeverity === cveSeverityValue);
      var matchesMitre = mitreValue.length === 0 || mitreValue.some(function (value) { return (item.mitre_attack || []).indexOf(value) !== -1; });
      var matchesNist = nistValue.length === 0 || nistValue.some(function (value) { return (item.mapeo_nist_csf || []).indexOf(value) !== -1; });
      var matchesIso = isoValue.length === 0 || isoValue.some(function (value) { return (item.mapeo_iso_27001 || []).indexOf(value) !== -1; });
      return matchesSearch && matchesCategory && matchesSource && matchesRisk && matchesCveSeverity && matchesMitre && matchesNist && matchesIso;
    });

    state.filtered = sortItems(state.filtered, filters.sort);
    state.currentPage = Math.min(state.currentPage, totalPages());
    state.currentPage = Math.max(state.currentPage, 1);
    syncUrl(filters);

    renderResults();
  }

  function renderActiveTags() {
    var container = $("resultsTags");
    var searchValue = $("searchInput").value.trim();
    var categoryValue = $("categoryFilter").value;
    var sourceValue = $("sourceFilter").value;
    var riskValue = $("riskFilter").value;
    var cveSeverityValue = $("cveSeverityFilter").value;
    var mitreValue = selectedValues("mitreFilter");
    var nistValue = selectedValues("nistFilter");
    var isoValue = selectedValues("isoFilter");
    var sortValue = $("sortFilter").value;

    container.textContent = "";

    if (searchValue) {
      container.appendChild(createTag('Búsqueda: "' + searchValue + '"'));
    }
    if (categoryValue !== "all") {
      container.appendChild(createTag("Categoría: " + categoryLabel(categoryValue)));
    }
    if (sourceValue !== "all") {
      container.appendChild(createTag("Fuente: " + sourceValue));
    }
    if (riskValue !== "all") {
      container.appendChild(createTag("Riesgo: " + riskLabel(riskValue)));
    }
    if (cveSeverityValue !== "all") {
      container.appendChild(createTag("Severidad CVE: " + riskLabel(cveSeverityValue) ));
    }
    if (mitreValue.length > 0) {
      container.appendChild(createTag("MITRE: " + mitreValue.length + " seleccionadas"));
    }
    if (nistValue.length > 0) {
      container.appendChild(createTag("NIST: " + nistValue.length + " seleccionados"));
    }
    if (isoValue.length > 0) {
      container.appendChild(createTag("ISO: " + isoValue.length + " seleccionados"));
    }
    if (sortValue !== "relevance") {
      container.appendChild(createTag("Orden: " + sortLabel(sortValue)));
    }
    if (!searchValue && categoryValue === "all" && sourceValue === "all" && riskValue === "all" && cveSeverityValue === "all" && mitreValue.length === 0 && nistValue.length === 0 && isoValue.length === 0 && sortValue === "relevance") {
      container.appendChild(createTag("Sin filtros activos"));
    }
  }

  function renderPagination() {
    var bar = $("paginationBar");
    var pagesContainer = $("paginationPages");
    var prev = $("prevPage");
    var next = $("nextPage");
    var pageCount = totalPages();
    var start = state.filtered.length ? ((state.currentPage - 1) * state.pageSize) + 1 : 0;
    var end = Math.min(state.currentPage * state.pageSize, state.filtered.length);

    $("resultsPageInfo").textContent = state.filtered.length ? ("Mostrando " + start + "-" + end + " de " + state.filtered.length + " | Página " + state.currentPage + " de " + pageCount) : "Página 1 de 1";

    setVisibility(bar, state.filtered.length > 0);
    pagesContainer.textContent = "";
    prev.disabled = state.currentPage <= 1;
    next.disabled = state.currentPage >= pageCount;

    if (pageCount <= 1) {
      return;
    }

    var startPage = Math.max(1, state.currentPage - 2);
    var endPage = Math.min(pageCount, startPage + 4);
    startPage = Math.max(1, endPage - 4);

    for (var page = startPage; page <= endPage; page += 1) {
      var chip = document.createElement("button");
      chip.type = "button";
      chip.className = "page-chip" + (page === state.currentPage ? " is-active" : "");
      chip.textContent = String(page);
      chip.setAttribute("aria-label", "Ir a la página " + page);
      chip.addEventListener("click", goToPage(page));
      pagesContainer.appendChild(chip);
    }
  }

  function goToPage(page) {
    return function () {
      state.currentPage = page;
      filterItems();
    };
  }

  function renderResults() {
    var grid = $("resultsGrid");
    var loadingState = $("loadingState");
    var errorState = $("errorState");
    var emptyState = $("emptyState");
    var visibleItems = currentPageItems();

    grid.textContent = "";
    $("resultsCount").textContent = state.filtered.length + (state.filtered.length === 1 ? " regla" : " reglas");
    renderActiveTags();
    renderPagination();

    setVisibility(loadingState, false);
    setVisibility(errorState, false);
    setVisibility(emptyState, state.filtered.length === 0);
    setVisibility(grid, state.filtered.length > 0);

    if (!state.filtered.length) {
      return;
    }

    var fragment = document.createDocumentFragment();

    visibleItems.forEach(function (item) {
      var card = document.createElement("article");
      card.className = "kb-card";

      var header = document.createElement("div");
      header.className = "kb-card-header";

      var titleWrap = document.createElement("div");
      titleWrap.className = "kb-card-title-wrap";

      var code = document.createElement("span");
      code.className = "kb-card-code";
      code.textContent = item.cve_id || item.id;

      var title = document.createElement("h3");
      title.textContent = item.titulo;

      titleWrap.appendChild(code);
      titleWrap.appendChild(title);

      var risk = document.createElement("span");
      risk.className = "risk-badge risk-" + normalize(item.riesgo || item.severidad || "medio");
      risk.textContent = riskLabel(normalize(item.riesgo || item.severidad || "medio"));

      header.appendChild(titleWrap);
      header.appendChild(risk);

      var metaRow = document.createElement("div");
      metaRow.className = "kb-meta-row";

      [categoryLabel(item.categoria), item.fuente].forEach(function (label) {
        var pill = document.createElement("span");
        pill.className = "meta-pill";
        pill.textContent = label;
        metaRow.appendChild(pill);
      });

      var description = document.createElement("p");
      description.textContent = item.descripcion;

      var scenarioTitle = document.createElement("p");
      scenarioTitle.className = "kb-section-title";
      scenarioTitle.textContent = "Escenario";

      var scenario = document.createElement("p");
      scenario.textContent = item.escenario;

      var controlsTitle = document.createElement("p");
      controlsTitle.className = "kb-section-title";
      controlsTitle.textContent = "Controles defensivos";

      var controlsList = document.createElement("ul");
      controlsList.className = "kb-controls";

      (item.controles_defensivos || []).forEach(function (control) {
        var li = document.createElement("li");
        li.textContent = control;
        controlsList.appendChild(li);
      });

      var recommendationTitle = document.createElement("p");
      recommendationTitle.className = "kb-section-title";
      recommendationTitle.textContent = "Recomendación defensiva";

      var recommendation = document.createElement("p");
      recommendation.textContent = item.recomendacion_defensiva;

      var mappings = document.createElement("div");
      mappings.className = "kb-mappings";

      [
        { label: "MITRE ATT&CK", values: item.mitre_attack || [] },
        { label: "NIST CSF", values: item.mapeo_nist_csf || [] },
        { label: "ISO 27001", values: item.mapeo_iso_27001 || [] }
      ].forEach(function (blockData) {
        var block = document.createElement("div");
        block.className = "mapping-block";

        var heading = document.createElement("strong");
        heading.textContent = blockData.label;

        block.appendChild(heading);
        block.appendChild(createMappingChips(blockData.values));
        mappings.appendChild(block);
      });

      card.appendChild(header);
      card.appendChild(metaRow);
      card.appendChild(description);
      card.appendChild(scenarioTitle);
      card.appendChild(scenario);
      card.appendChild(controlsTitle);
      card.appendChild(controlsList);
      card.appendChild(recommendationTitle);
      card.appendChild(recommendation);
      card.appendChild(mappings);

      fragment.appendChild(card);
    });

    grid.appendChild(fragment);
  }

  function bindEvents() {
    $("searchInput").addEventListener("input", function () {
      state.currentPage = 1;
      filterItems();
    });
    $("categoryFilter").addEventListener("change", function () {
      state.currentPage = 1;
      filterItems();
    });
    $("sourceFilter").addEventListener("change", function () {
      state.currentPage = 1;
      filterItems();
    });
    $("riskFilter").addEventListener("change", function () {
      state.currentPage = 1;
      filterItems();
    });
    $("cveSeverityFilter").addEventListener("change", function () {
      state.currentPage = 1;
      filterItems();
    });
    $("mitreFilter").addEventListener("change", function () {
      state.currentPage = 1;
      filterItems();
    });
    $("nistFilter").addEventListener("change", function () {
      state.currentPage = 1;
      filterItems();
    });
    $("sortFilter").addEventListener("change", function () {
      state.currentPage = 1;
      filterItems();
    });
    $("pageSizeFilter").addEventListener("change", function () {
      state.currentPage = 1;
      filterItems();
    });
    $("resetFilters").addEventListener("click", function () {
      $("filtersForm").reset();
      clearMultiSelect("mitreFilter");
      clearMultiSelect("nistFilter");
      clearMultiSelect("isoFilter");
      state.currentPage = 1;
      state.pageSize = 12;
      filterItems();
    });
    $("copyLink").addEventListener("click", shareCurrentView);
    $("prevPage").addEventListener("click", function () {
      if (state.currentPage > 1) {
        state.currentPage -= 1;
        filterItems();
      }
    });
    $("nextPage").addEventListener("click", function () {
      if (state.currentPage < totalPages()) {
        state.currentPage += 1;
        filterItems();
      }
    });
  }

  function handleError() {
    setVisibility($("loadingState"), false);
    setVisibility($("resultsGrid"), false);
    setVisibility($("emptyState"), false);
    setVisibility($("paginationBar"), false);
    setVisibility($("errorState"), true);
  }

  function init(items) {
    var urlState = applyUrlState();

    state.items = items.map(function (item, index) {
      item._order = index;
      return item;
    });
    populateCategoryFilter(items);
    populateValueFilter("sourceFilter", Array.from(new Set(items.map(function (item) { return item.fuente; }))).sort(compareText));
    populateValueFilter("mitreFilter", uniqueValues(items, "mitre_attack"));
    populateValueFilter("nistFilter", uniqueValues(items, "mapeo_nist_csf"));
    populateValueFilter("isoFilter", uniqueValues(items, "mapeo_iso_27001"));
    if (urlState.category && Array.from($("categoryFilter").options).some(function (option) { return option.value === urlState.category; })) {
      $("categoryFilter").value = urlState.category;
    }
    if (urlState.source && Array.from($("sourceFilter").options).some(function (option) { return option.value === urlState.source; })) {
      $("sourceFilter").value = urlState.source;
    }
    if (urlState.cveSeverity && Array.from($("cveSeverityFilter").options).some(function (option) { return option.value === urlState.cveSeverity; })) {
      $("cveSeverityFilter").value = urlState.cveSeverity;
    }
    if (urlState.mitre && urlState.mitre.length > 0) {
      setMultiSelectValues("mitreFilter", urlState.mitre);
    }
    if (urlState.nist && urlState.nist.length > 0) {
      setMultiSelectValues("nistFilter", urlState.nist);
    }
    if (urlState.iso && urlState.iso.length > 0) {
      setMultiSelectValues("isoFilter", urlState.iso);
    }
    renderSummary(items);
    bindEvents();
    filterItems();
  }

  fetch(DATASET_URL, { cache: "no-store" })
    .then(function (response) {
      if (!response.ok) {
        throw new Error("No se pudo cargar el dataset");
      }
      return response.json();
    })
    .then(init)
    .catch(handleError);
})();