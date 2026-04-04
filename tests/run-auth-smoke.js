/**
 * run-auth-smoke.js
 * Smoke tests for core/auth/pkce-auth.js — non-browser, non-async helpers.
 *
 * Mocks: sessionStorage, window, history, crypto (via Node.js global).
 * Node.js 20+ provides crypto.getRandomValues, crypto.subtle, URLSearchParams,
 * TextEncoder, btoa, and fetch globally.
 */

// ---------------------------------------------------------------------------
// Browser globals mock (must be set before dynamic import)
// ---------------------------------------------------------------------------

var mockStore = {};

global.sessionStorage = {
  _store: mockStore,
  getItem(key) { return Object.prototype.hasOwnProperty.call(this._store, key) ? this._store[key] : null; },
  setItem(key, val) { this._store[key] = String(val); },
  removeItem(key) { delete this._store[key]; },
  clear() { this._store = {}; Object.keys(mockStore).forEach(k => delete mockStore[k]); }
};

var capturedHref = null;
global.window = {
  location: {
    get href() { return capturedHref || ""; },
    set href(v) { capturedHref = v; },
    pathname: "/tools/enterprise-command-center.html",
    origin: "https://juliocesarabreup.github.io",
    search: ""
  }
};

global.history = { replaceState() {} };

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

var passed = 0;
var failed = 0;

function assert(condition, label) {
  if (condition) {
    console.log("  [PASS] " + label);
    passed++;
  } else {
    console.error("  [FAIL] " + label);
    failed++;
  }
}

function section(name) {
  console.log("\n─── " + name + " ───");
}

