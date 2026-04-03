(function () {
  const contactForm = document.getElementById("contactForm");
  const riskPasswordInput = document.getElementById("riskPassword");
  const analyzeRiskButton = document.getElementById("analyzeRiskBtn");
  const riskLevelBadge = document.getElementById("riskLevelBadge");
  const breachCountElement = document.getElementById("breachCount");
  const entropyValueElement = document.getElementById("entropyValue");
  const crackTimeValueElement = document.getElementById("crackTimeValue");
  const mitigationPanel = document.getElementById("mitigationPanel");
  const FORM_TIMEOUT_MS = 10000;
  const MAX_EMPRESA_LENGTH = 100;
  const MAX_EMAIL_LENGTH = 100;
  const MAX_MENSAJE_LENGTH = 1000;

  const RISK = {
    low: "BAJO",
    medium: "MEDIO",
    critical: "CRITICO"
  };

  function sanitizeNumeric(value) {
    const normalized = String(value || "").replace(/[^0-9]/g, "");
    return normalized ? Number.parseInt(normalized, 10) : 0;
  }

  function sanitizeText(value, maxLength) {
    return String(value || "")
      .replace(/[\u0000-\u001F\u007F]/g, "")
      .trim()
      .slice(0, maxLength);
  }

  function isValidEmail(value) {
    if (!value || value.length > MAX_EMAIL_LENGTH) {
      return false;
    }

    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(value);
  }

  function fetchWithTimeout(url, options, timeoutMs) {
    const controller = typeof AbortController === "function" ? new AbortController() : null;
    let timer = null;
    const config = options || {};

    if (controller) {
      config.signal = controller.signal;
      timer = window.setTimeout(function () {
        controller.abort();
      }, timeoutMs || FORM_TIMEOUT_MS);
    }

    return fetch(url, config).finally(function () {
      if (timer) {
        window.clearTimeout(timer);
      }
    });
  }

  function toHex(bytes) {
    return Array.from(bytes)
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase();
  }

  async function sha1Hex(input) {
    const encoded = new TextEncoder().encode(input);
    const digest = await crypto.subtle.digest("SHA-1", encoded);
    return toHex(new Uint8Array(digest));
  }

  // Implementando k-Anonymity para evitar exponer el hash completo en transito.
  async function getBreachCountByKAnonymity(password) {
    const fullHash = await sha1Hex(password);
    const prefix = fullHash.slice(0, 5);
    const suffix = fullHash.slice(5);

    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: {
        "Add-Padding": "true"
      }
    });

    if (!response.ok) {
      throw new Error("hibp-range-request-failed");
    }

    const text = await response.text();
    const lines = text.split("\n");

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) {
        continue;
      }

      const [candidateSuffix, count] = line.split(":");
      // Validando respuesta de brechas para minimizar falsos positivos.
      if (!/^[A-F0-9]{35}$/i.test(candidateSuffix || "") || !/^\d+$/.test(count || "")) {
        continue;
      }

      if (candidateSuffix.toUpperCase() === suffix) {
        return sanitizeNumeric(count);
      }
    }

    return 0;
  }

  function estimateEntropy(password) {
    if (!password) {
      return 0;
    }

    let charsetSize = 0;
    if (/[a-z]/.test(password)) charsetSize += 26;
    if (/[A-Z]/.test(password)) charsetSize += 26;
    if (/[0-9]/.test(password)) charsetSize += 10;
    if (/[^a-zA-Z0-9]/.test(password)) charsetSize += 32;

    if (charsetSize === 0) {
      return 0;
    }

    return Math.log2(Math.pow(charsetSize, password.length));
  }

  // Simulacion educativa: calcula tiempo teorico de crackeo por fuerza bruta, sin ejecutar ataques.
  function estimateCrackTimeFromEntropy(entropyBits) {
    if (entropyBits <= 0) {
      return "No calculable";
    }

    const guessesPerSecond = 1e10;
    const seconds = Math.pow(2, entropyBits) / guessesPerSecond;

    if (!Number.isFinite(seconds) || seconds > 1e15 * 365 * 24 * 3600) {
      return "> 1e15 años";
    }

    const minute = 60;
    const hour = minute * 60;
    const day = hour * 24;
    const year = day * 365;

    if (seconds < 1) return "< 1 segundo";
    if (seconds < minute) return `${Math.round(seconds)} segundos`;
    if (seconds < hour) return `${Math.round(seconds / minute)} minutos`;
    if (seconds < day) return `${Math.round(seconds / hour)} horas`;
    if (seconds < year) return `${Math.round(seconds / day)} dias`;
    return `${Math.round(seconds / year)} años`;
  }

  function classifyRisk(entropyBits, breaches) {
    if (breaches > 0 || entropyBits < 45) {
      return RISK.critical;
    }

    if (entropyBits < 60) {
      return RISK.medium;
    }

    return RISK.low;
  }

  function applyRiskUI(riskLevel) {
    riskLevelBadge.textContent = riskLevel;
    riskLevelBadge.classList.remove("risk-low", "risk-medium", "risk-critical", "risk-neutral");

    if (riskLevel !== RISK.low && riskLevel !== RISK.medium && riskLevel !== RISK.critical) {
      riskLevelBadge.classList.add("risk-neutral");
      mitigationPanel.hidden = true;
      return;
    }

    if (riskLevel === RISK.critical) {
      riskLevelBadge.classList.add("risk-critical");
      mitigationPanel.hidden = false;
      return;
    }

    if (riskLevel === RISK.medium) {
      riskLevelBadge.classList.add("risk-medium");
      mitigationPanel.hidden = true;
      return;
    }

    riskLevelBadge.classList.add("risk-low");
    mitigationPanel.hidden = true;
  }

  async function analyzePasswordRisk() {
    const password = riskPasswordInput.value || "";

    if (!password.trim()) {
      applyRiskUI("Pendiente");
      breachCountElement.textContent = "N/D";
      entropyValueElement.textContent = "N/D";
      crackTimeValueElement.textContent = "N/D";
      mitigationPanel.hidden = true;
      return;
    }

    analyzeRiskButton.disabled = true;
    analyzeRiskButton.textContent = "Analizando...";

    try {
      const entropy = estimateEntropy(password);
      const crackTime = estimateCrackTimeFromEntropy(entropy);
      const breaches = await getBreachCountByKAnonymity(password);
      const risk = classifyRisk(entropy, breaches);

      // Aplicando sanitizacion para evitar inyeccion en el DOM.
      breachCountElement.textContent = String(sanitizeNumeric(breaches));
      entropyValueElement.textContent = `${entropy.toFixed(2)} bits`;
      crackTimeValueElement.textContent = crackTime;
      applyRiskUI(risk);
    } catch (_error) {
      applyRiskUI(RISK.medium);
      breachCountElement.textContent = "No disponible";
      entropyValueElement.textContent = "No disponible";
      crackTimeValueElement.textContent = "No disponible";
      mitigationPanel.hidden = true;
    } finally {
      analyzeRiskButton.disabled = false;
      analyzeRiskButton.textContent = "Evaluar riesgo";
    }
  }

  if (analyzeRiskButton && riskPasswordInput) {
    if (!window.crypto || !window.crypto.subtle) {
      analyzeRiskButton.disabled = true;
      analyzeRiskButton.textContent = "No compatible";
    } else {
      analyzeRiskButton.addEventListener("click", analyzePasswordRisk);
      riskPasswordInput.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
          event.preventDefault();
          analyzePasswordRisk();
        }
      });
    }
  }

  if (contactForm) {
    contactForm.addEventListener("submit", async function (event) {
      event.preventDefault();

      const submitButton = document.getElementById("submitBtn");
      const status = document.getElementById("formStatus");
      const formData = new FormData(contactForm);
      const empresa = sanitizeText(formData.get("empresa"), MAX_EMPRESA_LENGTH);
      const email = sanitizeText(formData.get("email"), MAX_EMAIL_LENGTH);
      const mensaje = sanitizeText(formData.get("mensaje"), MAX_MENSAJE_LENGTH);

      if (formData.get("_hp_filter")) {
        return;
      }

      if (!empresa || !mensaje || !isValidEmail(email)) {
        status.className = "form-status is-visible is-error";
        status.textContent = "Datos inválidos. Revisa empresa, correo y mensaje.";
        return;
      }

      submitButton.disabled = true;
      submitButton.textContent = "ENVIANDO...";
      status.className = "form-status is-visible";
      status.textContent = "Procesando...";

      try {
        const response = await fetchWithTimeout("https://formspree.io/f/mojpjoqk", {
          method: "POST",
          body: JSON.stringify({
            empresa: empresa,
            email: email,
            mensaje: mensaje
          }),
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json"
          },
          mode: "cors",
          credentials: "omit"
        }, FORM_TIMEOUT_MS);

        if (!response.ok) {
          throw new Error("submit-failed");
        }

        status.className = "form-status is-visible is-success";
        status.textContent = "SOLICITUD ENVIADA.";
        contactForm.reset();
      } catch (_error) {
        status.className = "form-status is-visible is-error";
        status.textContent = "ERROR. Reintente.";
        submitButton.disabled = false;
      } finally {
        if (!submitButton.disabled) {
          submitButton.textContent = "Solicitar Consultoría Técnica";
        }
      }
    });
  }
})();
