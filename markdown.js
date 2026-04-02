const postTitleElement = document.getElementById("postTitle");
const postMetaElement = document.getElementById("postMeta");
const postContentElement = document.getElementById("postContent");

function sanitizePostParam(value) {
  if (!value || typeof value !== "string") {
    return "";
  }

  const cleaned = value.trim().replace(/^\/+/, "").replace(/\.\./g, "");
  return /^[a-zA-Z0-9._-]+\.md$/i.test(cleaned) ? cleaned : "";
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function sanitizeRenderedHtml(rawHtml) {
  const template = document.createElement("template");
  template.innerHTML = rawHtml;

  const allowedTags = new Set([
    "a",
    "article",
    "blockquote",
    "br",
    "code",
    "em",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "hr",
    "img",
    "li",
    "ol",
    "p",
    "pre",
    "strong",
    "ul"
  ]);

  const allowedAttrs = {
    a: new Set(["href", "title", "target", "rel"]),
    img: new Set(["src", "alt", "title"])
  };

  const isSafeUrl = (value, isImage) => {
    if (!value || typeof value !== "string") {
      return false;
    }

    const input = value.trim();
    if (input.startsWith("#") || input.startsWith("/")) {
      return true;
    }

    if (/^(\.\/|\.\.\/)/.test(input)) {
      return true;
    }

    if (/^mailto:/i.test(input) && !isImage) {
      return true;
    }

    if (/^https?:\/\//i.test(input)) {
      return true;
    }

    if (/^data:image\//i.test(input) && isImage) {
      return true;
    }

    return false;
  };

  const walker = document.createTreeWalker(template.content, NodeFilter.SHOW_ELEMENT);
  const elements = [];

  while (walker.nextNode()) {
    elements.push(walker.currentNode);
  }

  for (const element of elements) {
    const tagName = element.tagName.toLowerCase();
    if (!allowedTags.has(tagName)) {
      element.remove();
      continue;
    }

    for (const attrName of element.getAttributeNames()) {
      const attrValue = element.getAttribute(attrName) || "";
      const lowerName = attrName.toLowerCase();
      const lowerValue = attrValue.trim().toLowerCase();

      if (lowerName.startsWith("on")) {
        element.removeAttribute(attrName);
        continue;
      }

      const tagAllowedAttrs = allowedAttrs[tagName] || new Set();
      if (!tagAllowedAttrs.has(lowerName) && lowerName !== "class") {
        element.removeAttribute(attrName);
        continue;
      }

      if (lowerName === "href" && !isSafeUrl(attrValue, false)) {
        element.removeAttribute(attrName);
        continue;
      }

      if (lowerName === "src" && !isSafeUrl(attrValue, true)) {
        element.removeAttribute(attrName);
      }

      if (tagName === "a" && lowerName === "target") {
        element.setAttribute("target", "_blank");
      }

      if (tagName === "a" && (lowerName === "href" || lowerName === "target")) {
        element.setAttribute("rel", "noopener noreferrer");
      }
    }
  }

  return template.innerHTML;
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

function getHeadingTitle(markdownText) {
  const headingMatch = markdownText.match(/^#\s+(.+)$/m);
  return headingMatch ? headingMatch[1].trim() : null;
}

function formatDate(rawDate) {
  if (!rawDate) {
    return "";
  }

  const timestamp = Date.parse(rawDate);
  if (Number.isNaN(timestamp)) {
    return rawDate;
  }

  return new Date(timestamp).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "2-digit"
  });
}

function buildPostUrl(postFileName) {
  return `blog/${encodeURIComponent(postFileName)}`;
}

function resolveRelativeUrl(href, postDirectory) {
  if (!href || /^(https?:|data:|mailto:|#|\/)/i.test(href)) {
    return href;
  }

  const normalizedBase = `/${postDirectory.replace(/^\/+|\/+$/g, "")}/`;
  return new URL(href, `${window.location.origin}${normalizedBase}`).pathname;
}

function configureMarked(postDirectory) {
  const renderer = new marked.Renderer();

  renderer.image = function (href, title, text) {
    const safeHref = resolveRelativeUrl(href, postDirectory);
    const safeTitle = title ? ` title="${escapeHtml(title)}"` : "";
    const safeText = escapeHtml(text || "Imagen");
    return `<img src="${safeHref}" alt="${safeText}"${safeTitle}>`;
  };

  renderer.link = function (href, title, text) {
    const safeHref = resolveRelativeUrl(href, postDirectory);
    const safeTitle = title ? ` title="${escapeHtml(title)}"` : "";
    const external = /^https?:\/\//i.test(href || "");
    const rel = external ? " rel=\"noopener noreferrer\"" : "";
    const target = external ? " target=\"_blank\"" : "";
    return `<a href="${safeHref}"${safeTitle}${target}${rel}>${text}</a>`;
  };

  marked.setOptions({
    renderer,
    breaks: true,
    gfm: true
  });
}

function renderState(message) {
  postMetaElement.textContent = "";
  postTitleElement.textContent = "Blog";
  postContentElement.textContent = "";
  const stateMessage = document.createElement("p");
  stateMessage.className = "state";
  stateMessage.textContent = message;
  postContentElement.appendChild(stateMessage);
}

async function initPost() {
  const params = new URLSearchParams(window.location.search);
  const postParam = sanitizePostParam(params.get("post"));

  if (!postParam) {
    renderState("Falta el parámetro ?post=archivo.md");
    return;
  }

  const postPath = buildPostUrl(postParam);

  let markdownText = "";
  try {
    const response = await fetch(postPath, { cache: "no-store" });
    if (!response.ok) {
      throw new Error("not-found");
    }
    markdownText = await response.text();
  } catch (_error) {
    renderState("No se pudo cargar el post solicitado. Verifica el nombre del archivo en /blog.");
    return;
  }

  const parsed = parseFrontMatter(markdownText);
  const derivedTitle = parsed.data.title || getHeadingTitle(parsed.content) || postParam.replace(/\.md$/i, "");
  const formattedDate = formatDate(parsed.data.date || "");

  postTitleElement.textContent = derivedTitle;
  postMetaElement.textContent = formattedDate ? `Publicado: ${formattedDate}` : "";
  document.title = `${derivedTitle} | SEC_ARCHITECT`;

  configureMarked("blog");
  const rendered = marked.parse(parsed.content);
  postContentElement.innerHTML = sanitizeRenderedHtml(rendered);
}

initPost();
