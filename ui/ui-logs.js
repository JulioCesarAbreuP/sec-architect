export function pushSocLogs(container, entries) {
  const count = container.closest
    ? container.closest(".soc-console-container")?.querySelector("#consoleLogCount")
    : null;
  for (const entry of entries) {
    const node = document.createElement("div");
    node.className = "console-line tone-" + (entry.level || "info");
    node.dataset.ts = new Date().toISOString().slice(11, 19);
    node.textContent = entry.message;
    container.appendChild(node);
    if (count) count.textContent = String(Number(count.textContent || "0") + 1);
  }
  container.scrollTop = container.scrollHeight;
}

export function pushSingleLog(container, message, level) {
  pushSocLogs(container, [{ message, level }]);
}

export function clearLogs(container) {
  container.textContent = "";
}
