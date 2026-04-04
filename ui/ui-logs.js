export function pushSocLogs(container, entries) {
  for (const entry of entries) {
    const node = document.createElement("div");
    node.className = "console-line tone-" + (entry.level || "info");
    node.textContent = "[" + new Date().toISOString().slice(11, 19) + "] " + entry.message;
    container.appendChild(node);
  }
  container.scrollTop = container.scrollHeight;
}

export function pushSingleLog(container, message, level) {
  pushSocLogs(container, [{ message, level }]);
}

export function clearLogs(container) {
  container.textContent = "";
}
