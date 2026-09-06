# Brownfield Analysis: Kameraführung vor Implementierung

Mode: `pre_implementation_analysis`
Decision: `pass`
Run: `glass-towers-camera-tracking`
Date: 2026-08-21
Based on: approved [TP](TP.md) · approved [SD](SD.md) · [Brownfield Review](BROWNFIELD_REVIEW.md)

## Scope

CAM-T-01 prüft den bestehenden Kamera-, Physik-, Runtime-, Lifecycle- und Testpfad unmittelbar vor CD+Tests. CAM-T-02 bis CAM-T-09 bilden den implementierbaren Slice; CAM-T-10 bereitet Reviews und die spätere direkte UAT vor. Galerie-, Material-, Renderer-, Physikregel-, Store-, UI-, Input- und Persistenzsemantik bleiben geschützt.

## Existing-System Evidence

| Bereich | Beobachtete Evidenz | Bewertung |
|---|---|---|
| Kameraerzeugung | `createScene.ts` besitzt genau eine `PerspectiveCamera` mit FOV 36°, Home-Position `(7.8, 5.6, 10.8)` und Ziel `(0, 2.2, 0)` | `fully_done` als Home-Komposition; schmaler lesbarer Vertrag erforderlich |
| Kameraorchestrierung | `GameRuntime.frame()` besitzt genau einen Frame Loop und ein Inline-`towerHeight()`-Lerp für Zielhöhe und Y-Position | `partially_done`; durch einen reinen Controller im selben Orchestrator zu ersetzen |
| Physikbeobachtung | `PhysicsWorld` besitzt alle `PieceBody`-Definitionen, `fallen` und genau eine `snapshots()`-Quelle | `partially_done`; Snapshotmetadaten können ohne Regeländerung erweitert werden |
| Spielzustand | `GameStore`/`gameMachine` besitzen Phase, `fell`, Restart und `runId` | `fully_done`; als Eingabe wiederverwenden, nicht erweitern |
| Piece-Daten | `PIECE_CATALOG` besitzt fünf IDs, Dimensionen und Compound-Collider | `fully_done`; einzige Geometriequelle für konservative Bounds |
| Renderer | `RendererFactory` besitzt eine RendererSession und den WebGPU-zu-WebGL2-Fallback | `fully_done`; vollständig read-only für diesen Slice |
| Lifecycle | `GameRuntime.start()`, `resize`, `restart()` und `dispose()` besitzen Runtime-, Listener- und Ressourcenfolge | `partially_done`; genau einen Media-Query-Listener integrieren |
| Tests | Vitest Unit/Integration sowie Playwright Chromium/WebKit, Auto/Forced-WebGL2, Seed- und 20-Stein-Stresspfade existieren | `partially_done`; fokussierte Kamera-Tests und Diagnostik ergänzen |
| Toolchain | TypeScript strict, Vitest 4.1.11, Playwright 1.62.1 und Three.js 0.185.1 sind lokal installiert | `fully_done`; keine neue Abhängigkeit erforderlich |

## Worktree Baseline And Isolation

Baseline `git status --short` vor Kamera-CD+Tests:

```text
 M package.json
 M src/game/rendering/createMaterials.ts
 M src/game/rendering/createScene.ts
 M src/game/runtime/GameRuntime.ts
AM tests/e2e/glassMaterials.spec.ts
 M tests/unit/galleryEnvironment.test.ts
 M tests/unit/galleryMaterials.test.ts
A  tests/unit/pieceVisualGeometry.test.ts
```

Diese 457 Einfügungen und 61 Entfernungen gehören zum abgeschlossenen, aber noch nicht separat versionierten Material-/Galerieumfang. Sie sind keine Kameraevidenz.

Gemeinsam genutzte Baseline-Fingerprints über `git diff HEAD -- <path> | shasum -a 256`:

| Pfad | Baseline-Diff-Hash | Baselineumfang | Kamera-Regel |
|---|---|---:|---|
| `package.json` | `cc891302cab009a4712c73b8f2d7d77327d23272469220d51954ff601e2bc06c` | +1 / −1 | ausschließlich Kamera-E2E am bestehenden Befehl anhängen |
| `src/game/rendering/createScene.ts` | `515e94f859e834a8a88c1b0820a60905b261d68eee982c6dbacac8c45cd6297d` | +51 / −29 | nur Home-Kameravertrag; Piece-/Materialhunks erhalten |
| `src/game/runtime/GameRuntime.ts` | `9d65191c6c7d93e1d9662163d9b9e7f15c14b9364cde082e795ab46d77619cb3` | +21 / −1 | Palette-/Galeriediagnostik erhalten; Kamerahunks separat ausweisen |

