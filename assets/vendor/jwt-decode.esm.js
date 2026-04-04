export function jwtDecode(token) {
  const parts = String(token || "").split(".");

  if (parts.length < 2) {
    throw new Error("Invalid JWT format");
  }

  const payload = parts[1]
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const decoded = atob(payload);
  return JSON.parse(decoded);
}
