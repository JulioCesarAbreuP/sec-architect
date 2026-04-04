/**
 * azure-auth-panel.js
 * Azure AD Connect panel — Enterprise Command Center integration.
 *
 * Handles PKCE callback on page load, manages auth state display,
 * and bridges Graph API CA policy data directly into the Entra ID Parser.
 *
 * Exported surface:
 *   initAzureAuthPanel(appendLog, runAnalysis)
 */

import {
  handleAuthCallback,
  startAuthFlow,
  getStoredToken,
  getStoredUser,
  clearAuth
} from "../auth/pkce-auth.js";

import { fetchConditionalAccessPolicies } from "../auth/graph-client.js";

var CFG_CLIENT = "sa_cfg_clientId";
var CFG_TENANT = "sa_cfg_tenantId";

// ---------------------------------------------------------------------------
// DOM helpers
// ---------------------------------------------------------------------------

function byId(id) {
  return document.getElementById(id);
}

function setAuthStatus(type, message) {
  var dot   = byId("azure-auth-dot");
  var label = byId("azure-auth-status");
  if (dot)   { dot.dataset.statusType   = type; }
  if (label) { label.textContent = message; }
}

// ---------------------------------------------------------------------------
// State sync
// ---------------------------------------------------------------------------

function syncAuthUI() {
  var token            = getStoredToken();
  var user             = getStoredUser();
  var connectSection   = byId("azure-connect-form");
  var connectedSection = byId("azure-connected-state");
  var userLabel        = byId("azure-auth-user");
  var redirectInfo     = byId("azure-redirect-uri");
  var loadBtn          = byId("azure-load-policies-btn");
  var disconnectBtn    = byId("azure-disconnect-btn");

  if (redirectInfo) {
    redirectInfo.textContent = window.location.origin + window.location.pathname;
  }

  if (token) {
    if (connectSection)   { connectSection.hidden   = true;  }
    if (connectedSection) { connectedSection.hidden = false; }
    if (userLabel)        { userLabel.textContent   = user || "sesión activa"; }
    if (loadBtn)          { loadBtn.disabled        = false; }
    if (disconnectBtn)    { disconnectBtn.hidden     = false; }
    setAuthStatus("success", "Conectado" + (user ? " · " + user : ""));
  } else {
    if (connectSection)   { connectSection.hidden   = false; }
    if (connectedSection) { connectedSection.hidden = true;  }
    setAuthStatus("idle", "Sin autenticar");
  }
}

// ---------------------------------------------------------------------------
// Config read + restore
// ---------------------------------------------------------------------------

function readConfig() {
  var elClient = byId("azure-client-id");
  var elTenant = byId("azure-tenant-id");

  return {
    clientId:    (elClient && elClient.value.trim()) || sessionStorage.getItem(CFG_CLIENT) || "",
    tenantId:    (elTenant && elTenant.value.trim()) || sessionStorage.getItem(CFG_TENANT) || "",
    scope:       "https://graph.microsoft.com/Policy.Read.All openid profile",
    redirectUri: window.location.origin + window.location.pathname
  };
}

function validateConfig(config) {
  var guidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!guidRe.test(config.clientId)) { return "Client ID debe ser un GUID válido."; }
  if (!guidRe.test(config.tenantId)) { return "Tenant ID debe ser un GUID válido."; }
  return null;
}

function restoreConfigInputs() {
  var clientId = sessionStorage.getItem(CFG_CLIENT);
  var tenantId = sessionStorage.getItem(CFG_TENANT);
  var elClient = byId("azure-client-id");
  var elTenant = byId("azure-tenant-id");
  if (clientId && elClient) { elClient.value = clientId; }
  if (tenantId && elTenant) { elTenant.value = tenantId; }
}

// ---------------------------------------------------------------------------
// Action handlers
// ---------------------------------------------------------------------------

