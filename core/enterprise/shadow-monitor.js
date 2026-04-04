function buildMonitorLine(risk) {
  const id = Math.floor(Math.random() * 0xffff).toString(16).toUpperCase().padStart(4, "0");
  if (risk >= 75) {
    return "[THREAT ENGINE] Lateral movement attempt simulated from SPN 0x" + id + " -> KeyVault-Prod";
  }
  return "[INFO] Monitoring Service Principal: 0x" + id + "...";
}

export function createShadowMonitor(onEvent) {
  let timer = null;
  let currentRisk = 20;

  function nextDelay() {
    if (currentRisk >= 85) return 5000;
    if (currentRisk >= 65) return 10000;
    return 30000;
  }

  function tick() {
    onEvent(buildMonitorLine(currentRisk), currentRisk);
    timer = setTimeout(tick, nextDelay());
  }

  return {
    start(initialRisk) {
      currentRisk = Number(initialRisk || 20);
      this.stop();
      timer = setTimeout(tick, nextDelay());
    },
    updateRisk(risk) {
      currentRisk = Number(risk || currentRisk);
    },
    stop() {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    }
  };
}
