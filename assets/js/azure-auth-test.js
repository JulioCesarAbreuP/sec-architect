/**
 * azure-auth-test.js
 * Page controller for tools/azure-auth-test.html.
 * Manages PKCE auth flow + Graph API queries and renders results.
 */

import {
  startAuthFlow,
  handleAuthCallback,
  getStoredToken,
  getStoredUser,
  clearAuth
} from "../core/auth/pkce-auth.js";

import {
  fetchMeProfile,
  fetchConditionalAccessPolicies,
  fetchNamedLocations
} from "../core/auth/graph-client.js";

// ---------------------------------------------------------------------------
// Config read from the form
// ---------------------------------------------------------------------------

function readConfig() {
  return {
    clientId:    byId("clientId").value.trim(),
    tenantId:    byId("tenantId").value.trim(),
    scope:       byId("scopeInput").value.trim(),
    redirectUri: window.location.origin + window.location.pathname
  };
}

function validateConfig(config) {
  var guidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!guidRe.test(config.clientId)) {
    return "Client ID must be a valid GUID (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx).";
  }
  if (!guidRe.test(config.tenantId)) {
    return "Tenant ID must be a valid GUID (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx).";
  }
  if (!config.scope) {
    return "Scope cannot be empty.";
  }
  return null;
}

// ---------------------------------------------------------------------------
// DOM helpers
// ---------------------------------------------------------------------------

function byId(id) {
  return document.getElementById(id);
}

function setStatus(message, type) {
  var el = byId("authStatus");
  if (!el) { return; }
  el.textContent = message;
  el.dataset.statusType = type || "info";
}

