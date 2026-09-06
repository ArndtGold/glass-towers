# TP: Sichtbarkeitsorientierter Camera Framing Controller

Status: approved
Gate: TP
Approval: approved — user supplied exact `Approval: TP` on 2026-08-21
Run: `glass-towers-camera-tracking`
Revision: `147cc356-efbf-400f-b9dc-3083db0127c3`
Stand: 2026-08-21
Based on: [approved SD](SD.md) · [approved PRD](PRD.md) · [Brownfield Review](BROWNFIELD_REVIEW.md)

## 1. Planungsziel und Ausführungsgrenze

Dieser Task-/Testplan operationalisiert ausschließlich die freigegebene Kameraführung: weiches Aufwärts-Tracking beim Turmbau, kontrolliertes Abwärts-Tracking im Kollaps und sicheres Framing der priorisierten Struktur. Rendererwahl, Galerie, Glasmaterialien, Physikregeln, Input, Score, Game-over und Restart-Berechtigung bleiben unverändert.

Im aktuellen Worktree bestehen bereits Änderungen des separaten Material-/Galerieumfangs an `package.json`, `src/game/rendering/createMaterials.ts`, `src/game/rendering/createScene.ts`, `src/game/runtime/GameRuntime.ts` sowie zugehörigen Renderingtests. Vor Implementierung muss die Implementation-Preparation Brownfield Analysis diese Baseline mit Patch- und Statusnachweis erfassen. Kameraänderungen an gemeinsam genutzten Dateien müssen additiv und zeilengenau isoliert werden; vorhandene Änderungen dürfen weder überschrieben noch als Kameraergebnis beansprucht werden.

Geplante Produkt- und Testpfade:

- `src/game/camera/CameraFramingController.ts` (neu)
- `src/game/physics/PhysicsWorld.ts`
- `src/game/runtime/GameRuntime.ts` (gemeinsamer Pfad; Baseline schützen)
- `src/game/rendering/createScene.ts` nur falls unveränderliche Home-Kamerawerte explizit exportiert werden müssen (gemeinsamer Pfad; Baseline schützen)
- `tests/unit/cameraFramingController.test.ts` (neu)
- `tests/integration/physicsWorld.test.ts`
- `tests/integration/gameRuntimeCamera.test.ts` (neu)
- `tests/e2e/cameraTracking.spec.ts` (neu)
- `package.json` ausschließlich zum Einhängen der neuen Kamera-E2E-Suite (gemeinsamer Pfad; Baseline schützen)
- run-spezifische Evidenz unter `.agdf/control/artefacts/glass-towers-camera-tracking/evidence/`

Jeder weitere Produktpfad oder eine Änderung an Kamera-FOV, Physikparametern, RendererFactory, Galerie-/Materialprofilen, UI oder Spielzustandssemantik erfordert vor Umsetzung eine TP-/SD-Revision.

## 2. Aufgabenfolge

