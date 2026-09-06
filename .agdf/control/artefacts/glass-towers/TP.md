# Task/Test Plan: Glass Towers

- Status: approved revision 2
- Run: `glass-towers`
- Gate: `TP`
- Freigabe: Revision 2 wurde am 20. August 2026 durch den Nutzer freigegeben.
- Abgeleitet aus: [PRD](PRD.md) und [SD](SD.md)

## Ausführungsgrenzen

- Implementierung der Revision 2 beginnt erst nach ihrer exakten TP-Freigabe und einer erneut bestandenen Implementation-preparation Brownfield Analysis für die bestehende Renderer-Implementierung.
- Der Projektordner ist noch kein Git-Repository. `git init` ist ein expliziter Teil von T-01; `.agdf/` bleibt entsprechend der Nutzerentscheidung ignoriert.
- Es entsteht genau eine Anwendung, ein Spielzustand, eine Physikwelt und ein Renderer mit Backendwahl. Separate WebGPU-/WebGL2-Spielpfade sind verboten.
- Abhängigkeiten werden während T-01 auf aktuelle, untereinander kompatible Versionen aufgelöst und im Lockfile fixiert; unfixierte Wildcards sind im Ergebnis verboten.

## Zielstruktur

```text
index.html
package.json
package-lock.json
vite.config.ts
playwright.config.ts
eslint.config.js
src/
  main.tsx
  app/App.tsx
  app/styles.css
  game/types.ts
  game/config.ts
  game/state/gameMachine.ts
  game/state/gameStore.ts
  game/runtime/GameRuntime.ts
  game/rendering/RendererFactory.ts
  game/rendering/createScene.ts
  game/rendering/createMaterials.ts
  game/physics/PhysicsWorld.ts
  game/pieces/catalog.ts
  game/input/InputController.ts
  game/persistence/BestScoreRepository.ts
  game/testing/rendererStrategy.ts
tests/
  unit/
  integration/
  e2e/
```

## Tasks

### T-01 — Projekt- und Qualitäts-Scaffold

- owner_paths: `package.json`, `package-lock.json`, `vite.config.ts`, `playwright.config.ts`, `eslint.config.js`, `index.html`, `src/main.tsx`, `.gitignore`
- action: Git-Repository initialisieren; Vite React TypeScript einrichten; Three.js, Rapier 3D, React sowie Test-/Lint-Werkzeuge installieren; Skripte für `dev`, `build`, `lint`, `test`, `test:integration` und `test:e2e` anlegen.
- constraints: Bestehende `.agdf/`-Ignore-Regel erhalten; `.idea/`, `node_modules/`, `dist/`, Playwright-Artefakte und Coverage ignorieren; keine Anwendungsvorlage mit parallelem Demo-Code behalten.
- acceptance: Saubere Ausgangs-App baut und lintet; Lockfile enthält keine ungeklärten Wildcard-Abhängigkeiten.
- tests: `npm run build`, `npm run lint`

### T-02 — Kanonische Typen, Konfiguration und Zustandsautomat

- owner_paths: `src/game/types.ts`, `src/game/config.ts`, `src/game/state/gameMachine.ts`, `src/game/state/gameStore.ts`
- action: Zustände `booting`, `aiming`, `dropping`, `settling`, `game-over`, `compatibility-error`; normalisierte Aktionen; Backendstatus; Score-/Bestwert-/Next-Piece-Daten; Seed und Laufidentität implementieren.
- constraints: Genau ein State Owner; Übergänge sind pure Funktionen; unzulässige Eingaben werden verworfen; Score erhöht sich ausschließlich bei bestätigter Stabilisierung genau einmal.
- acceptance: Alle SD-Übergänge sind modelliert; Store unterstützt `useSyncExternalStore`; Three-/Rapier-Objekte werden nicht im State gespeichert.
- tests: Unit-Tabellentests für gültige/ungültige Übergänge, Double-drop, Score-einmal, Game-over-einmal und Restart.

### T-03 — Piece-Katalog und reproduzierbare Sequenz

- owner_paths: `src/game/pieces/catalog.ts`
- action: Mindestens Quader, Stab, Platte, Zylinder und asymmetrischen Verbundkörper als gemeinsame Definition für Rendering, Collider, Masse/Schwerpunkt und Vorschau implementieren; seedbaren Generator hinzufügen.
- constraints: Stabile `piece_id`; einfache Collider; keine getrennten Vorschau- oder Physikkataloge; Testseeds dürfen keine Produktionslogik forken.
- acceptance: Fünf Profile unterscheiden sich sichtbar sowie mindestens in Größe, Masse oder Schwerpunkt; identischer Seed erzeugt identische Reihenfolge.
- tests: Katalogvalidierung, eindeutige IDs, Collider-/Massendaten und Seed-Snapshots.

