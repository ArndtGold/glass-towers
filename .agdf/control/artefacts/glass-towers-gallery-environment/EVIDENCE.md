# Evidenzregister: Verfeinerte Galerieumgebung

Status: vollständig für QA
Run: `glass-towers-gallery-environment`
Stand: 2026-08-20
Bezug: [TP](TP.md), [PRD](PRD.md), [SD](SD.md)

## Implementierte Oberfläche

- Eine einzige benannte `gallery-environment`-Gruppe ersetzt Plane-Backdrop und grobe Seitenpaneele.
- Bodenvolumen, abgerundeter Sockel, volumetrischer Rückraum, Seitenfassungen, Pfeiler, Laibungen, Lichtfelder und statische Kontaktflächen bilden eine vollständig gerenderte 3D-Umgebung.
- `createMaterials.ts` erzeugt lokale, deterministische Albedo-, Rauheits-, Normal-, Soft-Shadow- und optionale Reflexionstexturen.
- WebGPU verwendet das `high`-Profil mit Physical-Glas, Reflexionsumgebung und Flächenlichtern. WebGL2 verwendet das `compatible`-Profil mit Standard-PBR-Glas, direkter Studiobeleuchtung und ohne optionale Reflexionsumgebung.
- Das WebGPU-High-Profil initialisiert die von Three.js verlangten LTC-Lookup-Texturen für `RectAreaLightNode` genau einmal am Galerie-Licht-Owner.
- Galerie, Kamera, Renderer, Frame Loop, Physik und Spielzustand behalten ihre vorhandenen kanonischen Owner.

## Automatisierte Prüfungen

| Prüfung | Ergebnis | Evidenz |
|---|---|---|
| `npm run lint` | pass | keine ESLint-Befunde |
| `npm run test` | pass | 8 Dateien, 21 Unit-Tests; inklusive idempotenter LTC-Initialisierung |
| `npm run test:integration` | pass | 1 Datei, 2 Integrationstests |
| `npm run build` | pass | TypeScript und Vite-Build; nur nicht blockierende bestehende Chunkgrößenwarnung |
| bestehende Performance-Suite | pass | 4/4 Auto-/Forced-WebGL2-Fälle über Chromium und WebKit |
| bestehende Gameplay-Suite | pass | 8/8 Fälle über Chromium und WebKit |
| neue Galerie-/Lifecycle-Suite | pass | 8/8 Desktop-/Mobilfälle über Auto und Forced WebGL2; mittlere Canvas-Helligkeit > 35 verhindert nahezu schwarze Frames |
| neue Galerie-Performance-Suite | pass | 4/4 isolierte 20-Body-Messungen |
| kanonischer `npm run test:e2e` | pass | 24 Browserfälle in den fünf unveränderten beziehungsweise ergänzten Befehlsblöcken |
| nachgelagerte Screenshot-Ergänzung | pass | betroffene `galleryPerformance.spec.ts` erneut 4/4; danach Lint, Unit, Integration und Build erneut pass |

Alle Browserfälle sammeln `console.error` und `pageerror`; die bestandenen Läufe enthalten keine entsprechenden Fehler. Die Galerie-Suite erfasst `image`, `media` und `fetch` und weist keine neue externe Galerie-Ressource aus.

## Browser- und Zustandsevidenz

| Projekt / Modus | Tatsächliches automatisiertes Profil | Desktop | Mobil | Hochbau / Stress | Fehlerstatus |
|---|---|---|---|---|---|
| Chromium Auto | WebGL2 / `compatible` auf diesem Host | Start, Score 3, Game over | Score 1 bei `390×844` | früher Hochbau und 10-Sekunden-Stress | 0 Console/Page Errors |
| Chromium Forced WebGL2 | WebGL2 / `compatible` | Start, Score 3, Game over | Score 1 bei `390×844` | früher Hochbau und 10-Sekunden-Stress | 0 Console/Page Errors |
| WebKit Auto | WebGL2 / `compatible` auf diesem Host | Start, Score 3, Game over | Score 1 bei `390×844` | früher Hochbau und 10-Sekunden-Stress | 0 Console/Page Errors |
| WebKit Forced WebGL2 | WebGL2 / `compatible` | Start, Score 3, Game over | Score 1 bei `390×844` | früher Hochbau und 10-Sekunden-Stress | 0 Console/Page Errors |