| task_id | Aufgabe | Abhängigkeiten | Pfade / Owner | Abschlusskriterium | Acceptance mapping |
|---|---|---|---|---|---|
| CAM-T-01 | Pre-Implementation-Baseline und Changed-Path-Grenze erfassen | TP-Freigabe; Brownfield Analysis | keine Produktänderung; Brownfield-Artefakt | tracked/untracked Status, Patch-Fingerprints der gemeinsam genutzten Pfade, erlaubte Kamera-Hunks und Konfliktrisiken sind dokumentiert; Analyse endet mit `pass` | CAM-AC-10 |
| CAM-T-02 | Reinen `CameraFramingController` mit Katalogauflösung, rotierter World-AABB, Sockelanker, Safe Frame, Hysterese und zeitbasierter Konvergenz implementieren | CAM-T-01 | `src/game/camera/CameraFramingController.ts` | eine deterministische, Three-/DOM-unabhängige Berechnung liefert Zielhöhe, Distanz und Modus ohne Hot-Path-Allokationswachstum | CAM-AC-01–08 |
| CAM-T-03 | Physik-Snapshot um `pieceId` und `fallen` erweitern | CAM-T-01 | `PhysicsWorld.ts`, `physicsWorld.test.ts` | jeder Snapshot trägt bestehende Definition-ID und Fallstatus; `step`, Collider, Stabilisierung, Scoring und Fallgrenzen bleiben unverändert | CAM-AC-05, 10 |
| CAM-T-04 | Controller in den bestehenden Runtime-Frame integrieren | CAM-T-02, CAM-T-03 | `GameRuntime.ts`, optional `createScene.ts` | genau ein Snapshot-Durchlauf, ein Controller-Step und ein Render pro Frame; Aim-Sample, Phase, Run-ID, Aspect und FOV werden übergeben; altes Inline-Kamera-Lerp entfällt vollständig | CAM-AC-01, 03, 04, 06, 08, 10 |
| CAM-T-05 | Reduced Motion, Resize, Restart und Dispose sauber an den bestehenden Lifecycle binden | CAM-T-04 | `GameRuntime.ts`, Runtime-Integrationstest | ein Media-Query-Listener pro Runtime, listenerfreier Dispose, responsive Neuberechnung im normalen Frame und Restart ohne Pose-Sprung oder alte Historie | CAM-AC-04, 06, 07, 09, 10 |
| CAM-T-06 | Deterministische Controller- und Bounds-Unit-Tests implementieren | CAM-T-02 | `cameraFramingController.test.ts` | alle fünf Formen, drei Aspect Ratios, Ausschlussregeln, Deadband, Hysterese, vier Zeitmodi, 30/60/120-Hz-Parität und Reset sind mit harten Toleranzen abgedeckt | CAM-AC-01–08 |
| CAM-T-07 | Runtime-/Physik-Integration und Gameplay-Invarianten absichern | CAM-T-03–05 | `physicsWorld.test.ts`, `gameRuntimeCamera.test.ts` | Reihenfolge und Aufrufzahlen sind bewiesen; `fell` wirkt vor dem Kamera-Step; Rendererbackend ändert keinen Controllerinput; bestehende Gameplaysemantik bleibt grün | CAM-AC-03, 05, 06, 08, 10 |
| CAM-T-08 | Kamera-Browserfixture, Diagnostik und E2E-Matrix ergänzen | CAM-T-04–07 | `cameraTracking.spec.ts`, `GameRuntime.ts`, `package.json` | DEV-only Ziel-/Distanz-/Modus-/Work-Daten, reproduzierbare Zwölf-/20-Stein-Zustände und Screenshotsequenzen funktionieren für Auto und Forced WebGL2 ohne zweite Produkt-SoT | CAM-AC-01, 03–10 |
| CAM-T-09 | Vollständige Regression und Kamera-Performancebudgets ausführen | CAM-T-08 | bestehende Skripte und Kamera-E2E | Lint, Build, Unit, Integration und vollständige E2E bestehen; Kamera-p95 ≤ 0,30 ms; keine Console/Page Errors oder Listener-/Ressourcensteigerung | CAM-AC-09, 10 |
| CAM-T-10 | Evidenzregister, Reviews und direkte UAT-Checkliste vorbereiten | CAM-T-09 | run-spezifische Evidenz | automatisierte Befunde, Screenshots, Messdaten und offene reale Chrome-WebGPU-/Safari-WebGL2-UAT sind getrennt und kriteriumsgenau ausgewiesen | CAM-AC-01–10 |

## 3. Implementierungsdetails

### 3.1 Controller und Bounds

- Der Controller erhält nur numerische Inputs und Katalog-IDs; er besitzt weder `PerspectiveCamera` noch Renderloop, Store oder PhysicsWorld.
- Für jede Form werden lokale Half-Extents aus den bestehenden `dimensions` verwendet. Quaternionrotation wird über `abs(R) × halfExtents` in konservative World-AABB-Half-Extents überführt.
- `fallen=true` wird vor der Union ausgeschlossen; der Sockel bleibt fester Anker. Das Aim-Stück wird ausschließlich in Phase `aiming` als synthetisches Sample ergänzt.
- Die acht Envelope-Ecken werden in die unveränderliche Home-Kamerabasis projiziert. Safe-Frame-Faktoren bleiben 0,88 horizontal und 0,84 vertikal; FOV bleibt 36°, Home-Distanz ist Untergrenze, 32 Welteinheiten Obergrenze.
- Aufwärtsziele werden sofort übernommen. Abwärtsziele außerhalb `game-over` benötigen 300 ms kontinuierliche Abweichung; Deadband 0,08. `game-over`, Restart und Reduced Motion deaktivieren die Verzögerung.
- Exponentielle Konvergenz verwendet die im SD definierte `t90`-Formel mit 1,4 s Build, 1,8 s Collapse, 0,9 s Restart und 0,3 s Reduced Motion. Es entsteht kein Überschwingen.

### 3.2 Runtime und Lifecycle

