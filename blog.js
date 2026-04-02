const postsList = document.getElementById("postsList");

function sanitizeFileName(fileName) {
  const cleaned = fileName.replace(/^\/+/, "").replace(/\.\./g, "").trim();
  return /^[a-zA-Z0-9._-]+\.md$/i.test(cleaned) ? cleaned : "";
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

async function discoverMarkdownFiles() {
  const candidates = new Set();

  // Prefer directory listing when running locally with a server that exposes it.
  try {
    const response = await fetch("blog/");
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
    // Ignore and fallback to manifest below.
  }

  // Fallback for hosts that do not provide directory listing.
  try {
    const manifestResponse = await fetch("blog/posts.json", { cache: "no-store" });
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
    // The blog still works if there is no manifest and no directory listing.
  }

  return Array.from(candidates).map(sanitizeFileName).filter(Boolean);
}

async function loadPostMetadata(fileName) {
  const response = await fetch(`blog/${encodeURIComponent(fileName)}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`No se pudo leer ${fileName}`);
  }

  const markdown = await response.text();
  const parsed = parseFrontMatter(markdown);

  return {
    file: fileName,
    title: parsed.data.title || getTitleFromMarkdown(parsed.content) || fileName.replace(/\.md$/i, ""),
    dateRaw: parsed.data.date || "",
    dateValue: parseDateValue(parsed.data.date || ""),
    dateLabel: formatDate(parsed.data.date || "")
  };
}

function renderEmptyState(message) {
  postsList.textContent = "";
  const item = document.createElement("li");
  item.className = "empty-state";
  item.textContent = message;
  postsList.appendChild(item);
}

function renderPosts(posts) {
  postsList.textContent = "";

  for (const post of posts) {
    const item = document.createElement("li");
    item.className = "post-item";

    const link = document.createElement("a");
    link.className = "post-link";
    link.href = `post.html?post=${encodeURIComponent(post.file)}`;

    const title = document.createElement("span");
    title.className = "post-title";
    title.textContent = post.title;

    const meta = document.createElement("span");
    meta.className = "post-meta";
    meta.textContent = post.dateLabel;

    link.appendChild(title);
    link.appendChild(meta);

    item.appendChild(link);
    postsList.appendChild(item);
  }
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

  renderPosts(posts);
}

initBlog().catch(() => {
  renderEmptyState("No fue posible generar el blog automáticamente. Verifica Live Server y la carpeta /blog.");
});
