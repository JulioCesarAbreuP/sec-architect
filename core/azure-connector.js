/**
 * azure-connector.js
 * Microsoft Graph API connector — PKCE OAuth2 (no client secret in browser).
 * ADR-004: Graph API integration.
 */

const GRAPH_BASE = "https://graph.microsoft.com/v1.0";
const AUTH_BASE  = "https://login.microsoftonline.com";

// ── PKCE helpers ────────────────────────────────────────────────────────────

function generateVerifier() {
  const buf = new Uint8Array(32);
  crypto.getRandomValues(buf);
  return btoa(String.fromCharCode(...buf))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

async function deriveChallenge(verifier) {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

// ── Auth flow ────────────────────────────────────────────────────────────────

export async function initiateGraphLogin(clientId, tenantId, redirectUri) {
  if (!clientId || !tenantId || !redirectUri) {
    throw new Error("clientId, tenantId and redirectUri are required.");
  }
  const verifier   = generateVerifier();
  const challenge  = await deriveChallenge(verifier);
  sessionStorage.setItem("cspm_pkce_verifier", verifier);

  const params = new URLSearchParams({
    client_id:             clientId,
    response_type:         "code",
    redirect_uri:          redirectUri,
    scope:                 "https://graph.microsoft.com/Policy.Read.All https://graph.microsoft.com/AuditLog.Read.All openid profile",
    code_challenge:        challenge,
    code_challenge_method: "S256",
    response_mode:         "query"
  });

  window.location.href = `${AUTH_BASE}/${encodeURIComponent(tenantId)}/oauth2/v2.0/authorize?${params}`;
}

export async function handleAuthCallback(clientId, tenantId, redirectUri) {
  const params   = new URLSearchParams(window.location.search);
  const code     = params.get("code");
  if (!code) return null;

  const verifier = sessionStorage.getItem("cspm_pkce_verifier");
  if (!verifier) throw new Error("PKCE verifier missing — restart login flow.");

  const body = new URLSearchParams({
    client_id:     clientId,
    grant_type:    "authorization_code",
    code,
    redirect_uri:  redirectUri,
    code_verifier: verifier
  });

  const res = await fetch(`${AUTH_BASE}/${encodeURIComponent(tenantId)}/oauth2/v2.0/token`, {
    method:  "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Token exchange failed: ${err.error_description || res.status}`);
  }

  const tokens = await res.json();
  sessionStorage.setItem("cspm_graph_token", tokens.access_token);
  sessionStorage.removeItem("cspm_pkce_verifier");
  // Clean URL without leaking auth code in history
  window.history.replaceState({}, document.title, window.location.pathname);
  return tokens.access_token;
}

// ── Graph API requests ───────────────────────────────────────────────────────

async function graphGet(path) {
  const token = sessionStorage.getItem("cspm_graph_token");
  if (!token) throw new Error("Not authenticated. Connect to Azure first.");

  const res = await fetch(`${GRAPH_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (res.status === 401) {
    sessionStorage.removeItem("cspm_graph_token");
    throw new Error("Token expired. Please reconnect.");
  }
  if (!res.ok) throw new Error(`Graph API ${path} → HTTP ${res.status}`);
  return res.json();
}

// ── Public API surface ───────────────────────────────────────────────────────

export async function fetchConditionalAccessPolicies() {
  const data = await graphGet("/identity/conditionalAccessPolicies");
  return data.value || [];
}

export async function fetchServicePrincipals(top = 50) {
  const data = await graphGet(`/servicePrincipals?$top=${top}`);
  return data.value || [];
}

export async function fetchRoleAssignments() {
  const data = await graphGet("/roleManagement/directory/roleAssignments?$expand=principal");
  return data.value || [];
}

export async function fetchAuditLogs(hours = 24) {
  const since = new Date(Date.now() - hours * 3_600_000).toISOString();
  const data  = await graphGet(
    `/auditLogs/directoryAudits?$filter=activityDateTime ge ${since}&$top=200&$orderby=activityDateTime desc`
  );
  return data.value || [];
}

export function isAuthenticated() {
  return Boolean(sessionStorage.getItem("cspm_graph_token"));
}

export function disconnect() {
  sessionStorage.removeItem("cspm_graph_token");
  sessionStorage.removeItem("cspm_pkce_verifier");
}
