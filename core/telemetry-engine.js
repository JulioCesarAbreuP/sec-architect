export function createShadowMonitor(onEvent) {
  let timer = null;
  let risk = 20;

  function nextDelay() {
    if (risk >= 85) return 5000;
    if (risk >= 65) return 10000;
    return 30000;
  }

  function emit() {
    const token = Math.floor(Math.random() * 0xffff).toString(16).toUpperCase().padStart(4, "0");
    const line = risk >= 75
      ? "[THREAT ENGINE] Lateral movement attempt simulated from SPN 0x" + token + " -> KeyVault-Prod"
      : "[INFO] Monitoring Service Principal: 0x" + token + "...";

    onEvent(line, risk);
    timer = setTimeout(emit, nextDelay());
  }

  return {
    start(initialRisk) {
      this.stop();
      risk = Number(initialRisk || 20);
      timer = setTimeout(emit, nextDelay());
    },
    updateRisk(newRisk) {
      risk = Number(newRisk || risk);
    },
    stop() {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    }
  };
}
