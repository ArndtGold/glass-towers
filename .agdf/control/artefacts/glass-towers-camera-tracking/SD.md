# SD: Sichtbarkeitsorientierter Camera Framing Controller

Status: approved
Gate: SD
Approval: approved — user supplied exact `Approval: SD` on 2026-08-21
Run: `glass-towers-camera-tracking`
Revision: `7d29aadc-a67b-467e-a099-9bd111a9d27a`
Stand: 2026-08-21
Based on: [approved PRD](PRD.md) · [Brownfield Review](BROWNFIELD_REVIEW.md)

## 1. Designziel

Die bestehende kamerabezogene Frame-Logik wird durch genau einen testbaren Framing-Controller ersetzt. Er leitet aus priorisierten Stück-Bounds eine Zielhöhe und Dolly-Distanz ab und dämpft beide zeitbasiert. `GameRuntime` bleibt alleiniger Orchestrator und wendet das Ergebnis auf die vorhandene `PerspectiveCamera` an; es entsteht kein zweiter Renderloop, keine zweite Kamera und keine zweite Spielzustandsmaschine.

## 2. Entscheidungen

| ID | Entscheidung | Begründung |
|---|---|---|
| CAM-SD-01 | Neuer reiner Owner `src/game/camera/CameraFramingController.ts` für Bounds-, Framing-, Hysterese- und Dämpfungsberechnung. | Isoliert testbare Mathematik statt weiterer Verantwortung im zentralen `GameRuntime`. |
| CAM-SD-02 | `GameRuntime` sammelt Inputs, ruft `step()` einmal pro bestehendem Frame auf und setzt Kamera/`lookAt`. | Behält Lifecycle, Reihenfolge und Renderautorität an einem Ort. |
| CAM-SD-03 | `PhysicsPieceSnapshot` wird um `pieceId` und `fallen` erweitert. | Wiederverwendet die vorhandene Snapshot-Quelle; keine zweite Physik- oder Objektregistrierung. |
| CAM-SD-04 | Transformierte World-AABBs werden numerisch aus Katalogdimensionen und Quaternion berechnet. | Rotationen werden berücksichtigt; teure `Box3.setFromObject()`-Traversals und Hot-Path-Allokationen entfallen. |
| CAM-SD-05 | Der Controller hält die FOV konstant bei der bestehenden 36°-Perspektive und verändert nur Zielhöhe und Distanz entlang der bestehenden Blickachse. | Verhindert Brennweiten-Pumpen und bewahrt die Galerieperspektive. |
| CAM-SD-06 | Der Sockel bleibt immer im Envelope; physische Stücke mit `fallen=true` werden ausgeschlossen. Das Aim-Stück wird als synthetisches Sample ergänzt. | Entspricht der priorisierten PRD-Komposition und verhindert extremes Herauszoomen für ausgeschiedene Fragmente. |
| CAM-SD-07 | Aufwärtskorrekturen reagieren sofort; Abwärtskorrekturen außerhalb `game-over` benötigen Hysterese, im Kollaps gelten sie sofort. | Verhindert Settling-Zittern, ohne den Kollapsabstieg zu verzögern. |
| CAM-SD-08 | `prefers-reduced-motion` nutzt denselben Zielzustand mit kurzer, nicht überschwingender Konvergenz. | Sichtbarkeit bleibt identisch, Bewegung wird reduziert; keine zweite Featurelogik. |

## 3. Ownership

| Owner | Verantwortung | Darf nicht besitzen |
|---|---|---|
| `CameraFramingController` | priorisierte Bounds, Safe-Frame-Distanz, Moduswahl, Deadband/Hysterese, zeitbasierte Konvergenz, Reset der Historie | Renderloop, Three-Kamera, Spielzustandsmutation, Physikregeln |
| `GameRuntime` | Snapshot-/Aim-Sammlung, Phase/Run-ID/Aspect/Reduced-Motion übergeben, Controller-Ergebnis auf Kamera anwenden, Listener-Lifecycle, DEV-Diagnostik | eigene parallele Framingformel |
| `PhysicsWorld` | bestehende Körper-Snapshots plus beobachtbare `pieceId`-/`fallen`-Metadaten | Kamera- oder Produktentscheidungen |
| `createSceneBundle` | bestehende Kamera, Ausgangsposition/-ziel und Perspektive bereitstellen | dynamische Framinglogik |
| `GameStore` | bestehende Phase und Run-ID als SoT | Kamera-Zwischenzustand |

