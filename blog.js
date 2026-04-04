
const postsList = document.getElementById("postsList");
const postsPagination = document.getElementById("postsPagination");
const postsTagFilters = document.getElementById("postsTagFilters");
const isNestedBlogIndex = /\/blog\/(?:index\.html)?$/i.test(window.location.pathname);
const FETCH_TIMEOUT_MS = 8000;
const MAX_MARKDOWN_FILES = 200;
const MAX_POST_BYTES = 500000;
const POSTS_PER_PAGE = 5;
const prefersReducedMotion = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Category filter UI
let postsCategoryFilters = null;
document.addEventListener("DOMContentLoaded", () => {
  // Trusted Types: Definir policy mínima para sinks controlados
  if (window.trustedTypes && !window.trustedTypes.getPolicy("defaultPolicy")) {
    window.trustedTypes.createPolicy("defaultPolicy", {
      createHTML: (input) => input,
      createScript: (input) => input,
      createScriptURL: (input) => input
    });
  }
  // Insert category filter nav after tag filters
  const tagNav = document.getElementById("postsTagFilters");
  if (tagNav && !document.getElementById("postsCategoryFilters")) {
    postsCategoryFilters = document.createElement("nav");
    postsCategoryFilters.id = "postsCategoryFilters";
    postsCategoryFilters.className = "category-filters";
    postsCategoryFilters.setAttribute("aria-label", "Filtros por categoría");
    tagNav.insertAdjacentElement("afterend", postsCategoryFilters);
  } else {
    postsCategoryFilters = document.getElementById("postsCategoryFilters");
  }
});

function resolveBlogPath(fileName) {
  return isNestedBlogIndex ? fileName : `blog/${fileName}`;
}

function buildPostLink(fileName) {
  const staticRoutes = {
    "identidad-vs-cuenta.md": "blog/identidad-vs-cuenta/",
    "identidad-y-cuenta.md": "blog/identidad-y-cuenta/",
    "sabsa-ig4-command-center.md": "blog/sabsa-ig4-command-center/"
  };

  const staticTarget = staticRoutes[fileName];
  if (staticTarget) {
    return isNestedBlogIndex ? `../${staticTarget.replace(/^blog\//, "")}` : staticTarget;
  }

  const fallbackTarget = `post.html?post=${encodeURIComponent(fileName)}`;
  return isNestedBlogIndex ? `../${fallbackTarget}` : fallbackTarget;
}

function sanitizeFileName(fileName) {
  const cleaned = fileName.replace(/^\/+/, "").replace(/\.\./g, "").trim();
  return /^[a-zA-Z0-9._-]+\.md$/i.test(cleaned) ? cleaned : "";
}

function fetchWithTimeout(url, options, timeoutMs) {
  const controller = typeof AbortController === "function" ? new AbortController() : null;
  let timer = null;
  const config = options || {};

  if (controller) {
    config.signal = controller.signal;
    timer = window.setTimeout(() => controller.abort(), timeoutMs || FETCH_TIMEOUT_MS);
  }

  return fetch(url, config).finally(() => {
    if (timer) {
      window.clearTimeout(timer);
    }
  });
}

function parseFrontMatter(markdownText) {
  const frontMatterPattern = /^---\s*\n([\s\S]*?)\n---\s*\n?/;
  const match = markdownText.match(frontMatterPattern);

  if (!match) {
    return { data: {}, content: markdownText };
  }

  const data = {};
  const lines = match[1].split("\n");

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf(":");
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim().toLowerCase();
    const value = line.slice(separatorIndex + 1).trim();
    data[key] = value;
  }

  return {
    data,
    content: markdownText.slice(match[0].length)
  };
}

function getTitleFromMarkdown(markdownText) {
  const headingMatch = markdownText.match(/^#\s+(.+)$/m);
  return headingMatch ? headingMatch[1].trim() : null;
}

function parseDateValue(rawDate) {
  if (!rawDate) {
    return Number.NEGATIVE_INFINITY;
  }

  const timestamp = Date.parse(rawDate);
  return Number.isNaN(timestamp) ? Number.NEGATIVE_INFINITY : timestamp;
}

function formatDate(rawDate) {
  if (!rawDate) {
    return "SIN FECHA";
  }

  const timestamp = Date.parse(rawDate);
  if (Number.isNaN(timestamp)) {
    return rawDate;
  }

  return new Date(timestamp).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "short",
    day: "2-digit"
  }).toUpperCase();
}