`createMaterials.ts`, `glassMaterials.spec.ts`, `galleryEnvironment.test.ts`, `galleryMaterials.test.ts` und `pieceVisualGeometry.test.ts` sind für den Kamera-Slice read-only. `PhysicsWorld.ts` und `physicsWorld.test.ts` sind am Baselinepunkt sauber. Neue Kamera-Dateien existieren noch nicht. Die Überlappung ist beherrschbar, weil die Materialhunks in den gemeinsam genutzten Dateien inhaltlich getrennt von Home-Kamera, Frame-Kamera und npm-Suite-Verkettung liegen.

## Reuse Strategy

- `replace`: ausschließlich das vorhandene Inline-`towerHeight()`-Kamera-Lerp durch den genehmigten `CameraFramingController`; kein Fallback bleibt parallel bestehen.
- `new`: ein reiner, DOM-/Three-freier Controller und fokussierte Kamera-Testdateien.
- `extend`: bestehender `PhysicsPieceSnapshot` um die bereits vorhandenen `PieceBody`-Felder `definition.id` und `fallen`.
- `extend`: `SceneBundle` nur um unveränderliche Home-Kompositionswerte, falls die Runtime sie nicht sauber aus der erzeugten Kamera ableiten kann.
- `reuse`: bestehende Snapshotliste, Frame Loop, Store-Phase, `runId`, Resize-, Restart-, Dispose-, Seed-, Stress- und Browserpfade.
- `refactor`: keine zweite Runtime-Abstraktion. Falls Integrationstests eine Naht benötigen, erfolgt sie über Vitest-Modulmocks beziehungsweise einen schmalen reinen Export innerhalb des bestehenden Owners.

## Interface And Regression Impact

| Schnittstelle | Geplante Änderung | Regressiongrenze |
|---|---|---|
| `PhysicsPieceSnapshot` | `pieceId: string` und `fallen: boolean` ergänzen | Physikschritt, Events, Collider, Stabilisierung und `towerHeight()` bleiben unverändert |
| `SceneBundle` | optional lesbare Home-Kameradaten | eine Kamera, FOV/Near/Far und Scene-Lifecycle bleiben unverändert |
| `GameRuntime.frame()` | Snapshot einmal speichern, Events anwenden, Controller einmal ausführen, Kamera setzen | ein Physics-Step, ein Snapshotdurchlauf und ein Render pro Frame |
| Runtime Lifecycle | Media Query binden/entfernen; Controller bei `runId` zurücksetzen | keine neue Persistenz, UI oder zweite Featurelogik |
| DEV-Diagnostik | Kamera-Ziel, Distanz, Modus und p95-Work auf Canvas-Datasets | nur DEV, vollständig bei Dispose entfernt, keine Produkt-SoT |
| npm E2E | neue Kamera-Suite anhängen | alle bestehenden Suites bleiben vollständig erhalten |

Keine Datenmodell-, Persistenz-, Migration-, Netzwerk-, Security-, Authentifizierungs-, Deployment-, externe API- oder Releasewirkung.

## Parallel-Structure And Integrity Checks

- Zweite Kamera oder zweiter Renderloop: nicht erforderlich und verboten.
- Zweite Snapshotquelle: nicht erforderlich; dieselbe Liste synchronisiert Renderobjekte und Kamera.
- Zweite Spielzustandsmaschine: nicht erforderlich; Phase und `runId` kommen ausschließlich aus dem bestehenden Store.
- Zweite Framingformel: nicht zulässig; das bestehende Inline-Lerp wird ersetzt und nicht als Fallback behalten.
- Backendverzweigung: nicht erforderlich; WebGPU und WebGL2 reichen identische Controllerinputs.
- Ressourcenowner: der Controller besitzt nur Zahlenzustand und erzeugt keine GPU-Ressourcen.
- Sichtbare Status-/Recovery-Autorität: AppShell und GameStore bleiben alleinige Owner; Kamera-Datasets sind DEV-Evidenz.
- UI-Monolith: nicht anwendbar; keine React-Oberfläche oder View-State-Ownership wird geändert.