## 4. Datenverträge

### 4.1 Physics Snapshot

`PhysicsPieceSnapshot` behält `id`, `position` und `rotation` und ergänzt:

```text
pieceId: string
fallen: boolean
```

Die Felder spiegeln vorhandenen `PieceBody`-Zustand wider und verändern keine Physikauswertung.

### 4.2 Controller Input

```text
CameraFramingInput
- deltaSeconds
- phase
- runId
- aspect
- verticalFovDegrees
- reducedMotion
- samples[]
  - pieceId
  - position {x,y,z}
  - rotation {x,y,z,w}
  - fallen
  - role: physical | aiming
```

`GameRuntime` reicht jeden physischen Snapshot genau einmal weiter. Das sichtbare Aim-Stück wird mit seinem Katalog-ID, aktueller Position und Rotation als `aiming` ergänzt. Test-Fixtures mit negativen Objekt-IDs oder rein dekorative Galerieobjekte werden nicht automatisch zu Framing-Samples.

### 4.3 Controller Output

```text
CameraFramingOutput
- targetY
- distance
- mode: build | collapse | restart | reduced
- rawTargetY
- requiredDistance
```

Die letzten beiden Felder dienen Tests und DEV-Diagnostik; sie erzeugen keinen zweiten sichtbaren Status.

## 5. Bounds- und Framingalgorithmus

### 5.1 Stück-Bounds

Für jedes nicht ausgeschiedene Sample:

1. `pieceId` über den bestehenden Katalog auflösen.
2. Lokale Half-Extents aus `dimensions / 2` bestimmen.
3. Quaternion in eine 3×3-Rotationsmatrix überführen.
4. World-AABB-Half-Extents mit `abs(R) × localHalfExtents` berechnen.
5. AABB um die Snapshot-Position in den Envelope vereinigen.

Die Katalogdimensionen sind konservativ für Box, Drum und Compound. Der Sockel wird als fester Bounds-Anker aus seiner bestehenden Collider-Ausdehnung ergänzt.

### 5.2 Priorisierung

- `fallen=true` wird vor der Union ausgeschlossen.
- `aiming` wird aufgenommen, solange die Phase `aiming` ist.
- In `dropping`/`settling` liegt das aktive Stück bereits als physisches Sample vor.
- In `game-over` bleiben alle noch nicht ausgeschiedenen Körper im Envelope; dadurch sinkt der Kollapskern natürlich ab.
- Wenn keine physischen Samples verbleiben, besteht der Envelope nur aus Sockel und gegebenenfalls neuem Aim-Stück.

### 5.3 Zielhöhe

Der rohe vertikale Fokus ist der Mittelpunkt des Envelope, begrenzt auf mindestens die bestehende Ausgangszielhöhe `2.2`. X und Z des Blickziels bleiben `0`, damit der Sockel der räumliche Anker bleibt. Seitliche Ausdehnung wird durch Distanz, nicht durch horizontales Hinterherfahren kompensiert.

### 5.4 Safe-Frame-Distanz

Die bestehende Blickachse wird aus Ausgangsposition minus Ausgangsziel normalisiert. Daraus entstehen feste Right-/Up-/Forward-Basisvektoren. Die acht Envelope-Ecken werden relativ zum Ziel in diese Basis projiziert.

Die erforderliche Dolly-Distanz ist das Maximum aus:

- vertikalem Projektionsbedarf mit Safe-Frame-Faktor `0.84`,
- horizontalem Projektionsbedarf mit Safe-Frame-Faktor `0.88`,
- vorderer Tiefenausdehnung plus Sicherheitsmarge.