### T-04 — RendererFactory und Capability-Recovery (Revision 2)

- owner_paths: `src/game/rendering/RendererFactory.ts`, `src/game/testing/rendererStrategy.ts`
- action: Eine schmale `RendererSession` für die von der Runtime benötigten Operationen definieren; bei verfügbarem `navigator.gpu` genau einen `WebGPURenderer`-Versuch ausführen; nach Fehlen oder Scheitern von WebGPU auf demselben Canvas explizit einen `webgl2`-Kontext erzeugen und genau einen klassischen Three.js-`WebGLRenderer` damit initialisieren; Backend erfassen, stabile Präsentation prüfen und endgültigen Kompatibilitätszustand liefern.
- constraints: Ein Factory-Owner, ein Canvas und ein Game-/Szenenpfad; kein `forceWebGL`, UA-Sniffing, Reload oder unendlicher Retry; ein fehlgeschlagener Adapter wird vor dem nächsten Versuch vollständig disposed; erwarteter WebGL2-Fallback erzeugt weder `console.error` noch Page Error; injizierte Adapter/Fakes verändern Produktionssemantik nicht.
- acceptance: WebGPU-Erfolg, fehlendes WebGPU mit direktem WebGL2-Start, fehlgeschlagener WebGPU-Versuch mit genau einem WebGL2-Fallback, explizit fehlender WebGL2-Kontext, beide Adapter fehlgeschlagen, stabile Frames und Retry nach sichtbarem Fehler sind deterministisch unterscheidbar; kein Pfad startet einen zweiten Frame Loop.
- tests: Unit-/Integrationstests mit injizierten Adaptern für Versuchsreihenfolge, stabile Frames, Context-Fehler, Dispose-Zählung, Fehlernormalisierung und doppelten-Frame-Loop-Guard.

### T-05 — Rapier-Physikwelt und Stabilitätsvertrag

- owner_paths: `src/game/physics/PhysicsWorld.ts`
- action: Rapier asynchron laden; fixed World, Sockel, dynamische Piece-Bodies, Compound-/Offset-Collider, festen `1/60 s`-Schritt, begrenzten Accumulator, Kontakt-, Ruhe- und Fallereignisse implementieren.
- initial_test_parameters: lineare Ruhegrenze `0.08 m/s`, angulare Ruhegrenze `0.12 rad/s`, 30 aufeinanderfolgende feste Schritte; Fallgrenze `y < -3 m`; Accumulator maximal 5 Nachholschritte. Werte werden durch Browser-Evidenz bestätigt oder vor QA begründet angepasst.
- constraints: Scoring hängt nur an Physikereignissen; Renderframes entscheiden keine Stabilität; World und Bodies werden bei Restart/Dispose vollständig entfernt.
- acceptance: Piece fällt, kollidiert, stabilisiert oder löst Fall genau einmal aus; Profile mit anderem Schwerpunkt zeigen unterschiedliche Stabilität.
- tests: Rapier-Integration für Fall/Kontakt/Ruhe/Fallgrenze, Compound-Collider, deterministischen Seedlauf und Dispose.

### T-06 — Szene, Glasmaterialien, Kamera und Feedback

- owner_paths: `src/game/rendering/createScene.ts`, `src/game/rendering/createMaterials.ts`
- action: Minimalistische Galerie, zentralen Sockel, Studiolicht, gemeinsame Glasmaterialfamilie, Preview-Rendering, geglättete Turmkamera und begrenztes Aufprallfeedback implementieren.
- constraints: Backendabhängige Qualitätsstufen dürfen nur Material-/Effektkosten ändern; Szene, Geometrie, Kamera, Physik und Spielzustand bleiben gleich; Ressourcen werden geteilt und genau einmal disposed.
- acceptance: Formen sind lesbar transluzent, Umgebung bleibt auf WebGPU und WebGL2 verständlich, Kamera hält aktive Turmspitze und Sockelbezug sichtbar.
- tests: Material-/Capability-Unit-Tests, Ressourcen-Dispose-Test, visuelle Browser-Screenshots für beide Backends.

### T-07 — GameRuntime und einziger Frame Loop

- owner_paths: `src/game/runtime/GameRuntime.ts`
- action: Renderer, Szene, Kamera, Physik, Store, Katalog und Eingaben orchestrieren; Spawn, Abwurf, feste Physikschritte, Transform-Synchronisierung, Stabilisierung, Score, nächsten Zug, Kamera und Game over ausführen.
- constraints: Genau ein `requestAnimationFrame`-Owner; Start/Stop idempotent; kein doppelter Listener; Renderer-Fallback baut keinen zweiten Store oder Physikpfad.
- acceptance: Ein vollständiger Lauf unterstützt mehrere Platzierungen, Scheitern und sauberen Restart ohne doppelte Bodies, Listener oder Loops.
- tests: Runtime-Integration mit kontrollierter Zeit, Fake-Renderer und echter Rapier-Welt; Start/Stop/Restart-Zählungen.

