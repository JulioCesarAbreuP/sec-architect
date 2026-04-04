(function (w) {
  "use strict";

  function createRequestId() {
    if (w.crypto && typeof w.crypto.randomUUID === "function") {
      return w.crypto.randomUUID();
    }

    return "req-" + Date.now() + "-" + Math.floor(Math.random() * 1000000);
  }

  async function invokeCopilot(prompt, metadata) {
    var startedAt = Date.now();
    var startedAtIso = new Date(startedAt).toISOString();
    var requestId = createRequestId();
    var meta = metadata || {};

    if (!prompt || !String(prompt).trim()) {
      return {
        ok: false,
        source: "adapter",
        error: "empty_prompt",
        message: "No se puede invocar IA sin un prompt valido.",
        requestId: requestId,
        startedAt: startedAtIso,
        metadata: meta,
        durationMs: 0
      };
    }

    if (!w.copilot || typeof w.copilot.invoke !== "function") {
      return {
        ok: false,
        source: "adapter",
        error: "copilot_unavailable",
        message: "window.copilot.invoke no disponible en este entorno.",
        requestId: requestId,
        startedAt: startedAtIso,
        metadata: meta,
        prompt: String(prompt),
        durationMs: Date.now() - startedAt
      };
    }

    try {
      var output = await w.copilot.invoke(String(prompt));
      return {
        ok: true,
        source: "copilot",
        requestId: requestId,
        startedAt: startedAtIso,
        metadata: meta,
        prompt: String(prompt),
        output: output,
        durationMs: Date.now() - startedAt
      };
    } catch (error) {
      return {
        ok: false,
        source: "copilot",
        error: "invoke_failed",
        message: error && error.message ? error.message : "Error desconocido en invocacion IA.",
        requestId: requestId,
        startedAt: startedAtIso,
        metadata: meta,
        prompt: String(prompt),
        durationMs: Date.now() - startedAt
      };
    }
  }

  w.SECArchitectAI = w.SECArchitectAI || {};
  w.SECArchitectAI.invokeCopilot = invokeCopilot;
})(window);