function parseTags(rawTags) {
  if (!rawTags || typeof rawTags !== "string") {
    return [];
  }

  const normalized = rawTags.replace(/^\[/, "").replace(/\]$/, "");
  const tags = normalized
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean)
    .map((tag) => tag.replace(/[^a-z0-9- ]/gi, "").trim())
    .filter(Boolean);

  return Array.from(new Set(tags));
}

function formatTagLabel(tag) {
  if (!tag) {
    return "";
  }

  return tag
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

async function discoverMarkdownFiles() {
  const candidates = new Set();

  try {
    const manifestResponse = await fetchWithTimeout(resolveBlogPath("posts.json"), { cache: "no-store" }, FETCH_TIMEOUT_MS);
    if (manifestResponse.ok) {
      const manifest = await manifestResponse.json();
      if (Array.isArray(manifest)) {
        for (const entry of manifest) {
          if (typeof entry === "string" && /\.md$/i.test(entry)) {
            candidates.add(entry);
          }
          if (entry && typeof entry === "object" && typeof entry.file === "string" && /\.md$/i.test(entry.file)) {
            candidates.add(entry.file);
          }
        }
      }
    }
  } catch (_error) {
    // Aplicando ruta de contingencia para mantener descubrimiento de posts si falla el manifiesto.
  }

  // Validando listado de directorio como fuente secundaria para preservar compatibilidad con posts.json y servidores locales.
  try {
    const response = await fetchWithTimeout(isNestedBlogIndex ? "./" : "blog/", { cache: "no-store" }, FETCH_TIMEOUT_MS);
    if (response.ok) {
      const html = await response.text();
      const doc = new DOMParser().parseFromString(html, "text/html");
      const links = Array.from(doc.querySelectorAll("a[href]"));

      for (const link of links) {
        const href = link.getAttribute("href") || "";
        if (/\.md$/i.test(href)) {
          const cleanHref = href.replace(/^\.\//, "");
          const fileName = cleanHref.includes("/") ? cleanHref.split("/").pop() : cleanHref;
          if (fileName) {
            candidates.add(fileName);
          }
        }
      }
    }
  } catch (_error) {
    // Preservando continuidad operativa del blog cuando el servidor no expone index de directorio.
  }

  return Array.from(candidates).map(sanitizeFileName).filter(Boolean).slice(0, MAX_MARKDOWN_FILES);
}

// Calcula el tiempo estimado de lectura en minutos (palabras/200, mínimo 1 min)
function estimateReadingTime(text) {
  const words = (text || "").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

async function loadPostMetadata(fileName) {
  const response = await fetchWithTimeout(resolveBlogPath(encodeURIComponent(fileName)), { cache: "no-store" }, FETCH_TIMEOUT_MS);
  if (!response.ok) {
    throw new Error(`No se pudo leer ${fileName}`);
  }

  const markdown = await response.text();
  if (markdown.length > MAX_POST_BYTES) {
    throw new Error(`Post demasiado grande: ${fileName}`);
  }
  const parsed = parseFrontMatter(markdown);
  const readingTime = estimateReadingTime(parsed.content);

  return {
    file: fileName,
    title: parsed.data.title || getTitleFromMarkdown(parsed.content) || fileName.replace(/\.md$/i, ""),
    dateRaw: parsed.data.date || "",
    dateValue: parseDateValue(parsed.data.date || ""),
    dateLabel: formatDate(parsed.data.date || ""),
    tags: parseTags(parsed.data.tags || ""),
    readingTime
  };
}

// Trusted Types: Reemplazo seguro de sinks para innerHTML/textContent
function renderEmptyState(message) {
  postsList.textContent = "";
  if (postsPagination) {
    postsPagination.textContent = "";
  }
  if (postsTagFilters) {
    postsTagFilters.textContent = "";
  }
  const item = document.createElement("li");
  item.className = "empty-state";
  // Trusted Types: No se usa innerHTML, solo textContent seguro
  item.textContent = message;
  postsList.appendChild(item);
}

function renderPosts(posts) {
  postsList.textContent = "";
  posts.forEach((post, index) => {
    const item = document.createElement("li");
    item.className = "post-item post-enter";
    item.style.setProperty("--stagger-index", String(index));

    const link = document.createElement("a");
    link.className = "post-link";
    link.href = buildPostLink(post.file);

    const title = document.createElement("span");
    title.className = "post-title";
    // Trusted Types: Asignación segura, no se usa innerHTML
    title.textContent = post.title;

    const meta = document.createElement("span");
    meta.className = "post-meta";
    // Trusted Types: Asignación segura, no se usa innerHTML
    meta.textContent = post.dateLabel;

    // Tiempo de lectura
    const reading = document.createElement("span");
    reading.className = "post-reading-time";
    // Trusted Types: Asignación segura, no se usa innerHTML
    reading.textContent = `· ${post.readingTime} min lectura`;

    // Category label
    const category = post.category || post.Category || "";
    let categoryLabel = null;
    if (category) {
      categoryLabel = document.createElement("span");
      categoryLabel.className = "post-category";
      // Trusted Types: Asignación segura, no se usa innerHTML
      categoryLabel.textContent = `· ${category}`;
      meta.appendChild(categoryLabel);
    }

    link.appendChild(title);
    link.appendChild(meta);
    link.appendChild(reading);

    item.appendChild(link);
    postsList.appendChild(item);
  });
  animatePostEntries(postsList.querySelectorAll(".post-enter"));
}

function renderPagination(totalPosts, currentPage, onNavigate) {
  if (!postsPagination) {
    return;
  }

  postsPagination.textContent = "";

  const totalPages = Math.max(1, Math.ceil(totalPosts / POSTS_PER_PAGE));
  if (totalPages <= 1) {
    return;
  }

  const previousButton = document.createElement("button");
  previousButton.type = "button";
  previousButton.className = "pagination-button";
  previousButton.textContent = "Anterior";
  previousButton.disabled = currentPage === 1;
  previousButton.addEventListener("click", () => onNavigate(currentPage - 1));

  const status = document.createElement("span");
  status.className = "pagination-status";
  status.setAttribute("aria-live", "polite");
  status.textContent = `Pagina ${currentPage} de ${totalPages}`;

  const nextButton = document.createElement("button");
  nextButton.type = "button";
  nextButton.className = "pagination-button";
  nextButton.textContent = "Siguiente";
  nextButton.disabled = currentPage === totalPages;
  nextButton.addEventListener("click", () => onNavigate(currentPage + 1));

  postsPagination.appendChild(previousButton);
  postsPagination.appendChild(status);
  postsPagination.appendChild(nextButton);
}

function renderPaginatedPosts(posts) {
  if (!Array.isArray(posts) || posts.length === 0) {
    renderEmptyState("No hay articulos disponibles.");
    return;
  }

  const totalPages = Math.max(1, Math.ceil(posts.length / POSTS_PER_PAGE));
  let currentPage = 1;

  const updatePage = (requestedPage) => {
    currentPage = Math.min(totalPages, Math.max(1, requestedPage));
    const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
    const visiblePosts = posts.slice(startIndex, startIndex + POSTS_PER_PAGE);

    renderPosts(visiblePosts);
    renderPagination(posts.length, currentPage, updatePage);
  };

  updatePage(currentPage);
}

function renderTagFilters(posts, activeTag, onSelectTag) {
  if (!postsTagFilters) {
    return;
  }
  postsTagFilters.textContent = "";
  const availableTags = Array.from(new Set(posts.flatMap((post) => post.tags || []))).sort((a, b) => a.localeCompare(b, "es"));
  if (availableTags.length === 0) {
    return;
  }
  const allButton = document.createElement("button");
  allButton.type = "button";
  allButton.className = "tag-filter-button";
  allButton.setAttribute("aria-pressed", activeTag ? "false" : "true");
  allButton.textContent = "Todos";
  if (!activeTag) {
    allButton.classList.add("is-active");
  }
  allButton.addEventListener("click", () => onSelectTag(""));
  postsTagFilters.appendChild(allButton);
  for (const tag of availableTags) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "tag-filter-button";
    button.textContent = formatTagLabel(tag);
    const isActive = activeTag === tag;
    button.setAttribute("aria-pressed", isActive ? "true" : "false");
    if (isActive) {
      button.classList.add("is-active");
    }
    button.addEventListener("click", () => onSelectTag(tag));
    postsTagFilters.appendChild(button);
  }
}

function renderCategoryFilters(posts, activeCategory, onSelectCategory) {
  if (!postsCategoryFilters) {
    postsCategoryFilters = document.getElementById("postsCategoryFilters");
    if (!postsCategoryFilters) return;
  }
  postsCategoryFilters.textContent = "";
  const availableCategories = Array.from(new Set(posts.map((post) => post.category || post.Category || "").filter(Boolean))).sort((a, b) => a.localeCompare(b, "es"));
  if (availableCategories.length === 0) {
    return;
  }
  const allButton = document.createElement("button");
  allButton.type = "button";
  allButton.className = "category-filter-button";
  allButton.setAttribute("aria-pressed", activeCategory ? "false" : "true");
  allButton.textContent = "Todas";
  if (!activeCategory) {
    allButton.classList.add("is-active");
  }
  allButton.addEventListener("click", () => onSelectCategory(""));
  postsCategoryFilters.appendChild(allButton);
  for (const category of availableCategories) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "category-filter-button";
    button.textContent = category;
    const isActive = activeCategory === category;
    button.setAttribute("aria-pressed", isActive ? "true" : "false");
    if (isActive) {
      button.classList.add("is-active");
    }
    button.addEventListener("click", () => onSelectCategory(category));
    postsCategoryFilters.appendChild(button);
  }
}

function animatePostEntries(elements) {
  if (!elements || elements.length === 0) {
    return;
  }

  if (prefersReducedMotion) {
    elements.forEach((element) => {
      element.classList.add("is-visible");
    });
    return;
  }

  requestAnimationFrame(() => {
    elements.forEach((element) => {
      element.classList.add("is-visible");
    });
  });
}

function animateFeaturedPost() {
  const featured = document.querySelector("article.post-item");
  if (!featured) {
    return;
  }

  featured.classList.add("post-enter");
  featured.style.setProperty("--stagger-index", "0");
  animatePostEntries([featured]);
}

async function initBlog() {
  if (!postsList) {
    return;
  }

  renderEmptyState("Buscando artículos...");

  const files = await discoverMarkdownFiles();
  if (files.length === 0) {
    renderEmptyState("No se encontraron archivos .md en /blog. Agrega posts y recarga.");
    return;
  }

  const loaded = await Promise.allSettled(files.map(loadPostMetadata));
  const posts = loaded
    .filter((result) => result.status === "fulfilled")
    .map((result) => result.value)
    .sort((a, b) => b.dateValue - a.dateValue || a.title.localeCompare(b.title, "es"));

  if (posts.length === 0) {
    renderEmptyState("Se detectaron archivos pero no pudieron leerse. Revisa rutas y permisos del servidor local.");
    return;
  }

  const state = {
    activeTag: "",
    activeCategory: ""
  };

  const updateView = () => {
    let filteredPosts = posts;
    if (state.activeCategory) {
      filteredPosts = filteredPosts.filter((post) => (post.category || post.Category || "") === state.activeCategory);
    }
    if (state.activeTag) {
      filteredPosts = filteredPosts.filter((post) => Array.isArray(post.tags) && post.tags.includes(state.activeTag));
    }
    if (filteredPosts.length === 0) {
      postsList.textContent = "";
      const item = document.createElement("li");
      item.className = "empty-state";
      item.textContent = state.activeCategory
        ? "No hay artículos para la categoría seleccionada."
        : "No hay artículos para el tag seleccionado.";
      postsList.appendChild(item);
      if (postsPagination) {
        postsPagination.textContent = "";
      }
    } else {
      renderPaginatedPosts(filteredPosts);
    }
    renderCategoryFilters(posts, state.activeCategory, (category) => {
      state.activeCategory = category;
      updateView();
    });
    renderTagFilters(posts, state.activeTag, (tag) => {
      state.activeTag = tag;
      updateView();
    });
  };
  updateView();
}

animateFeaturedPost();

initBlog().catch(() => {
  renderEmptyState("No fue posible generar el blog automáticamente. Verifica Live Server y la carpeta /blog.");
});