- `GameRuntime.frame()` liest `physics.snapshots()` einmal, synchronisiert daraus Renderobjekte und reicht dieselbe Liste nach Ereignis-/Phasenaktualisierung an den Controller weiter.
- Die Kameraposition wird aus `target + homeDirection × distance` gebildet; X/Z des Ziels bleiben 0. Das bisherige `towerHeight()`-basierte Kamera-Lerp wird entfernt, nicht als Fallback behalten.
- `runId` ist der Reset-Trigger. Der Controller verwirft Hysterese- und Kollapshistorie, beginnt die Restart-Konvergenz aber an der aktuellen Pose.
- `matchMedia('(prefers-reduced-motion: reduce)')` wird einmal nach erfolgreichem Start gebunden, auf Änderungen aktualisiert und in `dispose()` entfernt.
- Resize verändert weiterhin Aspect, Projektionsmatrix und Renderergröße. Die neue Distanz wird im nächsten regulären Frame berechnet; kein zusätzlicher Renderloop oder Resize-Render wird eingeführt.
- DEV-Diagnostik verwendet ausschließlich `canvas.dataset` und wird beim Dispose vollständig entfernt. Produktionsbuild erzeugt keine Kamera-Telemetrie oder Persistenz.

### 3.3 Worktree-Isolation

- `createMaterials.ts` und alle vorhandenen Galerie-/Glas-Unit-Tests sind für diesen Slice read-only.
- An `GameRuntime.ts`, `createScene.ts` und `package.json` wird vor und nach der Kameraimplementierung ein diff-basierter Baselinevergleich geführt.
- Kamera-Hunks dürfen keine bestehende Galerie-/Materiallogik, Backendkonfiguration, Palette-/Stressfixture oder deren Diagnostik entfernen.
- Ein unauflösbarer Hunk-Konflikt oder die Notwendigkeit, Material-/Galerieentscheidungen umzubauen, stoppt CD+Tests und führt zur Scope-Reconciliation statt zu einem stillen Workaround.

## 4. Testplan

### 4.1 Unit-Tests

| Test-ID | Gegenstand | Harte Erwartung |
|---|---|---|
| CAM-UT-01 | Rotierte Bounds aller fünf Katalogformen | berechnete AABB enthält alle transformierten Referenzecken; Toleranz ≤ 1e-6 |
| CAM-UT-02 | Priorisierung | Sockel und Aim enthalten; `fallen=true` und dekorative/negative Fixture-IDs ausgeschlossen |
| CAM-UT-03 | Safe Frame | Zwölf-Stein-Fixture passt bei 16:9, 4:3 und 9:16 in 88 % Breite / 84 % Höhe, ohne Distanzmaximum zu erreichen |
| CAM-UT-04 | Deadband/Hysterese | ≤ 0,08 erzeugt keine Richtungsumkehr; normale Abwärtskorrektur erst nach 300 ms |
| CAM-UT-05 | Build/Kollaps-Zeitmodell | relevante Reaktion ≤ 150/250 ms; ≥ 90 % nach 1,4/1,8 s; kein Überschwingen |
| CAM-UT-06 | Restart/Reduced Motion | ≥ 90 % nach 900/300 ms; Historie gelöscht; kein Pose-Sprung und kein Überschwingen |
| CAM-UT-07 | Frequenzparität | 30/60/120 Hz unterscheiden sich nach gleicher Zeit in Ziel und Position jeweils ≤ 0,05 |
| CAM-UT-08 | Backendneutralität | identische Inputs mit `webgpu`- und `webgl2`-Runtimekontext ergeben bytegleiche Controllertrajektorie; Backend ist kein Controllerfeld |

### 4.2 Integration und Regression

| Test-ID | Gegenstand | Harte Erwartung |
|---|---|---|
| CAM-IT-01 | Snapshotvertrag | `pieceId`/`fallen` spiegeln vorhandene `PieceBody`-Daten; Fallereignis und bestehende Physics-Assertions unverändert |
| CAM-IT-02 | Frame-Reihenfolge | je Frame ein Physics-Step, ein Snapshot-Aufruf, ein Controller-Step und ein Render; `fell` setzt vor Controller-Step `game-over` |
| CAM-IT-03 | Aim-/Phasenübergang | Aim nur in `aiming`; Drop/Settling nutzen den physischen Snapshot ohne Doppelzählung |
| CAM-IT-04 | Lifecycle | genau ein Media-Query-Listener; Restart dupliziert nichts; Dispose entfernt Listener und Kamera-Datasets idempotent |
| CAM-IT-05 | Spielinvarianten | Input, Spawn, Stabilisierung, Score, Best Score, Game-over, Restart und Rendererfallback bestehen unverändert |

### 4.3 Browsermatrix und sichtbare Evidenz

