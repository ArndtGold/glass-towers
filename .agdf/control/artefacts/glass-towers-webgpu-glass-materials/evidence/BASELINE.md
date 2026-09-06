# Glasmaterial-Baseline

- Baseline commit: `8e1b507a0884b86b8a414f0f3097fd70c298e257`
- Captured: 2026-08-21
- Seed: `152`
- Source: isoliertes `git archive` des Baseline-Commits; der aktive Worktree wurde nicht zurückgesetzt oder verändert
- Renderer: echte In-App-WebGPU-Auswahl für `baseline-webgpu-*`; Forced WebGL2 für `baseline-webgl2-*`
- Console-/Page-Errors: keine in den direkten Baseline-Läufen

## Vorher-Zustände

| Profil | Start | Score 3 / Overlap | High build | Game over |
|---|---|---|---|---|
| WebGPU | `baseline-webgpu-start.png` | `baseline-webgpu-score-3.png` | `baseline-webgpu-high-build.png` | durch nachgelagerte Gameplay-Evidenz abgedeckt |
| WebGL2 | `baseline-webgl2-start.png` | `baseline-webgl2-score-3.png` | `baseline-webgl2-high-build.png` | `baseline-webgl2-game-over.png` |

## Nachher-Zustände

- `chromium-auto-start.png`, `chromium-auto-score-3.png`, `chromium-auto-game-over.png`
- `current-iab-webgpu-start.png`, `current-iab-webgpu-score-3.png` mit sichtbarem Status `WebGPU · High fidelity` und leerem Error-/Warning-Log
- `chromium-webgl2-start.png`, `chromium-webgl2-score-3.png`, `chromium-webgl2-game-over.png`
- entsprechende WebKit-Bilder
- High-build-Nachherbilder und Performancewerte: `../../glass-towers-gallery-environment/evidence/*-high-build.png`, `*-high-stress.png` und `performance-*.json`, erzeugt nach der Materialänderung durch die gemeinsamen Galerie-Budgettests
- automatisierte Readability-Werte: `readability-*.json`

Die Baseline ist Vergleichsevidenz, keine nachträgliche QA-Freigabe des separaten Galerie-Runs.