function clearSession() {
  global.sessionStorage._store = {};
  capturedHref = null;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

async function testGetStoredToken(mod) {
  section("getStoredToken()");

  clearSession();
  assert(mod.getStoredToken() === null, "returns null when no token stored");

  // Expired token
  clearSession();
  global.sessionStorage.setItem("sa_auth_token", "tok-expired");
  global.sessionStorage.setItem("sa_token_expiry", String(Date.now() - 10000));
  assert(mod.getStoredToken() === null, "returns null when token is expired");

  // Valid token
  clearSession();
  global.sessionStorage.setItem("sa_auth_token", "tok-valid");
  global.sessionStorage.setItem("sa_token_expiry", String(Date.now() + 3600000));
  var tok = mod.getStoredToken();
  assert(tok === "tok-valid", "returns token when valid and not expired");

  // Token within 60s buffer (should be treated as expired)
  clearSession();
  global.sessionStorage.setItem("sa_auth_token", "tok-about-to-expire");
  global.sessionStorage.setItem("sa_token_expiry", String(Date.now() + 30000)); // 30s remaining
  assert(mod.getStoredToken() === null, "returns null when token within 60s buffer");
}

async function testGetStoredUser(mod) {
  section("getStoredUser()");

  clearSession();
  assert(mod.getStoredUser() === null, "returns null when no user stored");

  clearSession();
  global.sessionStorage.setItem("sa_auth_user", "admin@contoso.com");
  assert(mod.getStoredUser() === "admin@contoso.com", "returns stored user UPN");
}

async function testClearAuth(mod) {
  section("clearAuth()");

  clearSession();
  global.sessionStorage.setItem("sa_auth_token", "t");
  global.sessionStorage.setItem("sa_token_expiry", "9999999999999");
  global.sessionStorage.setItem("sa_pkce_verifier", "v");
  global.sessionStorage.setItem("sa_pkce_state", "s");
  global.sessionStorage.setItem("sa_auth_user", "u");

  mod.clearAuth();

  assert(global.sessionStorage.getItem("sa_auth_token") === null, "clears sa_auth_token");
  assert(global.sessionStorage.getItem("sa_token_expiry") === null, "clears sa_token_expiry");
  assert(global.sessionStorage.getItem("sa_pkce_verifier") === null, "clears sa_pkce_verifier");
  assert(global.sessionStorage.getItem("sa_pkce_state") === null, "clears sa_pkce_state");
  assert(global.sessionStorage.getItem("sa_auth_user") === null, "clears sa_auth_user");
  assert(mod.getStoredToken() === null, "getStoredToken() returns null after clearAuth");
}

async function testHandleCallbackNoCode(mod) {
  section("handleAuthCallback() — no code in URL");

  clearSession();
  global.window.location.search = "";

  try {
    var result = await mod.handleAuthCallback({ clientId: "x", tenantId: "y", scope: "openid", redirectUri: "http://localhost/" });
    assert(result === null, "returns null when no code param in URL");
  } catch (e) {
    assert(false, "should not throw when no code in URL: " + e.message);
  } finally {
    global.window.location.search = "";
  }
}

async function testHandleCallbackError(mod) {
  section("handleAuthCallback() — error param in URL");

  clearSession();
  global.window.location.search = "?error=access_denied&error_description=User+rejected";

  try {
    await mod.handleAuthCallback({ clientId: "x", tenantId: "y", scope: "openid", redirectUri: "http://localhost/" });
    assert(false, "should have thrown for error param");
  } catch (e) {
    assert(/access_denied|error/i.test(e.message), "throws with error description when error param present");
  } finally {
    global.window.location.search = "";
  }
}

async function testHandleCallbackStateMismatch(mod) {
  section("handleAuthCallback() — state mismatch (CSRF guard)");

  clearSession();
  global.sessionStorage.setItem("sa_pkce_state", "legitimate-state-abc123");
  global.sessionStorage.setItem("sa_pkce_verifier", "some-verifier");
  global.window.location.search = "?code=AUTH_CODE_XYZ&state=attacker-controlled-state";

  try {
    await mod.handleAuthCallback({ clientId: "x", tenantId: "y", scope: "openid", redirectUri: "http://localhost/" });
    assert(false, "should have thrown for state mismatch");
  } catch (e) {
    assert(/state mismatch|csrf/i.test(e.message), "throws state mismatch error for CSRF protection");
  } finally {
    global.window.location.search = "";
  }
}

async function testHandleCallbackMissingVerifier(mod) {
  section("handleAuthCallback() — matching state but no verifier");

  clearSession();
  global.sessionStorage.setItem("sa_pkce_state", "valid-state-999");
  // No verifier stored → should throw
  global.window.location.search = "?code=AUTH_CODE&state=valid-state-999";

  try {
    await mod.handleAuthCallback({ clientId: "x", tenantId: "y", scope: "openid", redirectUri: "http://localhost/" });
    assert(false, "should have thrown for missing verifier");
  } catch (e) {
    assert(/verifier/i.test(e.message), "throws when code verifier is missing from session");
  } finally {
    global.window.location.search = "";
  }
}

async function testGuidValidation() {
  section("GUID format validation");

  var guidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  assert(guidRe.test("550e8400-e29b-41d4-a716-446655440000"), "accepts valid GUIDv4");
  assert(guidRe.test("00000000-0000-0000-0000-000000000000"), "accepts all-zero GUID");
  assert(!guidRe.test("not-a-guid"), "rejects plain string");
  assert(!guidRe.test("550e8400e29b41d4a716446655440000"), "rejects GUID without hyphens");
  assert(!guidRe.test("550e8400-e29b-41d4-a716-4466554400001"), "rejects GUID with extra char");
  assert(!guidRe.test(""), "rejects empty string");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("SEC_ARCHITECT — Azure Auth Smoke Test");
  console.log("======================================");

  var mod;
  try {
    mod = await import("../core/auth/pkce-auth.js");
  } catch (e) {
    console.error("[FATAL] Could not import pkce-auth.js: " + e.message);
    process.exit(1);
  }

  assert(typeof mod.startAuthFlow === "function", "exports startAuthFlow");
  assert(typeof mod.handleAuthCallback === "function", "exports handleAuthCallback");
  assert(typeof mod.getStoredToken === "function", "exports getStoredToken");
  assert(typeof mod.getStoredUser === "function", "exports getStoredUser");
  assert(typeof mod.clearAuth === "function", "exports clearAuth");

  await testGetStoredToken(mod);
  await testGetStoredUser(mod);
  await testClearAuth(mod);
  await testHandleCallbackNoCode(mod);
  await testHandleCallbackError(mod);
  await testHandleCallbackStateMismatch(mod);
  await testHandleCallbackMissingVerifier(mod);
  await testGuidValidation();

  console.log("\n======================================");
  console.log("Results: " + passed + " passed, " + failed + " failed");

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch(function (e) {
  console.error("[FATAL] " + e.message);
  process.exit(1);
});
