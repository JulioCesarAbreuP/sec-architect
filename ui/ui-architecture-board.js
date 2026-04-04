const BOARD_FILES = [
  "../ARCHITECTURE.md",
  "../docs/adr/ADR-001-command-center-core.md",
  "../docs/adr/ADR-002-knowledge-base-json.md",
  "../docs/adr/ADR-003-client-side-dashboard.md",
  "../docs/adr/ADR-004-zero-trust-base.md",
  "../docs/adr/ADR-005-modular-architecture.md",
  "../docs/adr/ADR-006-global-namespace-retirement.md",
  "../docs/adr/ADR-007-entra-parser-threat-engine.md"
];

function parseMarkdown(raw) {
  if (window.marked && typeof window.marked.parse === "function") {
    return window.marked.parse(raw);
  }
  return "<pre>" + String(raw || "") + "</pre>";
}

function chooseDoc(question, docs) {
  const q = String(question || "").toLowerCase();
  if (q.includes("entra") || q.includes("parser") || q.includes("threat")) return docs.find((doc) => doc.path.includes("ADR-007"));
  if (q.includes("zero trust")) return docs.find((doc) => doc.path.includes("ADR-004"));
  if (q.includes("modular")) return docs.find((doc) => doc.path.includes("ADR-005"));
  if (q.includes("global")) return docs.find((doc) => doc.path.includes("ADR-006"));
  return docs.find((doc) => doc.path.includes("ADR-001")) || docs[0];
}

export async function loadArchitectureBoard() {
  const docs = [];

  for (const path of BOARD_FILES) {
    try {
      const response = await fetch(path, { cache: "no-store" });
      if (!response.ok) continue;
      const raw = await response.text();
      docs.push({ path, raw, html: parseMarkdown(raw) });
    } catch {
      continue;
    }
  }

  return docs;
}

export function answerArchitectureQuestion(question, docs) {
  const selected = chooseDoc(question, docs || []);
  if (!selected) {
    return {
      title: "Sin decision encontrada",
      html: "<p>No se encontro ADR para la consulta.</p>"
    };
  }

  return {
    title: "Decision vinculada: " + selected.path.split("/").pop(),
    html: selected.html + "<hr><p><strong>Dependencias:</strong> core/*, ui/*, main.js, ARCHITECTURE.md, ADRs.</p>"
  };
}
