(function () {
  var THEME_KEY = "sec_architect_theme";

  function currentTheme() {
    try {
      var saved = localStorage.getItem(THEME_KEY);
      if (saved === "light" || saved === "dark") {
        return saved;
      }
    } catch (_error) {
      // Manteniendo degradacion segura cuando el almacenamiento del navegador esta restringido.
    }
    return "dark";
  }

  function saveTheme(theme) {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (_error) {
      // Evitando fallos de UX cuando la persistencia local no esta disponible por politica del navegador.
    }
  }

  function setTheme(theme) {
    document.body.setAttribute("data-theme", theme);
  }

  function createSvg(pathData, viewBox) {
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    var path = document.createElementNS("http://www.w3.org/2000/svg", "path");

    svg.setAttribute("viewBox", viewBox || "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    svg.classList.add("site-icon", "icon-md");

    path.setAttribute("d", pathData);
    svg.appendChild(path);
    return svg;
  }

  function setThemeButtonIcon(button, theme) {
    button.textContent = "";

    var sunIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    sunIcon.setAttribute("viewBox", "0 0 24 24");
    sunIcon.setAttribute("aria-hidden", "true");
    sunIcon.classList.add("site-icon", "icon-md");

    var sun = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    sun.setAttribute("cx", "12");
    sun.setAttribute("cy", "12");
    sun.setAttribute("r", "4");
    sun.setAttribute("fill", "none");
    sun.setAttribute("stroke", "currentColor");
    sun.setAttribute("stroke-width", "1.8");

    var rays = document.createElementNS("http://www.w3.org/2000/svg", "path");
    rays.setAttribute("d", "M12 2v2.2M12 19.8V22M4.22 4.22l1.56 1.56M18.22 18.22l1.56 1.56M2 12h2.2M19.8 12H22M4.22 19.78l1.56-1.56M18.22 5.78l1.56-1.56");
    rays.setAttribute("fill", "none");
    rays.setAttribute("stroke", "currentColor");
    rays.setAttribute("stroke-width", "1.8");
    rays.setAttribute("stroke-linecap", "round");

    sunIcon.appendChild(sun);
    sunIcon.appendChild(rays);
    button.appendChild(sunIcon);
    button.title = theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro";
    button.setAttribute("aria-pressed", theme === "light" ? "true" : "false");
  }

  function removeHeaderSocialLinks() {
    var links = document.querySelectorAll("header .site-social-link, .header-right .site-social-link, .header-right .footer-linkedin");
    links.forEach(function (link) {
      link.remove();
    });
  }

  function ensureThemeToggle() {
    var existing = document.querySelector(".site-theme-toggle");
    var button = existing || document.createElement("button");

    if (!existing) {
      button.type = "button";
      button.className = "site-theme-toggle";
      button.setAttribute("aria-label", "Cambiar tema");
      document.body.appendChild(button);
    }

    var theme = currentTheme();
    setTheme(theme);
    setThemeButtonIcon(button, theme);

    button.addEventListener("click", function () {
      var next = document.body.getAttribute("data-theme") === "dark" ? "light" : "dark";
      setTheme(next);
      saveTheme(next);
      setThemeButtonIcon(button, next);
    });
  }

  function socialIconPath(type) {
    if (type === "linkedin") {
      return "M20.447 20.452H16.89v-5.569c0-1.328-.024-3.039-1.852-3.039-1.853 0-2.136 1.445-2.136 2.941v5.667H9.345V9h3.414v1.561h.049c.476-.9 1.637-1.85 3.369-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.063 2.063 0 1 1 0-4.126 2.063 2.063 0 0 1 0 4.126zM7.119 20.452H3.556V9h3.563v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z";
    }
    return "M12 .296C5.373.296 0 5.669 0 12.296c0 5.302 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.332-1.754-1.332-1.754-1.089-.744.083-.729.083-.729 1.205.085 1.84 1.236 1.84 1.236 1.07 1.835 2.807 1.305 3.492.998.107-.776.418-1.305.762-1.605-2.665-.304-5.467-1.332-5.467-5.93 0-1.31.467-2.38 1.235-3.22-.124-.303-.536-1.524.117-3.176 0 0 1.008-.323 3.3 1.23a11.49 11.49 0 0 1 3.003-.404c1.018.005 2.043.138 3.003.404 2.29-1.553 3.296-1.23 3.296-1.23.656 1.652.244 2.873.12 3.176.77.84 1.233 1.91 1.233 3.22 0 4.61-2.807 5.624-5.48 5.921.43.372.823 1.102.823 2.222 0 1.606-.015 2.898-.015 3.293 0 .322.216.694.825.576C20.565 22.092 24 17.595 24 12.296 24 5.669 18.627.296 12 .296z";
  }

  function buildSocialLink(url, label, type) {
    var anchor = document.createElement("a");
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    var path = document.createElementNS("http://www.w3.org/2000/svg", "path");

    anchor.href = url;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    anchor.className = "site-social-link";
    anchor.setAttribute("aria-label", label);

    svg.setAttribute("viewBox", "0 0 24 24");
    svg.classList.add("site-icon", "icon-md");
    svg.setAttribute("role", "img");

    path.setAttribute("d", socialIconPath(type));
    svg.appendChild(path);
    anchor.appendChild(svg);

    return anchor;
  }

  function ensureFooter() {
    var footer = document.querySelector("[data-site-footer]");

    if (!footer) {
      footer = document.createElement("footer");
      footer.className = "site-footer";
      footer.setAttribute("data-site-footer", "true");
      document.body.appendChild(footer);
    }

    footer.classList.add("site-footer");

    var links = footer.querySelector(".site-footer-links");
    if (!links) {
      links = document.createElement("div");
      links.className = "site-footer-links";
      footer.appendChild(links);
    }

    links.textContent = "";
    links.appendChild(buildSocialLink("https://www.linkedin.com/in/juliocesarabreup/", "LinkedIn", "linkedin"));
    links.appendChild(buildSocialLink("https://github.com/JulioCesarAbreuP", "GitHub", "github"));
  }

  function init() {
    removeHeaderSocialLinks();
    ensureThemeToggle();
    ensureFooter();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