| Browserprojekt | Backendmodus | Viewport | Zustände | Evidenz |
|---|---|---|---|---|
| Chromium | auto / tatsächliches Backend protokolliert | 1440×900 | Start, Wachstum bis 12, Kollaps, Endkomposition, Restart | Zeitreihe, Ziel-/Distanzdaten, Screenshots, Console/Page-Error-Guard |
| Chromium | forced WebGL2 | 1440×900 | derselbe Ablauf | Trajektorienvergleich und gepaarte Screenshots |
| WebKit | auto / erwarteter WebGL2-Fallback | 1440×900 | Start, Wachstum, Kollaps, Restart | Safari-nahe Regression ohne Kompatibilitätsfehler |
| Chromium und WebKit | forced WebGL2 | 390×844 | Start, 12-Steine-Framing, Kollaps | Safe-Frame-Screen-Space-Bounds und Hochformatbilder |
| Chromium | auto und forced WebGL2 | 1440×900, Reduced Motion | Wachstum, Kollaps, Restart | ≥ 90 % in 300 ms ohne Überschwingen |

Automatisierte Screenshots werden unter `.agdf/control/artefacts/glass-towers-camera-tracking/evidence/` mit Browser, Backend, Viewport und Zustand benannt. Sie belegen sichtbare Komposition, nicht reale Hardwarefähigkeit. Direkte UAT muss Chrome mit bestätigtem WebGPU und Safari mit bestätigtem WebGL2 separat ausweisen.

Alle Browserfälle schlagen bei `console.error`, `pageerror`, unbehandelter Promise-Rejection, schwarzem Frame oder unerwartetem Compatibility-Dialog fehl.

### 4.4 Performance

- Die bestehende `?stress=20&seed=152`-Fixture wird wiederverwendet; keine zweite Stresszustandsmaschine entsteht.
- Kameraarbeit wird DEV-only um den Controller-Step inklusive Sample-/Boundsaufbereitung gemessen und als `data-camera-p95-work` ausgegeben.
- Nach Warm-up werden mindestens zehn Sekunden beziehungsweise mindestens 300 verwertbare Frames gemessen.
- Blockierende Grenze: Kamera-p95 ≤ 0,30 ms je ausführbarem Profil. Zusätzlich bleiben bestehendes Gesamt-p95-Work und Galerie-Ressourcenbudgets grün.
- Restart- und Reloadläufe prüfen stabile Listener-, Dataset-, Scene-, Material- und Geometry-Zähler; die Kamera darf keine GPU-Ressource anlegen.

### 4.5 Kanonische Befehle

Nach fokussierten Tests müssen mindestens erfolgreich laufen:

```bash
npm run lint
npm run build
npm run test
npm run test:integration
npm run test:e2e
```

`npm run test:e2e` bindet `cameraTracking.spec.ts` zusätzlich ein und entfernt oder schwächt keine bestehende Suite. Fokussierte Vitest-/Playwright-Aufrufe während CD+Tests ersetzen den abschließenden Gesamtlauf nicht.

## 5. Akzeptanz- und Evidenzmapping

| PRD-Kriterium | Primäre Tasks | Automatisierte Evidenz | Sichtbare / direkte Evidenz |
|---|---|---|---|
| CAM-AC-01 Wachstum ohne Sprung | CAM-T-02, 04, 06, 08 | CAM-UT-03/05, CAM-IT-02/03 | 12-Stein-Sequenz Desktop und Hochformat |
| CAM-AC-02 Deadband und Überschwingen | CAM-T-02, 06 | CAM-UT-04/05 | Zeitreihenplot/-daten als Evidenzanhang |
| CAM-AC-03 Kollapsreaktion | CAM-T-02, 04, 06–08 | CAM-UT-05, CAM-IT-02 | Kollapssequenz Chrome und Safari |
| CAM-AC-04 Safe Frame | CAM-T-02, 04, 06, 08 | CAM-UT-03, Screen-Space-E2E-Assertion | Screenshots 16:9, 4:3 und 9:16 |
| CAM-AC-05 ausgeschiedene Teile / Endkomposition | CAM-T-02, 03, 06–08 | CAM-UT-02, CAM-IT-01 | Game-over-Endbild mit sichtbarem Sockel/Restturm |
| CAM-AC-06 Restart | CAM-T-04–08 | CAM-UT-06, CAM-IT-04 | Browserlauf vor/nach Restart |
| CAM-AC-07 Reduced Motion | CAM-T-05, 06, 08 | CAM-UT-06, Media-Preference-E2E | kurze Übergangssequenz |
| CAM-AC-08 Frequenz-/Backendparität | CAM-T-02, 04, 06–09 | CAM-UT-07/08, gepaarte E2E-Daten | Chrome Auto/Forced-WebGL2 und Safari-WebGL2 |
| CAM-AC-09 Performance | CAM-T-02, 05, 08, 09 | Kamera-p95, Listener-/Lifecycle-Test | Performance-JSON je Profil |
| CAM-AC-10 unveränderte Semantik | CAM-T-01, 03–10 | vollständige Unit-/Integration-/E2E-Regression | direkte UAT ohne Console Errors |

