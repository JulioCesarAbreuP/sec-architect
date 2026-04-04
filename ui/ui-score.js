export function renderZeroTrustScore(container, score) {
  const normalized = Math.max(0, Math.min(100, Number(score || 0)));
  const state = normalized >= 80 ? "Healthy" : normalized >= 50 ? "Degraded" : "Critical";
  container.textContent = normalized.toFixed(0) + " / 100 (" + state + ")";
}

export function renderZeroTrustPanel(refs, posture) {
  if (!refs || !posture) return;

  const score = Math.max(0, Math.min(100, Number(posture.score || 0)));
  const status = posture.statusLabel || (score >= 80 ? "Healthy" : score >= 50 ? "Degraded" : "Critical");
  const metrics = posture.metrics || {};
  const findings = Array.isArray(posture.findings) ? posture.findings : [];

  if (refs.zeroTrustScore) {
    refs.zeroTrustScore.textContent = "Zero-Trust Score: " + score.toFixed(0) + " / 100 (" + status + ")";
  }

  if (refs.zeroTrustPanelScore) {
    refs.zeroTrustPanelScore.textContent = score.toFixed(0) + " / 100";
  }

  if (refs.ztMfaCoverage) {
    refs.ztMfaCoverage.textContent = String(metrics.mfaCoverage ?? 0) + "%";
  }

  if (refs.ztPrivilegedProtection) {
    refs.ztPrivilegedProtection.textContent = String(metrics.privilegedRoleCoverage ?? 0) + "%";
  }

  if (refs.ztExposure) {
    refs.ztExposure.textContent = String(metrics.exposureBreadth ?? 0) + "%";
  }

  if (refs.ztPolicyStates) {
    refs.ztPolicyStates.textContent = String(metrics.reportOnlyCount ?? 0) + " report-only / " + String(metrics.disabledCount ?? 0) + " disabled";
  }

  if (refs.ztIntelPressure) {
    refs.ztIntelPressure.textContent = String(metrics.intelPressure ?? 0) + " pts | " + String(metrics.priorityTechnique ?? "n/a");
  }

  if (refs.ztFindings) {
    refs.ztFindings.textContent = findings
      .map((item, index) => {
        const sev = String(item?.severity || "info").toUpperCase();
        const msg = String(item?.message || "No details");
        return String(index + 1) + ". [" + sev + "] " + msg;
      })
      .join("\n");
  }

  if (refs.ztLastUpdated) {
    const date = posture.generatedAt ? new Date(posture.generatedAt) : new Date();
    refs.ztLastUpdated.textContent = "Updated: " + date.toISOString().replace("T", " ").slice(0, 19) + "Z · " + String(metrics.policyCount ?? 0) + " policies";
  }
}
