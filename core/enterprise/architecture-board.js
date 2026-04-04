const BOARD_FILES = [
  "../ARCHITECTURE.md",
  "../docs/adr/ADR-001-command-center-core.md",
  "../docs/adr/ADR-002-knowledge-base-json.md",
  "../docs/adr/ADR-003-client-side-dashboard.md",
  "../docs/adr/ADR-004-zero-trust-base.md",
  "../docs/adr/ADR-005-modular-architecture.md",
  "../docs/adr/ADR-006-global-namespace-retirement.md"
];

function chooseAdrByQuestion(question, docs) {
  const q = String(question || "").toLowerCase();
  if (q.includes("zero trust")) return docs.find((d) => d.path.includes("ADR-004"));
  if (q.includes("global") || q.includes("namespace")) return docs.find((d) => d.path.includes("ADR-006"));
  if (q.includes("dashboard")) return docs.find((d) => d.path.includes("ADR-003"));
  if (q.includes("modular")) return docs.find((d) => d.path.includes("ADR-005"));
  if (q.includes("json")) return docs.find((d) => d.path.includes("ADR-002"));
  return docs.find((d) => d.path.includes("ADR-001")) || docs[0];
}

export async function loadArchitectureBoardDocs() {
  const docs = [];
  for (const path of BOARD_FILES) {
    try {
      const response = await fetch(path, { cache: "no-store" });
      if (!response.ok) continue;
      const text = await response.text();
      docs.push({
        path,
        raw: text,
        html: window.marked ? window.marked.parse(text) : "<pre>marked.js no cargado</pre>"
      });
    } catch {
      continue;
    }
  }
  return docs;
}

export function answerArchitectureQuestion(question, docs) {
  const target = chooseAdrByQuestion(question, docs || []);
  if (!target) {
    return {
      title: "Sin ADR disponible",
      html: "<p>No se encontro documentacion ADR para responder esta pregunta.</p>"
    };
  }

  return {
    title: "Decision vinculada: " + target.path.split("/").pop(),
    html: target.html
  };
}