## Test Impact And Feasibility

- Der reine Controller ist direkt mit festen Samples und simuliertem Delta testbar; Quaternion-AABB, Safe Frame, Deadband, Hysterese, `t90`, Restart und 30/60/120-Hz-Parität benötigen keine Rendererinitialisierung.
- `PhysicsWorld` kann die neuen Snapshotfelder in der bestehenden Rapier-Integration beweisen.
- `GameRuntime` besitzt keine Dependency-Injection-Schnittstelle. Vitest-Modulmocks für RendererSession, SceneBundle, PhysicsWorld und RAF sind ausreichend; eine neue Runtime-/Kamera-Adapterarchitektur ist nicht gerechtfertigt.
- Playwright kann vorhandene Query-Fixtures, Backendbadge und Canvas-Datasets verwenden. Eine neue Kamera-Fixture darf nur deterministische Stückzustände bereitstellen und keine zweite Gameplay-Semantik einführen.
- WebKit Auto belegt den Safari-nahen Pfad, nicht reale Safari-Hardware. Echte Chrome-WebGPU- und Safari-WebGL2-Sichtprüfung bleibt direkte UAT.
- Kamera-p95 kann den Controller-Step einschließlich Sampleaufbereitung separat messen; bestehendes `stressP95Work` bleibt als Gesamtregression erhalten.

## Risks

| Risiko | Wirkung | Kontrolle |
|---|---|---|
| Materialhunks in `GameRuntime.ts` oder `createScene.ts` werden überschrieben | `block` | Baseline-Fingerprints plus zeilenweiser Vorher-/Nachhervergleich |
| Aim-Stück wird neben physischem Drop doppelt gezählt | Framingfehler | Aim nur in `aiming`; nach Drop ausschließlich Snapshot |
| `fell` wird erst nach Kamera-Step verarbeitet | verspäteter Kollapsmodus | Runtime-Reihenfolge im Integrationstest fest prüfen |
| Compound-Dimensionen unterschätzen sichtbare Geometrie | Safe-Frame-Verstoß | konservative Katalogdimensionen gegen transformierte Referenzecken testen |
| Runtime-Testbarkeit führt zu zweitem Adapter/Orchestrator | Parallelstruktur | Modulmocks oder schmaler reiner Export im bestehenden Owner |
| p95 > 0,30 ms durch Allokationen | `block` | Scratch-Daten, gecachte ID-Auflösung und keine Three-Objekte im Hot Path |
| Browserfixture verändert Spielsemantik | falsche Evidenz | DEV-only deterministische Zustandsinitialisierung; Kernloop separat regressieren |

## Context Graph Impact

- context_graph_impact: `none`
- context_graph_refs: none
- context_graph_reconciliation: `not_applicable`
- context_graph_required_action: `none`
- context_graph_gate_effect: `none`
- context_graph_evidence: Controller- und Baselineentscheidungen sind run-spezifisch; die wiederverwendbaren Produktgrenzen sind bereits in PRD und SD enthalten.

## Decision

- mode: `pre_implementation_analysis`
- decision: `pass`
- mode_slice_decision: `structured_slice`
- required_next_gate: `none`
- artefact: `.agdf/control/artefacts/glass-towers-camera-tracking/BROWNFIELD_ANALYSIS.md`
- missing_evidence: none für den Start von CD+Tests; reale Chrome-WebGPU-/Safari-WebGL2-Evidenz bleibt spätere UAT
- current_coverage: `partially_done`
- reuse_strategy: vorhandene Kamera-, Snapshot-, Store- und Lifecycle-Owner erweitern beziehungsweise die Inline-Framingformel sauber ersetzen
- transparency: SD/TP bleiben vollständig erforderlich, weil Bounds, Kollaps, responsive Framing, Reduced Motion und Performance mehrere Zustände und Evidenzarten verbinden
- required_next_step: CAM-T-02 bis CAM-T-09 innerhalb des genehmigten Pfadsatzes implementieren; CAM-T-10 anschließend als Evidenz- und Reviewvorbereitung abschließen.