async function handleConnect(appendLog) {
  var config = readConfig();
  var err    = validateConfig(config);

  if (err) {
    setAuthStatus("error", err);
    return;
  }

  sessionStorage.setItem(CFG_CLIENT, config.clientId);
  sessionStorage.setItem(CFG_TENANT, config.tenantId);

  setAuthStatus("loading", "Redirigiendo a Microsoft Identity...");

  try {
    await startAuthFlow(config);
  } catch (e) {
    setAuthStatus("error", "Error iniciando auth: " + e.message);
    if (appendLog) { appendLog("[AZURE-AUTH] " + e.message, "threat"); }
  }
}

async function handleLoadPolicies(appendLog, runAnalysis) {
  var token = getStoredToken();

  if (!token) {
    setAuthStatus("error", "Sesión expirada — vuelve a autenticarte.");
    syncAuthUI();
    return;
  }

  var loadBtn = byId("azure-load-policies-btn");
  if (loadBtn) { loadBtn.disabled = true; loadBtn.textContent = "Cargando..."; }

  setAuthStatus("loading", "Leyendo CA Policies desde Graph API...");

  try {
    var policies = await fetchConditionalAccessPolicies(token);
    var count    = policies && policies.value ? policies.value.length : 0;

    // Update count badge
    var badge = byId("azure-policy-count");
    if (badge) { badge.textContent = String(count); }

    setAuthStatus("success", count + " CA Policies cargadas desde tenant");

    if (appendLog) {
      appendLog("[GRAPH] " + count + " CA Policies cargadas desde tenant vía Microsoft Graph", "info");
    }

    // Auto-populate Entra ID Parser with the first policy and trigger analysis
    if (count > 0) {
      var firstPolicy   = policies.value[0];
      var jsonInput     = byId("graphJsonInput");

      if (jsonInput) {
        jsonInput.value = JSON.stringify(firstPolicy, null, 2);
        jsonInput.dispatchEvent(new Event("input"));

        if (appendLog) {
          appendLog("[GRAPH] CA Policy '" + (firstPolicy.displayName || firstPolicy.id || "unknown") + "' cargada en Entra ID Parser", "info");
        }

        if (runAnalysis) {
          await runAnalysis();
        }
      }
    }
  } catch (e) {
    setAuthStatus("error", "Error Graph: " + e.message);
    if (appendLog) { appendLog("[GRAPH] " + e.message, "threat"); }
  } finally {
    if (loadBtn) {
      loadBtn.disabled    = false;
      loadBtn.textContent = "Cargar CA Policies del Tenant";
    }
  }
}

function handleDisconnect(appendLog) {
  clearAuth();
  syncAuthUI();

  var badge = byId("azure-policy-count");
  if (badge) { badge.textContent = "0"; }

  if (appendLog) { appendLog("[AZURE-AUTH] Sesión cerrada.", "info"); }
}

// ---------------------------------------------------------------------------
// Public init
// ---------------------------------------------------------------------------

export async function initAzureAuthPanel(appendLog, runAnalysis) {
  restoreConfigInputs();

  // Handle PKCE callback if present (page loaded after redirect)
  var params = new URLSearchParams(window.location.search);

  if (params.has("code") || params.has("error")) {
    var config = readConfig();
    setAuthStatus("loading", "Procesando callback de autenticación...");

    try {
      await handleAuthCallback(config);
    } catch (e) {
      clearAuth();
      setAuthStatus("error", "Error en callback: " + e.message);
      if (appendLog) { appendLog("[AZURE-AUTH] Callback error: " + e.message, "threat"); }
    }
  }

  syncAuthUI();

  // Wire buttons
  var connectBtn      = byId("azure-connect-btn");
  var disconnectBtn   = byId("azure-disconnect-btn");
  var loadPoliciesBtn = byId("azure-load-policies-btn");

  if (connectBtn) {
    connectBtn.addEventListener("click", function () {
      handleConnect(appendLog).catch(function () {});
    });
  }

  if (disconnectBtn) {
    disconnectBtn.addEventListener("click", function () {
      handleDisconnect(appendLog);
    });
  }

  if (loadPoliciesBtn) {
    loadPoliciesBtn.addEventListener("click", function () {
      handleLoadPolicies(appendLog, runAnalysis).catch(function () {});
    });
  }
}