Die Distanz wird mindestens auf die bestehende Home-Distanz und höchstens auf `32` Welteinheiten begrenzt. Die FOV, Near- und Far-Planes bleiben unverändert. Referenztests müssen beweisen, dass der Zwölf-Stein-Scope vor Erreichen des Maximums passt; andernfalls ist das SD zu revidieren, nicht stillschweigend die FOV zu verändern.

## 6. Zeitmodell

Alle Übergänge verwenden exponentielle, frameunabhängige Konvergenz:

```text
alpha = 1 - exp(-ln(10) * deltaSeconds / t90)
next = current + (target - current) * alpha
```

Damit werden 90 % des Ziels nach `t90` erreicht und es entsteht kein Überschwingen.

| Modus | Aktivierung | `t90` |
|---|---|---:|
| build | normale Phasen, höheres Ziel oder bestätigte Abwärtskorrektur | 1,4 s |
| collapse | `phase === game-over` | 1,8 s |
| restart | geänderte `runId` nach Game-over | 0,9 s |
| reduced | `prefers-reduced-motion: reduce` | 0,3 s |

Zieländerungen bis `0.08` Welteinheiten bleiben im Deadband. Außerhalb `game-over` wird ein tieferes Ziel erst nach 300 ms kontinuierlicher Abweichung übernommen. In `game-over`, `restart` und `reduced` ist diese Verzögerung deaktiviert. Zielhöhe und Distanz nutzen dasselbe Modus-Timing.

## 7. Runtime-Integration

### Start

1. `createSceneBundle()` erstellt wie bisher Kamera und Szene und stellt die Home-Komposition als unveränderliche Werte bereit.
2. `GameRuntime` erzeugt genau einen Controller aus dieser Home-Komposition.
3. `matchMedia('(prefers-reduced-motion: reduce)')` wird einmal gebunden; Änderungen aktualisieren nur ein Boolean-Feld.

### Frame

1. Physik wie bisher schrittweise aktualisieren.
2. Snapshots einmal lesen und Renderobjekte synchronisieren.
3. Store-Ereignisse wie bisher verarbeiten.
4. Kamera-Samples aus derselben Snapshot-Liste plus optionalem Aim-Stück bilden.
5. Controller einmal aufrufen.
6. Kamera auf `target + homeDirection × distance` setzen, `lookAt(0, targetY, 0)` anwenden.
7. Bestehenden Renderer einmal aufrufen.

Die Snapshot-Liste wird innerhalb des Frames wiederverwendet; es erfolgt kein zweiter `physics.snapshots()`-Durchlauf.

### Resize

Das bestehende Kamera-Aspect und die Projektionsmatrix werden aktualisiert. Der nächste normale Frame berechnet die Distanz für das neue Aspect neu; es gibt keinen separaten Resize-Renderloop.

### Restart

Die geänderte Store-`runId` löscht Controller-Hysterese, Peak-/Kollaps-Historie und Downward-Timer, behält aber die aktuelle Kamera-Pose als Start der 0,9-s-Konvergenz. Es gibt keinen Positionssprung.

### Dispose

Der Media-Query-Listener wird entfernt, Controller- und Diagnostikreferenzen werden verworfen. Bestehende Renderer-/Scene-/Physics-Disposal-Reihenfolge bleibt unverändert.

## 8. Reduced Motion

Die Media Query ist der einzige Aktivierungsweg. Der Ziel- und Safe-Frame-Algorithmus bleibt identisch; lediglich `t90=0.3 s`, Downward-Hysterese `0` und Überschwingen `0` gelten. Es wird keine Einstellung persistiert und kein UI-Control ergänzt.

## 9. Performance und Diagnostik

- Der Controller verwendet wiederverwendete numerische Scratch-Strukturen; keine `Box3`, `Vector3`, Arrays oder Corner-Objekte pro Sample/Frame.
- Katalogdefinitionen werden über eine einmalige ID-Map oder gecachte Auflösung gelesen, nicht wiederholt linear gesucht.
- Kameraarbeit wird nur im bestehenden DEV-Stressmodus separat gemessen und als `data-camera-p95-work` ausgegeben.
- Optionale DEV-Felder `data-camera-target-y`, `data-camera-distance` und `data-camera-mode` unterstützen deterministische Browserassertions und werden bei `dispose()` entfernt.
- Produktionscode erzeugt keine fortlaufende Telemetrie und keine neuen Netzwerk-, Speicher- oder Persistenzpfade.

