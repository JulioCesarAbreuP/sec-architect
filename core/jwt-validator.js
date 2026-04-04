import { jwtDecode } from "../assets/vendor/jwt-decode.esm.js";

export function decodeJwt(token) {
  const normalized = String(token || "").trim();

  if (!normalized) {
    return {
      ok: false,
      error: "empty_token",
      message: "Debes proporcionar un JWT."
    };
  }

  try {
    const decoded = jwtDecode(normalized);
    return {
      ok: true,
      claims: decoded
    };
  } catch (error) {
    return {
      ok: false,
      error: "invalid_token",
      message: error.message
    };
  }
}

export function validateSc300Claims(decodedClaims) {
  const claims = decodedClaims || {};
  const amr = Array.isArray(claims.amr) ? claims.amr : [];
  const exp = Number(claims.exp || 0);
  const nowEpoch = Math.floor(Date.now() / 1000);
  const isExpired = exp > 0 ? exp <= nowEpoch : false;
  const hasMfa = amr.includes("mfa");

  return {
    scp: claims.scp || "",
    roles: Array.isArray(claims.roles) ? claims.roles : [],
    exp: exp || null,
    expIso: exp ? new Date(exp * 1000).toISOString() : null,
    amr,
    hasMfa,
    isExpired,
    commandCenterStatus: hasMfa && !isExpired ? "pass" : "fail"
  };
}
