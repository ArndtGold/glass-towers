# CD+Tests: Sichtbarkeitsorientierte Kameraführung

Status: done
Run: `glass-towers-camera-tracking`
Stand: 2026-08-21
Based on: approved [TP](TP.md) · passed [Brownfield Analysis](BROWNFIELD_ANALYSIS.md)

## 1. Gelieferte Implementierung

| Bereich | Pfad | Ergebnis |
|---|---|---|
| Framing-Owner | `src/game/camera/CameraFramingController.ts` | Reiner numerischer Controller für rotierte Bounds, Safe Frame, Hysterese, Build/Collapse/Restart/Reduced-`t90` und backendneutrale Trajektorie. |
| Snapshotvertrag | `src/game/physics/PhysicsWorld.ts` | Bestehende Snapshots tragen zusätzlich `pieceId` und `fallen`; Physikregeln bleiben unverändert. |
| Home-Komposition | `src/game/rendering/createScene.ts` | Bestehende Kamerawerte sind als ein unveränderlicher Vertrag lesbar; eine Kamera und eine FOV bleiben erhalten. |
| Runtime | `src/game/runtime/GameRuntime.ts` | Ein Snapshotdurchlauf, ein Controller-Step und ein Render pro Frame; Aim-Sample, Phase, Run-ID, Resize, Reduced Motion, Restart, Dispose und bounded DEV-Diagnostik integriert. |
| Tests | `tests/unit/cameraFramingController.test.ts`, `tests/integration/gameRuntimeCamera.test.ts`, `tests/integration/physicsWorld.test.ts`, `tests/e2e/cameraTracking.spec.ts` | Deterministische Mathematik-, Reihenfolge-, Lifecycle-, Browser-, sichtbare und Performanceevidenz. |
| Gesamtlauf | `package.json` | Kamera-E2E an den bestehenden aggregierten Lauf angehängt; keine Suite entfernt. |

Das vorherige Inline-`towerHeight()`-Kamera-Lerp wurde vollständig ersetzt. Es existiert kein zweiter Framingpfad, keine zweite Kamera, kein zweiter Renderloop und keine Rendererabhängigkeit im Controller.

## 2. Task-Abschluss

| task_id | Status | Evidenz |
|---|---|---|
| CAM-T-01 | done | `BROWNFIELD_ANALYSIS.md` mit Status, +457/−61 Vorumfang und drei Shared-Path-Fingerprints |
| CAM-T-02 | done | Controller plus 8 Unit-Fälle für Bounds, Safe Frame, Hysterese, Zeitmodell und Frequenzparität |
| CAM-T-03 | done | Snapshotfelder und Rapier-Integrationstests für `fallen=false/true` |
| CAM-T-04 | done | Runtimeintegration und Integrationstest für einen Snapshot-Step, Eventreihenfolge, Collapse-Modus und einen Frame-Render |
| CAM-T-05 | done | Media-Query-Lifecycle, Resize-Wiederverwendung, Run-ID-Restart und idempotentes Dispose |
| CAM-T-06 | done | 8 Controller-Unit-Tests, fünf Formen, drei Aspect Ratios und 30/60/120 Hz |
| CAM-T-07 | done | 3 Integrationstests; bestehende Physics-/Gameplayregression vollständig grün |
| CAM-T-08 | done | 6 Kamera-E2E-Fälle über Chromium/WebKit, Auto/Forced-WebGL2, Desktop/Portrait und Reduced Motion |
| CAM-T-09 | done | Lint, Build, 37 Unit-, 3 Integrationstests, aggregierter E2E-Lauf und 300-Frame-Kamera-p95 |
| CAM-T-10 | done | 10 sichtbare Screenshots, 2 Performance-JSONs, Evidenzregister, TP/Clean/Code Reviews und UAT-Abgrenzung |

## 3. Automatisierte Verifikation

| Prüfung | Ergebnis | Umfang |
|---|---|---|
| `npm run lint` | pass | ESLint, keine Findings |
| `npm run build` | pass | TypeScript + Vite; nur bestehender advisory Chunk-Size-Hinweis |
| `npm run test` | pass | 10 Dateien, 37 Tests |
| `npm run test:integration` | pass | 2 Dateien, 3 Tests |
| `npm run test:e2e` | pass | ein vollständiger aggregierter Lauf: 4 Performance-, 8 Gameplay-, 8 Galerie-, 4 Galerie-Performance-, 8 Material- und 6 Kamera-Fälle; 38/38 pass |
| fokussierter Post-Review-Lauf | pass | Lint, Build, Unit, Integration und beide 300-Frame-Forced-WebGL2-Kamerafälle nach dem bounded-diagnostics Fix |
| `git diff --check` | pass | keine Whitespacefehler |