## 6. Brownfield- und Reviewfolge

Nach `Approval: TP` ist zuerst die Implementation-Preparation Brownfield Analysis verpflichtend. Sie prüft den aktuellen Worktree, alle gemeinsam genutzten Owner, die tatsächliche Testbarkeit von Runtime und Media Query, die vorhandenen Stress-/Seed-Fixtures, Three.js-Kameraannahmen und den kleinsten sauberen Changed-Path-Satz. Nur `pass` öffnet CD+Tests.

Nach CD+Tests folgen zwingend:

1. Task Plan Review mit Status je `CAM-T-*` und Evidenz je `CAM-AC-*`.
2. Clean Implementation Review gegen Inline-Fallback, zweite Framingformel, doppelte Snapshotquelle und parallelen Lifecycle.
3. Code Review des tatsächlichen Diffs.
4. QA-Gate auf Basis der automatisierten Evidenz.
5. Direkte UAT auf realem Chrome/WebGPU und Safari/WebGL2 erst nach QA-Freigabe.

## 7. Abbruch- und Rücksteuerungsregeln

| Befund | Wirkung | Rücksteuerung |
|---|---|---|
| Zweite Kamera, zweiter Renderloop, zweite Snapshot-/Spielzustandsquelle oder altes Inline-Lerp als Fallback | `block` | Primärlösung auf Controller + bestehenden Runtime-Owner zurückführen |
| FOV-Änderung, horizontales Fragment-Tracking oder Distanz > 32 erforderlich, um Referenzscope zu erfüllen | `block` | SD revidieren; keine stille Parameteraufweitung |
| Änderung an Physik-, Score-, Spawn-, Input-, Renderer- oder Materialsemantik | `block` | Scope stoppen und mindestens zu SD, bei Nutzerwirkung zu PRD zurücksteuern |
| Kamera-p95 > 0,30 ms | `block` | Allokationen/Boundsaufbereitung reduzieren; kein Performanceguard, der Verhalten deaktiviert |
| Safe Frame oder Zeitgrenze nur durch Testtoleranzabschwächung erreichbar | `block` | Implementierung korrigieren oder SD/PRD revidieren |
| Konflikt mit uncommitted Material-/Galeriehunks | `block` | Baseline wiederherstellen beziehungsweise Slices explizit reconciliieren; nichts überschreiben |
| Reale WebGPU-/Safari-Evidenz fehlt | QA darf automatisierte Anteile bewerten, UAT bleibt offen | direkte UAT getrennt anfordern |

## 8. Definition of Done für CD+Tests

- CAM-T-01 bis CAM-T-10 sind erfüllt oder eine genehmigte Abweichung ist revisionsgebunden dokumentiert.
- Alle zehn `CAM-AC-*` besitzen die geforderte automatisierte und sichtbare Evidenz.
- Ein Controller ist alleiniger Owner der dynamischen Framingformel; altes Inline-Lerp und Parallelfallbacks existieren nicht.
- Worktree-Baseline der Material-/Galerieänderungen ist erhalten und der Kamera-Diff ist zeilen- und pfadgenau isolierbar.
- Lint, Build, Unit, Integration und vollständige Browsermatrix bestehen ohne Console/Page Errors.
- Safe-Frame-, Timing-, Frequenz-, Performance- und Lifecycle-Grenzen bestehen.
- Task Plan Review, Clean Implementation Review und Code Review haben keine offenen blockierenden Findings.
- Reale Chrome-WebGPU-/Safari-WebGL2-UAT wird nicht aus Headless- oder simulierten Profilen abgeleitet.

## 9. Freigabe

Der Nutzer hat Revision `147cc356-efbf-400f-b9dc-3083db0127c3` am 2026-08-21 mit exakt `Approval: TP` freigegeben. Die nachgelagerte Implementation-Preparation Brownfield Analysis ist mit `pass` abgeschlossen; damit ist CD+Tests innerhalb dieses Plans geöffnet.
