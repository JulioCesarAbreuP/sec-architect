/**
 * graph-client.js
 * Microsoft Graph API client — Entra ID queries.
 *
 * All calls require a valid Bearer token (see pkce-auth.js).
 *
 * Exported surface:
 *   fetchMeProfile(token)                   — /me
 *   fetchConditionalAccessPolicies(token)   — /identity/conditionalAccess/policies
 *   fetchNamedLocations(token)              — /identity/conditionalAccess/namedLocations
 */

var GRAPH_BASE = "https://graph.microsoft.com/v1.0";

// ---------------------------------------------------------------------------
// Internal request helper
// ---------------------------------------------------------------------------

async function graphGet(path, token) {
  var response = await fetch(GRAPH_BASE + path, {
    headers: {
      "Authorization": "Bearer " + token,
      "Content-Type":  "application/json"
    }
  });

  if (response.status === 401) {
    throw new Error("UNAUTHORIZED — token expired or insufficient Graph permissions. Re-authenticate.");
  }

  if (response.status === 403) {
    throw new Error("FORBIDDEN — the app registration lacks the required Graph API permissions.");
  }

  if (!response.ok) {
    var err = await response.json().catch(function () { return {}; });
    var msg = (err.error && err.error.message) ? err.error.message : ("Graph API error — HTTP " + response.status);
    throw new Error(msg);
  }

  return response.json();
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

/**
 * Returns the signed-in user's profile.
 * Required scope: openid profile
 */
export async function fetchMeProfile(token) {
  return graphGet("/me", token);
}

/**
 * Returns all Conditional Access policies in the tenant.
 * Required scope: Policy.Read.All
 */
export async function fetchConditionalAccessPolicies(token) {
  return graphGet("/identity/conditionalAccess/policies", token);
}

/**
 * Returns all Named Locations configured for Conditional Access.
 * Required scope: Policy.Read.All
 */
export async function fetchNamedLocations(token) {
  return graphGet("/identity/conditionalAccess/namedLocations", token);
}