Benannte PNG-Evidenz liegt vollständig unter [`evidence/`](evidence/). Die Dateien folgen dem Muster `<projekt>-<modus>-<viewport>-<zustand>.png` und umfassen `start`, `score-3`, `game-over`, `score-1`, `high-build` und `high-stress`.

## Performance- und Ressourcenbudgets

| Projekt / Modus | p95 Work | p95 Frame beobachtend | Draw Calls | Geometrien | Materialien | Texturbytes |
|---|---:|---:|---:|---:|---:|---:|
| Chromium Auto | 3,8 ms | 183,3 ms | 11 | 11 | 6 | 61.440 |
| Chromium WebGL2 | 3,6 ms | 199,9 ms | 11 | 11 | 6 | 61.440 |
| WebKit Auto | 2,0 ms | 23,0 ms | 11 | 11 | 6 | 61.440 |
| WebKit WebGL2 | 2,0 ms | 22,0 ms | 11 | 11 | 6 | 61.440 |
| TP-Grenze | ≤ 33,3 ms | beobachtend | ≤ 28 | ≤ 14 | ≤ 8 | < 4.194.304 |

Chromium-Headless drosselt die rAF-Intervalle sichtbar; gemäß TP ist p95 Frame deshalb beobachtend. Die blockierende p95-Arbeitszeit besteht in allen vier Fällen deutlich.

## Lifecycle und Isolation

- Drei Restarts innerhalb derselben Auto-Session lassen Galerieinstanz, Canvaszahl und Ressourcenzähler unverändert.
- Unit-Tests beweisen idempotente Backendkonfiguration und Dispose genau einmal für Material-, Textur- und SceneBundle-Ressourcen.
- Bestehende Gameplaytests beweisen Score, Bestwert, Game over, Restart, Reload sowie Maus-, Touch- und Tastatureingabe.
- Der Galerie-Builder erzeugt keine Collider- oder Physikmetadaten.
- Die fünf geschützten Safari-Pfade stimmen weiterhin exakt mit der Brownfield-Baseline überein:

| Pfad | Worktree-Diff-Hash | Index-Diff-Hash |
|---|---|---|
| `playwright.config.ts` | `e69de29bb2d1d6434b8b29ae775ad8c2e48c5391` | `e69de29bb2d1d6434b8b29ae775ad8c2e48c5391` |
| `src/game/rendering/RendererFactory.ts` | `e69de29bb2d1d6434b8b29ae775ad8c2e48c5391` | `e69de29bb2d1d6434b8b29ae775ad8c2e48c5391` |
| `tests/e2e/gameplay.spec.ts` | `e69de29bb2d1d6434b8b29ae775ad8c2e48c5391` | `e69de29bb2d1d6434b8b29ae775ad8c2e48c5391` |
| `tests/e2e/performance.spec.ts` | `e69de29bb2d1d6434b8b29ae775ad8c2e48c5391` | `e69de29bb2d1d6434b8b29ae775ad8c2e48c5391` |
| `tests/unit/rendererFactory.test.ts` | `e69de29bb2d1d6434b8b29ae775ad8c2e48c5391` | `e69de29bb2d1d6434b8b29ae775ad8c2e48c5391` |

## QA- und UAT-Grenze

Die reale Chrome-Vorprüfung des Nutzers zeigte vor der Remediation eine nahezu schwarze WebGPU-Szene; Forced WebGL2 war im selben Browser korrekt. Die Ursache wurde mit der fehlenden Three.js-LTC-Initialisierung behoben und durch Unit- sowie Canvas-Luminanztests abgesichert. Die automatisierte Umgebung stellt weiterhin kein echtes WebGPU-Gerät und keinen vom Nutzer bedienten realen Safari bereit. Daher bleiben die direkte WebGPU-Nachprüfung und die Safari-Prüfung verpflichtende UAT-Evidenz. Die Schritte stehen in [UAT_CHECKLIST.md](UAT_CHECKLIST.md).

## Context Graph

- context_graph_impact: `none`
- context_graph_refs: none
- context_graph_reconciliation: `not_applicable`
- context_graph_required_action: `none`
- context_graph_gate_effect: `none`
- context_graph_evidence: Implementierung und Browserbelege sind run-spezifisch; PRD und SD bleiben die bestehenden SoT-Owner.
