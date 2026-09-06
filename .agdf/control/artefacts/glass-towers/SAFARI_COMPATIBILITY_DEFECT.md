# Defect: Safari startet den WebGL2-Fallback nicht

- Run: `glass-towers`
- Datum: 20. August 2026
- Status: resolved in automated WebKit regression; real Safari UAT pending
- Route: `design_gap -> SD`

## Reproduktion

1. Anwendung in Safari beziehungsweise Playwright WebKit 26.5 öffnen.
2. WebGPU ist nicht verfügbar oder der Development-Probe erzwingt WebGL2.
3. Die Anwendung zeigt `This sculpture needs WebGPU or WebGL2.`.

## Tatsächliches Verhalten

Three.js 0.185.1 `WebGPURenderer({ forceWebGL: true })` erzeugt in WebKit beim Render-Pipeline-Compile wiederholt `WebGL: INVALID_OPERATION`, meldet einen internen Metal/ANGLE-Compilerfehler und verliert den WebGL-Kontext. Die Runtime endet danach im sichtbaren Compatibility Error.

## Erwartetes Verhalten

Wenn WebGPU nicht verfügbar oder nicht stabil initialisierbar ist, startet dieselbe Anwendung auf einem funktionalen WebGL2-Renderer. Erst wenn auch ein echter WebGL2-Kontext nicht verwendet werden kann, darf der Compatibility Error erscheinen.

## Gegenprobe

In derselben WebKit-26.5-Umgebung rendert Three.js `WebGLRenderer` dieselbe `createSceneBundle`-Szene und dasselbe Glasmaterial auf einem bestätigten `WebGL2RenderingContext` mit `isContextLost() === false` und ohne Konsolenfehler.

## Fixgrenze

- `RendererFactory` bleibt einziger Renderer-Owner.
- WebGPU verwendet weiterhin `WebGPURenderer`.
- Der einzige WebGL2-Fallback verwendet klassischen `WebGLRenderer` hinter derselben `RendererSession`.
- Keine Änderung an Spielzustand, Szene, Physik, Pieces, Eingaben, Scoring oder UI-Semantik.
- Kein User-Agent-Sniffing, Reload oder stiller Retry.

## Finding

| finding_id | gap_type | routing_target | gap_status | evidence | required_next_step |
|---|---|---|---|---|---|
| SAFARI-01 | design_gap | SD | resolved | SD/TP Revision 2 sind freigegeben; `RendererFactory` verwendet klassischen `WebGLRenderer`; 15 Unit-, 2 Integrations- und 12 Chromium-/WebKit-E2E-Fälle bestehen. | Die WebKit-Regression in `npm run test:e2e` erhalten und die Korrektur im realen Safari-UAT bestätigen. |

## Evidenzplan

- WebKit-Test: Auto ohne WebGPU erreicht `aiming` mit Backend `webgl2` und ohne Konsolenfehler.
- WebKit-Test: Forced WebGL2 erreicht `aiming` und kann mindestens ein Piece werten.
- Chromium-Regression: WebGPU/Auto, Forced WebGL2, Failure, Scoring und Restart bleiben grün.
- Unit-Test: WebGPU-Fehler führt genau einmal zum klassischen WebGL2-Adapter; Dispose- und beide-fehlgeschlagen-Pfade werden gezählt.
