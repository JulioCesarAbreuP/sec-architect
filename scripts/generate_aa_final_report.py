import datetime
import json
from pathlib import Path


def _score(payload):
    return round((payload["categories"]["accessibility"]["score"] or 0) * 100)


def _fails(payload):
    return [
        key
        for key, audit in payload["audits"].items()
        if audit.get("scoreDisplayMode") == "binary" and audit.get("score") == 0
    ]


def main():
    root = Path("docs/evidence/aa-final-2026-04-04")
    browser_pass = json.loads((root / "browser-pass" / "summary.json").read_text(encoding="utf-8"))
    before_desktop = json.loads((root / "lighthouse-before-desktop.json").read_text(encoding="utf-8"))
    after_desktop = json.loads((root / "lighthouse-after-desktop.json").read_text(encoding="utf-8"))
    before_mobile = json.loads((root / "lighthouse-before-mobile.json").read_text(encoding="utf-8"))
    after_mobile = json.loads((root / "lighthouse-after-mobile.json").read_text(encoding="utf-8"))

    lines = []
    lines.append("# Informe Final AA — Enterprise Command Center")
    lines.append("")
    lines.append("- Generado: " + datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"))
    lines.append("- Browser pass timestamp: " + browser_pass.get("generatedAt", "n/a"))
    lines.append("- Lighthouse before desktop fetch: " + before_desktop.get("fetchTime", "n/a"))
    lines.append("- Lighthouse after desktop fetch: " + after_desktop.get("fetchTime", "n/a"))
    lines.append("- Lighthouse before mobile fetch: " + before_mobile.get("fetchTime", "n/a"))
    lines.append("- Lighthouse after mobile fetch: " + after_mobile.get("fetchTime", "n/a"))
    lines.append("")

    lines.append("## 1) Comparativa Lighthouse Accessibility (before/after)")
    lines.append("")
    lines.append("| Entorno | Before | After | Delta | Hallazgo Before | Hallazgo After |")
    lines.append("|---|---:|---:|---:|---|---|")
    for label, before_payload, after_payload in (
        ("Desktop", before_desktop, after_desktop),
        ("Mobile", before_mobile, after_mobile),
    ):
        before_score = _score(before_payload)
        after_score = _score(after_payload)
        before_failures = ", ".join(_fails(before_payload)) or "none"
        after_failures = ", ".join(_fails(after_payload)) or "none"
        lines.append(
            f"| {label} | {before_score} | {after_score} | {after_score - before_score:+d} | {before_failures} | {after_failures} |"
        )
    lines.append("")

    lines.append("## 2) Evidencia por pantalla (capturas)")
    lines.append("")
    for name in (
        "01-header.png",
        "02-parser.png",
        "03-zero-trust.png",
        "04-threat-intel.png",
        "05-architecture-board.png",
    ):
        lines.append("- docs/evidence/aa-final-2026-04-04/browser-pass/screens/" + name)
    lines.append("")

    lines.append("## 3) Notas de foco / rol / aria (pasada real por teclado)")
    lines.append("")
    lines.append("Muestra de secuencia de foco (after):")
    lines.append("")
    lines.append("| Step | Tag | Id | Role | Aria label | Aria pressed |")
    lines.append("|---:|---|---|---|---|---|")
    for item in browser_pass.get("after", {}).get("focusSequence", [])[:18]:
        lines.append(
            "| {step} | {tag} | {id} | {role} | {aria} | {pressed} |".format(
                step=item.get("step", ""),
                tag=item.get("tag", ""),
                id=item.get("id", ""),
                role=item.get("role", ""),
                aria=(item.get("ariaLabel", "") or "").replace("|", "/"),
                pressed=item.get("ariaPressed", ""),
            )
        )
    lines.append("")

    lines.append("## 4) NVDA / VoiceOver")
    lines.append("")
    lines.append("- VoiceOver: no aplica en Windows.")
    lines.append("- NVDA: instalacion intentada 2 veces via winget y fallida por timeout de descarga (`InternetOpenUrl() failed`, `0x80072ee2`).")
    lines.append("- Se ejecuto pasada real de teclado en Chrome y validacion automatizada ARIA/roles con Lighthouse before/after.")
    lines.append("")

    lines.append("## 5) Artefactos fuente")
    lines.append("")
    lines.append("- docs/evidence/aa-final-2026-04-04/lighthouse-before-desktop.json")
    lines.append("- docs/evidence/aa-final-2026-04-04/lighthouse-after-desktop.json")
    lines.append("- docs/evidence/aa-final-2026-04-04/lighthouse-before-mobile.json")
    lines.append("- docs/evidence/aa-final-2026-04-04/lighthouse-after-mobile.json")
    lines.append("- docs/evidence/aa-final-2026-04-04/browser-pass/summary.json")

    (root / "aa-final-report.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()