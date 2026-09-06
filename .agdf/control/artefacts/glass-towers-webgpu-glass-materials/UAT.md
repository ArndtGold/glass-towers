# UAT: Backendgerechte Glasoptik

Status: pass
Gate: UAT
Approval: approved — user supplied exact `Approval: UAT` on 2026-08-21
Run: `glass-towers-webgpu-glass-materials`
Revision: `382c871d-9fad-451d-b1a9-e59ff4616ef9`
Stand: 2026-08-21
Based on: [approved QA](QA_REPORT.md)

## Ziel

Direkt in einer Chrome-Familie mit WebGPU und in Safari mit WebGL2 bestätigen, dass alle fünf Glasfarben überzeugend unterscheidbar bleiben und der vollständige Spielablauf ohne sichtbare Regression funktioniert. Automatisierte Chromium-/WebKit-Evidenz und der In-App-WebGPU-Nachweis sind Vorbereitung, aber kein Ersatz für diese Nutzerabnahme.

## Vorbereitung

1. Im Projekt `npm run dev -- --host 127.0.0.1` starten.
2. Chrome öffnen: `http://127.0.0.1:5173/?seed=152&palette=1`.
3. Safari öffnen: `http://127.0.0.1:5173/?seed=152&palette=1&renderer=webgl2`.

## Abnahmefälle

| ID | Browser/Profil | Prüfung | Erwartung | Ergebnis |
|---|---|---|---|---|
| UAT-01 | Chrome/WebGPU | Backend-Badge | `WebGPU · High fidelity` sichtbar | pass — durch exakte Nutzerfreigabe bestätigt |
| UAT-02 | Chrome/WebGPU | Fünf-Farben-Ansicht | Cyan, Rosa, Violett, Gelb und Grün gleichzeitig klar unterscheidbar; weiterhin als transluzentes Glas lesbar | pass — durch exakte Nutzerfreigabe bestätigt |
| UAT-03 | Chrome/WebGPU | Normaler Lauf ohne `palette=1` | mindestens Score 3, Überlagerungen bleiben lesbar | pass — durch exakte Nutzerfreigabe bestätigt |
| UAT-04 | Safari/WebGL2 | Backend-Badge | `WebGL2 · Compatible` sichtbar | pass — durch exakte Nutzerfreigabe bestätigt |
| UAT-05 | Safari/WebGL2 | Fünf-Farben-Ansicht | alle fünf Farben gleichzeitig klar unterscheidbar; Reflexionen und Transparenz bleiben sichtbar | pass — durch exakte Nutzerfreigabe bestätigt |
| UAT-06 | Safari/WebGL2 | Normaler Lauf ohne `palette=1` | mindestens Score 3, Game-over und Restart funktionieren | pass — durch exakte Nutzerfreigabe bestätigt |
| UAT-07 | beide | Browserkonsole | keine Error-Logs oder unbehandelten Exceptions | pass — durch exakte Nutzerfreigabe bestätigt |

## Vorbereitende Evidenz

- Echter In-App-WebGPU-Nachweis: `evidence/current-iab-webgpu-five-colors.png`
- Forced-WebGL2-Nachweis: `evidence/chromium-webgl2-five-colors.png`
- Gerenderte paarweise Mindestabstände: 29,25–29,78 bei Schwelle `> 28`
- Finale Regression: Lint, Build, 29 Unit-, 2 Integration- und 32 E2E-Komponententests pass

## Entscheidung

- Der Nutzer hat die vorbereitete Abnahme mit exakt `Approval: UAT` für Revision `382c871d-9fad-451d-b1a9-e59ff4616ef9` am 2026-08-21 freigegeben.
- UAT-01 bis UAT-07 gelten damit als nutzerbestätigt; es wurde keine zusätzliche Browsertelemetrie durch den Agenten erhoben.
- Release, Commit, Push und PR werden durch diese Freigabe nicht autorisiert.