function setResultsVisible(visible) {
  var panel = byId("resultsPanel");
  if (panel) {
    panel.hidden = !visible;
  }
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ---------------------------------------------------------------------------
// Auth state UI sync
// ---------------------------------------------------------------------------

function syncAuthUI() {
  var token = getStoredToken();
  var user  = getStoredUser();
  var connectBtn   = byId("connectBtn");
  var signOutBtn   = byId("signOutBtn");
  var fetchCaBtn   = byId("fetchCaBtn");
  var fetchLocBtn  = byId("fetchLocBtn");
  var redirectInfo = byId("redirectUri");

  if (redirectInfo) {
    redirectInfo.textContent = window.location.origin + window.location.pathname;
  }

  if (token) {
    setStatus("Autenticado" + (user ? " como " + user : "") + " — token activo en sesión", "success");
    if (connectBtn) { connectBtn.hidden = true; }
    if (signOutBtn) { signOutBtn.hidden = false; }
    if (fetchCaBtn) { fetchCaBtn.disabled = false; }
    if (fetchLocBtn) { fetchLocBtn.disabled = false; }
  } else {
    setStatus("Sin autenticar — introduce Client ID y Tenant ID y pulsa Conectar.", "idle");
    if (connectBtn) { connectBtn.hidden = false; }
    if (signOutBtn) { signOutBtn.hidden = true; }
    if (fetchCaBtn) { fetchCaBtn.disabled = true; }
    if (fetchLocBtn) { fetchLocBtn.disabled = true; }
    setResultsVisible(false);
  }
}

// ---------------------------------------------------------------------------
// Render helpers for CA policies
// ---------------------------------------------------------------------------

function stateLabel(state) {
  var map = {
    enabled:         "ENABLED",
    disabled:        "DISABLED",
    enabledForReportingButNotEnforced: "REPORT ONLY"
  };
  return map[state] || state;
}

function renderCaPolicies(policies) {
  var container = byId("caPoliciesContainer");
  var countEl   = byId("caPoliciesCount");

  if (!container) { return; }

  // Remove previous children safely
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  if (!policies || !policies.value || !policies.value.length) {
    var empty = document.createElement("p");
    empty.className = "empty-msg";
    empty.textContent = "No se encontraron Conditional Access Policies en el tenant.";
    container.appendChild(empty);
    if (countEl) { countEl.textContent = "0"; }
    return;
  }

  if (countEl) { countEl.textContent = String(policies.value.length); }

  policies.value.forEach(function (policy) {
    var card = document.createElement("article");
    card.className = "ca-policy-card";

    var header = document.createElement("div");
    header.className = "ca-policy-header";

    var name = document.createElement("h3");
    name.textContent = policy.displayName || "(Sin nombre)";

    var badge = document.createElement("span");
    badge.className = "ca-state-badge ca-state-" + (policy.state || "unknown");
    badge.textContent = stateLabel(policy.state);

    header.appendChild(name);
    header.appendChild(badge);

    var meta = document.createElement("dl");
    meta.className = "ca-policy-meta";

    var fields = [
      { label: "ID",       value: policy.id },
      { label: "Creado",   value: policy.createdDateTime ? new Date(policy.createdDateTime).toLocaleDateString("es-ES") : "—" },
      { label: "Modificado", value: policy.modifiedDateTime ? new Date(policy.modifiedDateTime).toLocaleDateString("es-ES") : "—" }
    ];

    fields.forEach(function (f) {
      var dt = document.createElement("dt");
      dt.textContent = f.label;
      var dd = document.createElement("dd");
      dd.textContent = f.value || "—";
      meta.appendChild(dt);
      meta.appendChild(dd);
    });

    var toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "ca-json-toggle";
    toggle.textContent = "Ver JSON completo";

    var pre = document.createElement("pre");
    pre.className = "ca-json-block";
    pre.hidden = true;
    pre.textContent = JSON.stringify(policy, null, 2);

    toggle.addEventListener("click", function () {
      pre.hidden = !pre.hidden;
      toggle.textContent = pre.hidden ? "Ver JSON completo" : "Ocultar JSON";
    });

    card.appendChild(header);
    card.appendChild(meta);
    card.appendChild(toggle);
    card.appendChild(pre);
    container.appendChild(card);
  });

  setResultsVisible(true);
}

function renderNamedLocations(locations) {
  var container = byId("namedLocationsContainer");
  var countEl   = byId("namedLocationsCount");

  if (!container) { return; }

  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  if (!locations || !locations.value || !locations.value.length) {
    var empty = document.createElement("p");
    empty.className = "empty-msg";
    empty.textContent = "No se encontraron Named Locations en el tenant.";
    container.appendChild(empty);
    if (countEl) { countEl.textContent = "0"; }
    return;
  }

  if (countEl) { countEl.textContent = String(locations.value.length); }

  locations.value.forEach(function (loc) {
    var row = document.createElement("div");
    row.className = "location-row";

    var name = document.createElement("span");
    name.className = "location-name";
    name.textContent = loc.displayName || "(Sin nombre)";

    var type = document.createElement("span");
    type.className = "location-type";
    type.textContent = loc["@odata.type"] ? loc["@odata.type"].replace("#microsoft.graph.", "") : "unknown";

    row.appendChild(name);
    row.appendChild(type);
    container.appendChild(row);
  });
}

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

async function handleConnect() {
  var config = readConfig();
  var validationError = validateConfig(config);

  if (validationError) {
    setStatus("Error de configuración: " + validationError, "error");
    return;
  }

  // Persist config so it survives the redirect
  sessionStorage.setItem("sa_cfg_clientId", config.clientId);
  sessionStorage.setItem("sa_cfg_tenantId", config.tenantId);
  sessionStorage.setItem("sa_cfg_scope", config.scope);

  try {
    await startAuthFlow(config);
  } catch (err) {
    setStatus("Error iniciando auth: " + err.message, "error");
  }
}

function handleSignOut() {
  clearAuth();
  syncAuthUI();
  clearGraphResults();
}

function clearGraphResults() {
  var panel = byId("resultsPanel");
  if (panel) { panel.hidden = true; }
}

async function handleFetchCaPolicies() {
  var token = getStoredToken();

  if (!token) {
    setStatus("Sesión expirada — vuelve a autenticarte.", "error");
    syncAuthUI();
    return;
  }

  setStatus("Cargando Conditional Access Policies...", "loading");
  byId("fetchCaBtn").disabled = true;

  try {
    var policies = await fetchConditionalAccessPolicies(token);
    renderCaPolicies(policies);
    setStatus("Políticas cargadas correctamente — " + (policies.value ? policies.value.length : 0) + " encontradas.", "success");
  } catch (err) {
    setStatus("Error al cargar CA Policies: " + err.message, "error");
  } finally {
    var btn = byId("fetchCaBtn");
    if (btn) { btn.disabled = false; }
  }
}

async function handleFetchLocations() {
  var token = getStoredToken();

  if (!token) {
    setStatus("Sesión expirada — vuelve a autenticarte.", "error");
    syncAuthUI();
    return;
  }

  setStatus("Cargando Named Locations...", "loading");
  byId("fetchLocBtn").disabled = true;

  try {
    var locations = await fetchNamedLocations(token);
    renderNamedLocations(locations);
    setResultsVisible(true);
    setStatus("Locations cargadas — " + (locations.value ? locations.value.length : 0) + " encontradas.", "success");
  } catch (err) {
    setStatus("Error al cargar Named Locations: " + err.message, "error");
  } finally {
    var btn = byId("fetchLocBtn");
    if (btn) { btn.disabled = false; }
  }
}

// ---------------------------------------------------------------------------
// Restore persisted config after redirect
// ---------------------------------------------------------------------------

function restoreConfig() {
  var clientId = sessionStorage.getItem("sa_cfg_clientId");
  var tenantId = sessionStorage.getItem("sa_cfg_tenantId");
  var scope    = sessionStorage.getItem("sa_cfg_scope");

  if (clientId) { var el = byId("clientId");    if (el) { el.value = clientId; } }
  if (tenantId) { var el2 = byId("tenantId");   if (el2) { el2.value = tenantId; } }
  if (scope)    { var el3 = byId("scopeInput"); if (el3) { el3.value = scope; } }
}

// ---------------------------------------------------------------------------
// Initialisation
// ---------------------------------------------------------------------------

async function init() {
  restoreConfig();

  // If page loaded with ?code=... handle the callback first
  var params = new URLSearchParams(window.location.search);
  if (params.has("code") || params.has("error")) {
    var config = readConfig();
    setStatus("Procesando callback de autenticación...", "loading");

    try {
      await handleAuthCallback(config);
      setStatus("Autenticación completada.", "success");
    } catch (err) {
      clearAuth();
      setStatus("Error en callback: " + err.message, "error");
    }
  }

  syncAuthUI();

  // Wire buttons
  var connectBtn  = byId("connectBtn");
  var signOutBtn  = byId("signOutBtn");
  var fetchCaBtn  = byId("fetchCaBtn");
  var fetchLocBtn = byId("fetchLocBtn");

  if (connectBtn)  { connectBtn.addEventListener("click", handleConnect); }
  if (signOutBtn)  { signOutBtn.addEventListener("click", handleSignOut); }
  if (fetchCaBtn)  { fetchCaBtn.addEventListener("click", handleFetchCaPolicies); }
  if (fetchLocBtn) { fetchLocBtn.addEventListener("click", handleFetchLocations); }
}

document.addEventListener("DOMContentLoaded", init);
