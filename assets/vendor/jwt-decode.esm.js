export function jwtDecode(token) {
  const parts = String(token || "").split(".");

  if (parts.length < 2) {
    throw new Error("Invalid JWT format");
  }

  const payload = parts[1]
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const decoded = typeof atob === "function"
    ? atob(payload)
    : Buffer.from(payload, "base64").toString("binary");
  return JSON.parse(decoded);
}