### T-08 — Einheitliche Maus-, Touch- und Tastatursteuerung

- owner_paths: `src/game/input/InputController.ts`
- action: Pointer-/Touch-Drag über Projektionsfläche in begrenzte horizontale Position übersetzen; Klick/Tap/Space auf dieselbe Drop-Absicht; Restartbutton und Tastatur auf dieselbe Restart-Absicht abbilden.
- constraints: Touch-Scroll nur auf aktiver Spielfläche unterdrücken; Eingaben respektieren den Zustandsautomaten; keine getrennten Mobile-Spielregeln.
- acceptance: Alle drei Eingabemethoden steuern semantisch identisch; Drop während `dropping/settling` hat keine Wirkung.
- tests: Pointer-, Touch- und Keyboard-Unit-Tests sowie Playwright-Läufe je Eingabekanal.

### T-09 — App-Shell, HUD und sichtbare Recovery

- owner_paths: `src/app/App.tsx`, `src/app/styles.css`
- action: Canvas-Halter, Logo, Score, Bestwert, Next-Piece-Vorschau, Backendstatus, Game-over-Fläche, Neustart, Loading und Compatibility Error mit Retry umsetzen.
- constraints: React liest den Store und sendet Absichten; es berechnet keine Physik/Score-Regeln; Ladefläche endet immer in Spiel oder sichtbarem Fehler; responsiv und per Tastatur bedienbar.
- acceptance: AC-01, AC-04, AC-05 und AC-07 sind im DOM und visuell eindeutig nachweisbar.
- tests: Testing-Library-Zustandstests; Playwright-Screenshots für aiming, fallback, game over und compatibility error.

### T-10 — Bestwert, Restart und Lifecycle-Cleanup

- owner_paths: `src/game/persistence/BestScoreRepository.ts`, `src/game/runtime/GameRuntime.ts`, `src/app/App.tsx`
- action: Versionierten Local-Storage-Key implementieren; ungültige Daten sicher auf `0`; Bestwert bei neuem Rekord schreiben; Restart und Unmount vollständig bereinigen.
- constraints: Nur numerischer Bestwert; kein Laufzustand, keine Telemetrie; kein Seitenreload als Restart.
- acceptance: Bestwert überlebt Restart und Seitenreload; beschädigter Storage blockiert das Spiel nicht; Restart setzt Score/Bodies zurück.
- tests: Repository-Unit-Tests, Runtime-Restart-Test und Playwright-Reload-Szenario.

### T-11 — Automatisierte Akzeptanz- und Browser-Regressionssuite (Revision 2)

- owner_paths: `tests/unit/**`, `tests/integration/**`, `tests/e2e/**`, `playwright.config.ts`
- action: Alle Unit-/Integrationstests konsolidieren; bestehende Chromium-Projekte für `auto`, `forced-webgl2` und `renderer-failure` erhalten; zusätzlich ein echtes Playwright-WebKit-Projekt für den WebGL2-Fallback einrichten.
- required_browser_runs:
  1. Auto-Backend: mindestens drei stabile Platzierungen, absichtliches Scheitern, Game over und Restart.
  2. Forced WebGL2: mindestens zwei Platzierungen, Scoreprüfung, Scheitern und Restart.
  3. Renderer failure: WebGPU und WebGL2 scheitern, sichtbarer Compatibility Error, Retry bleibt kontrolliert.
  4. Inputmatrix: Maus, Touch und Tastatur lösen jeweils Positionierung/Drop aus.
  5. WebKit Auto ohne WebGPU: Spiel erreicht `aiming`, meldet Backend `webgl2`, erzielt mindestens einen Punkt, kann absichtlich scheitern und ohne Reload neu starten.
  6. WebKit Forced WebGL2: expliziter WebGL2-Kontext bleibt aktiv; Spiel erreicht `aiming` und mindestens einen erfolgreichen Score ohne `console.error`, Page Error oder unbehandelte Rejection.
- constraints: Jeder Lauf sammelt `console.error`, Page Errors und unbehandelte Rejections und schlägt bei Vorkommen fehl.
- acceptance: AC-01 bis AC-09 haben automatisierte oder sichtbar dokumentierte Evidenz.

### T-12 — Performance-, Build- und Live-Browser-Verifikation (Revision 2)

