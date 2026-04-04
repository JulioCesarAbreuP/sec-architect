export function parseIdentityJson(rawInput) {
  var raw = String(rawInput || "").trim();

  if (!raw) {
    return {
      ok: false,
      error: "empty_input",
      message: "[ERROR] JSON de Identidad No Válido"
    };
  }

  try {
    return {
      ok: true,
      value: JSON.parse(raw)
    };
  } catch (_error) {
    return {
      ok: false,
      error: "invalid_json",
      message: "[ERROR] JSON de Identidad No Válido"
    };
  }
}

export function validateIdentityObject(identity) {
  var errors = [];
  var warnings = [];
  var normalized = identity;

  if (!identity || typeof identity !== "object" || Array.isArray(identity)) {
    errors.push("Identity payload must be a JSON object.");
    return {
      ok: false,
      errors: errors,
      warnings: warnings,
      value: null
    };
  }

  var principal = String(identity.user || identity.upn || identity.account || identity.identity || "").trim();
  if (!principal) {
    warnings.push("Missing principal field (user/upn/account/identity).");
  }

  var hasRole = Boolean(identity.role || identity.directoryRole || identity.privilege || (Array.isArray(identity.roles) && identity.roles.length));
  if (!hasRole) {
    warnings.push("No role field found (role/directoryRole/privilege/roles[]).");
  }

  if (typeof identity.mfa !== "undefined") {
    var mfaRaw = String(identity.mfa).toLowerCase();
    var knownMfa = /^(enabled|disabled|true|false|on|off|yes|no|required|missing|unknown|null|n\/a)$/i.test(mfaRaw);
    if (!knownMfa) {
      warnings.push("Unrecognized mfa value: " + mfaRaw);
    }
  } else {
    warnings.push("mfa field not present.");
  }

  return {
    ok: true,
    errors: errors,
    warnings: warnings,
    value: normalized
  };
}
