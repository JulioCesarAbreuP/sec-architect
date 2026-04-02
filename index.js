(function () {
  const contactForm = document.getElementById("contactForm");

  if (contactForm) {
    contactForm.addEventListener("submit", async function (event) {
      event.preventDefault();

      const submitButton = document.getElementById("submitBtn");
      const status = document.getElementById("formStatus");
      const formData = new FormData(contactForm);

      if (formData.get("_hp_filter")) {
        return;
      }

      submitButton.disabled = true;
      submitButton.textContent = "ENVIANDO...";
      status.style.display = "block";
      status.textContent = "Procesando...";

      try {
        const response = await fetch("https://formspree.io/f/mojpjoqk", {
          method: "POST",
          body: JSON.stringify({
            empresa: formData.get("empresa"),
            email: formData.get("email"),
            mensaje: formData.get("mensaje")
          }),
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json"
          }
        });

        if (!response.ok) {
          throw new Error("submit-failed");
        }

        status.style.color = "var(--accent-cyan)";
        status.textContent = "SOLICITUD ENVIADA.";
        contactForm.reset();
      } catch (_error) {
        status.style.color = "#ff4b2b";
        status.textContent = "ERROR. Reintente.";
        submitButton.disabled = false;
      }
    });
  }
})();
