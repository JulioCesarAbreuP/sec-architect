/**
 * pkce-auth.js
 * Microsoft Identity Platform — OAuth 2.0 PKCE flow (no client secret).
 * Uses Web Crypto API (SHA-256) and sessionStorage.
 *
 * Exported surface:
 *   startAuthFlow(config)        — begin login redirect
 *   handleAuthCallback(config)   — exchange code for token after redirect
 *   getStoredToken()             — return valid token or null
 *   clearAuth()                  — sign out (removes stored session data)
 */

const SK_VERIFIER = "sa_pkce_verifier";
const SK_STATE    = "sa_pkce_state";
const SK_TOKEN    = "sa_auth_token";
const SK_EXPIRY   = "sa_token_expiry";
const SK_USER     = "sa_auth_user";

// ---------------------------------------------------------------------------
// Crypto helpers (Web Crypto API — available in all modern browsers)
// ---------------------------------------------------------------------------

function base64urlEncode(buffer) {
  var bytes = new Uint8Array(buffer);
  var str   = "";
  for (var i = 0; i < bytes.byteLength; i++) {
    str += String.fromCharCode(bytes[i]);
  }
  return btoa(str)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function generateCodeVerifier() {
  var array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64urlEncode(array.buffer);
}

async function generateCodeChallenge(verifier) {
  var encoder = new TextEncoder();
  var data    = encoder.encode(verifier);
  var digest  = await crypto.subtle.digest("SHA-256", data);
  return base64urlEncode(digest);
}

function generateState() {
  var array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return base64urlEncode(array.buffer);
}

// ---------------------------------------------------------------------------
// Auth URL construction
// ---------------------------------------------------------------------------

function buildAuthUrl(config, challenge, state) {
  var params = new URLSearchParams({
    client_id:             config.clientId,
    response_type:         "code",
    redirect_uri:          config.redirectUri,
    scope:                 config.scope,
    response_mode:         "query",
    state:                 state,
    code_challenge:        challenge,
    code_challenge_method: "S256",
    prompt:                "select_account"
  });

  return "https://login.microsoftonline.com/" + config.tenantId + "/oauth2/v2.0/authorize?" + params.toString();
}

// ---------------------------------------------------------------------------
// Public: start PKCE redirect
// ---------------------------------------------------------------------------

export async function startAuthFlow(config) {
  var verifier  = generateCodeVerifier();
  var challenge = await generateCodeChallenge(verifier);
  var state     = generateState();

  sessionStorage.setItem(SK_VERIFIER, verifier);
  sessionStorage.setItem(SK_STATE, state);

  window.location.href = buildAuthUrl(config, challenge, state);
}

// ---------------------------------------------------------------------------
// Public: handle redirect callback, exchange code for token
// ---------------------------------------------------------------------------

export async function handleAuthCallback(config) {
  var params    = new URLSearchParams(window.location.search);
  var code      = params.get("code");
  var retState  = params.get("state");
  var error     = params.get("error");
  var errorDesc = params.get("error_description");

  if (error) {
    throw new Error("Auth error: " + error + " — " + (errorDesc || "no description"));
  }

  if (!code) {
    return null; // Not a callback — normal page load
  }

  var storedState = sessionStorage.getItem(SK_STATE);
  if (!storedState || storedState !== retState) {
    throw new Error("State mismatch — potential CSRF. Restart authentication.");
  }

  var verifier = sessionStorage.getItem(SK_VERIFIER);
  if (!verifier) {
    throw new Error("Code verifier missing — cannot exchange authorization code.");
  }

  var tokenData = await exchangeCodeForToken(code, verifier, config);

  // Persist session state
  sessionStorage.removeItem(SK_VERIFIER);
  sessionStorage.removeItem(SK_STATE);
  sessionStorage.setItem(SK_TOKEN,  tokenData.access_token);
  sessionStorage.setItem(SK_EXPIRY, String(Date.now() + tokenData.expires_in * 1000));

  // Decode UPN from id_token claims if available
  if (tokenData.id_token) {
    try {
      var parts   = tokenData.id_token.split(".");
      var payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
      sessionStorage.setItem(SK_USER, payload.preferred_username || payload.upn || payload.email || "");
    } catch (_) {
      // Claim parse failure is non-fatal
    }
  }

  // Remove auth params from URL without page reload
  history.replaceState({}, "", window.location.pathname);

  return tokenData;
}

// ---------------------------------------------------------------------------
// Token exchange (PKCE)
// ---------------------------------------------------------------------------

async function exchangeCodeForToken(code, verifier, config) {
  var body = new URLSearchParams({
    grant_type:    "authorization_code",
    client_id:     config.clientId,
    code:          code,
    redirect_uri:  config.redirectUri,
    code_verifier: verifier,
    scope:         config.scope
  });

  var response = await fetch(
    "https://login.microsoftonline.com/" + config.tenantId + "/oauth2/v2.0/token",
    {
      method:  "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body:    body.toString()
    }
  );

  if (!response.ok) {
    var err = await response.json().catch(function () { return {}; });
    throw new Error(err.error_description || ("Token exchange failed — HTTP " + response.status));
  }

  return response.json();
}

// ---------------------------------------------------------------------------
// Public: retrieve unexpired token from sessionStorage
// ---------------------------------------------------------------------------

export function getStoredToken() {
  var token  = sessionStorage.getItem(SK_TOKEN);
  var expiry = Number(sessionStorage.getItem(SK_EXPIRY) || 0);

  // Treat token as expired 60 s before actual expiry (clock skew buffer)
  if (!token || Date.now() >= expiry - 60000) {
    return null;
  }

  return token;
}

export function getStoredUser() {
  return sessionStorage.getItem(SK_USER) || null;
}

// ---------------------------------------------------------------------------
// Public: sign out
// ---------------------------------------------------------------------------

export function clearAuth() {
  sessionStorage.removeItem(SK_TOKEN);
  sessionStorage.removeItem(SK_EXPIRY);
  sessionStorage.removeItem(SK_VERIFIER);
  sessionStorage.removeItem(SK_STATE);
  sessionStorage.removeItem(SK_USER);
}