Die letzte Reviewkorrektur beendet ausschließlich die DEV-Kamera-Samplesammlung nach Veröffentlichung des 300-Frame-p95. Da dieser Hunk nach dem aggregierten Pass ergänzt wurde, wurden die betroffenen zwei Performancefälle anschließend erneut in Chromium und WebKit ausgeführt; beide bestehen und der Samplezähler bleibt nach Veröffentlichung unverändert.

## 4. Performanceevidenz

| Browserprojekt | Backend | Samples nach 2 s Warm-up | Kamera-p95 | Bewertung |
|---|---|---:|---:|---|
| Chromium | Forced WebGL2 | 300 | 0,20 ms | harter Pass gegen ≤ 0,30 ms; feiner Timer |
| WebKit | Forced WebGL2 | 300 | 1,00 ms | grober 1-ms-Timer; nicht als harter Budget-Pass ausgegeben, funktionaler und No-Growth-Nachweis pass |

Quellen:

- `evidence/chromium-webgl2-camera-performance.json`
- `evidence/webkit-webgl2-camera-performance.json`

Das Chromium-Ergebnis belegt den WebGL2-Codepfad mit ausreichender Zeitauflösung. Der WebKit-Wert ist transparent als `hardBudgetEvaluated: false` markiert. Reale WebGPU-Performance bleibt direkte UAT-/Hardwareevidenz und wird nicht aus Headless Auto abgeleitet.

## 5. Sichtbare Evidenz

Je Browserprojekt liegen vor:

- `auto-growth.png`: Acht-Stein-Turm, Aim-Stück, Sockel und Galerie sichtbar; Kamera nach oben geführt.
- `auto-collapse.png`: Kamera nach `fell` erkennbar abgesunken; Game-over bleibt kontrolliert.
- `auto-restart.png`: Ausgangskomposition und neues Aim-Stück nach Restart.
- `webgl2-stress-20.png`: hohe/weite Stresskomposition im Forced-WebGL2-Pfad.
- `webgl2-portrait-reduced.png`: Hochformat und Reduced-Motion-Modus.

Die direkte Sichtprüfung der Chromium-Bilder bestätigt, dass Sockel, Turm beziehungsweise Kollapskern im Frame bleiben. Der vorhandene Game-over-Dialog überlagert erwartungsgemäß einen Teil der Struktur; er wurde nicht verändert und die Kamera behandelt UI nicht als Geometrie.

## 6. Worktree-Isolation

- `createMaterials.ts`, `glassMaterials.spec.ts`, `galleryEnvironment.test.ts`, `galleryMaterials.test.ts` und `pieceVisualGeometry.test.ts` wurden durch den Kamera-Slice nicht verändert.
- `GameRuntime.ts` behält die vorbestehende Palette-Fixture und sämtliche Galerie-Datasets; Kamera-Hunks ergänzen dieselbe Runtime ohne Materiallogik zu ersetzen.
- `createScene.ts` behält die vorbestehenden gefasten Visuals, Materialbindung und Scene-Ressourcen; Kameraänderung ist auf `CAMERA_HOME` und das `SceneBundle`-Feld begrenzt.
- `package.json` behält die vorbestehende Material-Suite und hängt ausschließlich die Kamera-Suite an.
- RendererFactory, GameStore, GameMachine, Input, Best Score, UI und Physikparameter sind unverändert.

## 7. Abweichungen und offene Evidenzgrenze

- Keine genehmigungspflichtige Produkt- oder Designabweichung.
- Performanceevidenz musste timerauflösungsbewusst modelliert werden: Chromium liefert den harten Wert, WebKit bleibt ehrlich `coarse`.
- Echte Chrome-WebGPU- und reale Safari-WebGL2-Abnahme wurden in diesem automatisierten Lauf nicht durchgeführt. Sie bleiben nach QA als direkte UAT erforderlich.

## 8. Ergebnis

- CD+Tests: `pass`
- offene Implementierungsfindings: none
- nächste verpflichtende Schritte: TP Review, Clean Implementation Review, Code Review und anschließend QA-Gate.
