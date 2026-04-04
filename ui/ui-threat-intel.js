function formatTimestamp(value) {
  if (!value) return "n/a";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "n/a";
  return date.toISOString().replace("T", " ").slice(0, 19) + "Z";
}

function formatTopTechniques(summary) {
  const top = Array.isArray(summary?.topTechniques) ? summary.topTechniques : [];
  if (!top.length) {
    return "No techniques yet.";
  }

  return top
    .map((entry, index) => {
      return String(index + 1) + ". " + entry.id + " | confidence=" + entry.risk + "/100";
    })
    .join("\n");
}

function formatTrend(history) {
  const points = Array.isArray(history) ? history : [];
  if (!points.length) {
    return {
      label: "stable",
      text: "No trend data yet."
    };
  }

  const values = points.map((entry) => Number(entry?.risk || 0));
  const first = values[0];
  const last = values[values.length - 1];
  const delta = last - first;

  let label = "stable";
  if (delta > 3) label = "up";
  if (delta < -3) label = "down";

  const text = points
    .map((entry) => {
      return formatTimestamp(entry?.at) + " | " + String(entry?.technique || "n/a") + " | " + String(entry?.risk || 0) + "/100";
    })
    .join("\n");

  return { label, text };
}

function formatTimeline(events) {
  const timeline = Array.isArray(events) ? events : [];
  if (!timeline.length) {
    return "No timeline events yet.";
  }

  return timeline
    .map((event) => {
      const at = formatTimestamp(event?.at);
      const source = String(event?.source || "unknown").toUpperCase();
      const message = String(event?.message || "No details");
      return at + " | " + source + " | " + message;
    })
    .join("\n");
}

export function renderThreatIntelPanel(refs, state) {
  if (!refs || !state) return;

  const summary = state.summary || {};
  const trend = formatTrend(state.history);

  if (refs.tiStatus) {
    const top = summary?.topTechnique?.id || "n/a";
    const score = Number(summary?.topTechnique?.risk || 0);
    refs.tiStatus.textContent = "Feed: active | top=" + top + " (" + score + "/100)";
  }

  if (refs.tiLastUpdated) {
    refs.tiLastUpdated.textContent = "Updated: " + formatTimestamp(summary.generatedAt);
  }

  if (refs.tiTopTechniqueCount) {
    refs.tiTopTechniqueCount.textContent = String(Array.isArray(summary.topTechniques) ? summary.topTechniques.length : 0);
  }

  if (refs.tiTrendDirection) {
    refs.tiTrendDirection.textContent = trend.label;
  }

  if (refs.tiScoreInfluence) {
    refs.tiScoreInfluence.textContent = String(state.intelPressure || 0) + " pts";
  }

  if (refs.tiTopTechniques) {
    refs.tiTopTechniques.textContent = formatTopTechniques(summary);
  }

  if (refs.tiConfidenceTrend) {
    refs.tiConfidenceTrend.textContent = trend.text;
  }

  if (refs.tiTimeline) {
    refs.tiTimeline.textContent = formatTimeline(state.timeline);
  }
}