- owner_paths: `tests/e2e/performance.spec.ts`, `README.md`, `.agdf/control/artefacts/glass-towers/evidence/**`
- action: Build/Lint/Test vollständig ausführen; Frameverhalten mit 20 aktiven/ruhenden Pieces für 10 Sekunden auf Auto und WebGL2 messen; mehrere echte Chromium- und WebKit-Läufe spielen; Safari/WebKit-Fallback, Backendstatus, Scoring, Failure, Restart und Konsolenintegrität als Screenshots und Ergebnisnotizen sichern.
- initial_performance_threshold: p95 Framezeit höchstens `33.3 ms` auf der verfügbaren Referenzumgebung; Initialladung separat markieren. Wenn die Umgebung keine belastbare WebGPU-Evidenz bietet, wird das als fehlende externe Evidenz ausgewiesen und nicht durch WebGL2 ersetzt.
- constraints: Keine abgeschwächten Assertions oder übersprungenen Tests zum Erreichen von Grün; Konsolenfehlerfreiheit ist harte Bedingung.
- acceptance: `npm run lint`, `npm test`, `npm run test:integration`, `npm run test:e2e` und `npm run build` bestehen; Chromium-Regression bleibt grün; WebKit-Evidenz deckt klassischen WebGL2-Fallback, Scoring, Fall, Game over und Restart ohne Konsolenfehler ab.

## Revisionsdelta 2

- `SAFARI-01` ersetzt ausschließlich den Fallback-Adapter in T-04: WebGPU bleibt beim `WebGPURenderer`, WebGL2 wechselt zum klassischen `WebGLRenderer`.
- T-11 erweitert die Browsermatrix um WebKit und prüft den produktiven Auto-Fallback sowie den erzwungenen WebGL2-Pfad.
- T-12 verlangt neben der bestehenden Chromium-Regression sichtbare WebKit-Evidenz für Scoring, Failure und Restart.
- Alle übrigen Tasks, Owner, Spielregeln und Akzeptanzkriterien bleiben unverändert. Vor Codeänderungen wird die bestehende Implementierung erneut durch Brownfield Analysis gegen dieses Delta geprüft.

## PRD-/Akzeptanz-Mapping

| Kriterium | Implementierung | Automatisierte Evidenz | Sichtbare Evidenz |
|---|---|---|---|
| AC-01 | T-02, T-07, T-09 | Store/UI/E2E | aiming-Screenshot mit Piece, Preview, Score, Bestwert |
| AC-02 | T-02, T-08 | Input-Unit und Inputmatrix-E2E | Maus-/Touch-/Keyboard-Läufe |
| AC-03 | T-02, T-05, T-07 | Physik- und Runtime-Integration | Lauf mit mindestens drei Score-Erhöhungen |
| AC-04 | T-02, T-05, T-07, T-09 | Game-over-einmal-Tests | Game-over-Screenshot und blockierte Eingabe |
| AC-05 | T-07, T-09, T-10 | Restart/Storage-Tests | Restart plus erhaltener Bestwert |
| AC-06 | T-04, T-06, T-11, T-12 | Chromium- und WebKit-WebGL2-Projekte | WebGL2-Backendstatus und vollständiger WebKit-Lauf |
| AC-07 | T-04, T-09, T-11 | Renderer-failure-Projekt und WebKit-Auto-Fallback | Compatibility Error nur bei tatsächlichem Doppelfehler; Retry/Hinweis |
| AC-08 | T-03, T-05, T-06 | Katalog-/Physiktests | sichtbare unterschiedliche Formen |
| AC-09 | T-11, T-12 | vollständige Command-Suite in Chromium und WebKit | Browserlaufprotokoll ohne Konsolenfehler |

## Ausführungsreihenfolge

1. T-01
2. T-02 und T-03
3. T-04 und T-05
4. T-06, T-07 und T-08
5. T-09 und T-10
6. T-11
7. T-12

Parallelisierung ist nur zwischen explizit unabhängigen Tasks zulässig. Shared-Owner-Dateien werden nicht gleichzeitig bearbeitet.

## Definition of Implementation Done

- Alle T-IDs sind umgesetzt und gegen ihre Acceptance nachgewiesen.
- Alle AC-IDs besitzen automatisierte und, wo gefordert, sichtbare Evidenz.
- Keine parallelen Renderer-, Physik-, State-, Input- oder Piece-Owner existieren.
- Alle Qualitätscommands bestehen ohne geschwächte oder übersprungene Checks.
- Task Plan Review, Clean Implementation Review und Code Review können anhand klarer Pfade und Evidenz entscheiden.
- QA wird erst nach diesen Reviews separat durch `qa-gate` entschieden.
