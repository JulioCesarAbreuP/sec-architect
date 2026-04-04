export function renderZeroTrustScore(container, score) {
  const normalized = Math.max(0, Math.min(100, Number(score || 0)));
  const state = normalized >= 80 ? "Healthy" : normalized >= 50 ? "Degraded" : "Critical";
  container.textContent = normalized.toFixed(0) + " / 100 (" + state + ")";
}