## 10. Testdesign

### Unit

Neue `tests/unit/cameraFramingController.test.ts` deckt ab:

- rotierte AABB für alle fünf Katalogformen
- Ausschluss `fallen=true`
- Sockel- und Aim-Priorität
- Safe Frame bei 16:9, 4:3 und 9:16
- Deadband und 300-ms-Abwärtshysterese
- `t90` für build/collapse/restart/reduced
- kein Überschwingen
- 30/60/120-Hz-Parität ≤ 0,05 Einheiten
- Restart löscht Historie ohne Pose-Sprung

Bestehende Physics-/Runtime-Tests werden um Snapshot-Metadaten und Listener-/Dispose-Invarianten ergänzt, ohne Physikassertions zu verändern.

### Integration

Ein fokussierter Runtime-Test beweist die Reihenfolge: ein Snapshot-Durchlauf, Store-Phase nach `fell`, ein Controller-Schritt und ein Render pro Frame. Rendererbackend beeinflusst den Controllerinput nicht.

### Browser

Neue `tests/e2e/cameraTracking.spec.ts` nutzt Seed-/Stresspfade und DEV-Diagnostik für:

- Zwölf-Stein-Framing bei Desktop und Portrait
- erkennbaren Aufwärtsverlauf
- Game-over-Abwärtsverlauf
- Restart-Konvergenz
- Reduced Motion
- Forced WebGL2 und Auto/WebGPU
- Console-/Page-Error-Freiheit

Die Kamera-Performance wird im 20-Stein-Stressfall separat ausgewertet; bestehende Gameplay-, Galerie-, Material- und Rendererfälle bleiben unverändert Teil der Regression.

## 11. Traceability

| PRD | Design |
|---|---|
| CAM-PRD-01 | CAM-SD-01, CAM-SD-02, Abschnitt 6–7 |
| CAM-PRD-02 | CAM-SD-07, Abschnitt 6 |
| CAM-PRD-03 | CAM-SD-04, CAM-SD-05, Abschnitt 5 |
| CAM-PRD-04 | CAM-SD-06, CAM-SD-07, Abschnitt 6–7 |
| CAM-PRD-05 | CAM-SD-03, CAM-SD-06 |
| CAM-PRD-06 | Abschnitt 6–7 |
| CAM-PRD-07 | CAM-SD-08, Abschnitt 8 |
| CAM-PRD-08 | CAM-SD-01, Abschnitt 6 und 10 |
| CAM-PRD-09 | Abschnitt 9–10 |
| CAM-PRD-10 | Abschnitt 2–3 und 7 |

## 12. Nicht gewählte Alternativen

- Weiteres Inline-Lerp in `GameRuntime`: verworfen wegen fehlender Testbarkeit und wachsender Mixed Ownership.
- `Box3.setFromObject()` pro Frame: verworfen wegen Scene-Traversal, Allokationsrisiko und schwerer Performanceisolierung.
- Dynamische FOV: verworfen wegen optischem Pumpen und unnötiger Änderung der Galerieperspektive.
- Horizontales Folgen einzelner Fragmente: verworfen, weil der Sockel räumlicher Anker bleibt und ausgeschiedene Teile kein Framing bestimmen.
- Zweite Kamera oder separater Kamera-Renderloop: verboten als Parallelstruktur.

## 13. Rollback und Abgrenzung

Der Slice ist lokal reversibel: Controller, Snapshot-Metadaten, Runtime-Integration und fokussierte Tests können gemeinsam entfernt werden; die bestehende Home-Kamera bleibt in `createSceneBundle`. Es gibt keine Migration, Persistenz, Feature-Flag- oder Releasekopplung.

## 14. Freigabe

Der Nutzer hat Revision `7d29aadc-a67b-467e-a099-9bd111a9d27a` am 2026-08-21 mit exakt `Approval: SD` freigegeben. Diese Freigabe erlaubt die Erstellung des Task-/Testplans, nicht die Implementierung.
