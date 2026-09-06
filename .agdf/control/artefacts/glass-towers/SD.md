# Solution Design: Glass Towers

- Status: approved revision 2
- Run: `glass-towers`
- Gate: `SD`
- Freigabe: Revision 2 wurde am 20. August 2026 durch den Nutzer freigegeben.
- Abgeleitet aus: [PRD](PRD.md), [Brownfield Review](BROWNFIELD_REVIEW.md), [UX Intent Definition](UX_INTENT_DEFINITION.md)

## Architekturentscheidung

Die Anwendung wird als Vite-basierte React-/TypeScript-Single-Page-App gebaut. React besitzt ausschließlich HTML-UI, sichtbare Status- und Recovery-Flächen. Eine imperative `GameRuntime` besitzt Three.js-Szene, Renderer, Kamera, Rapier-Welt und den einzigen Frame Loop. Ein rendererunabhängiger `GameStore` ist die kanonische Spielzustandsquelle; React und Rendering lesen daraus, entscheiden aber keine Spielregeln erneut.

## Technologiestack

- Vite, TypeScript und React für Build, App-Shell, HUD und Zustandsflächen
- Three.js `WebGPURenderer` für den bevorzugten WebGPU-Pfad und klassischer `WebGLRenderer` für den belastbaren WebGL2-Fallback; beide liegen hinter derselben `RendererFactory`-Session
- Three.js Shading Language/Node-Materialien, soweit für beide Backends unterstützt; capability-basierte Effektqualität ohne Semantikänderung
- `@dimforge/rapier3d` für 3D-WASM-Physik
- Vitest und Testing Library für Logik/UI
- Playwright für echte Browserläufe und sichtbare Evidenz
- ESLint für statische Qualitätsprüfung

## Komponenten und Owner

| Owner | Verantwortung | Darf nicht besitzen |
|---|---|---|
| `AppShell` | Start-, HUD-, Game-over- und Kompatibilitätsdarstellung | Physik, Scoring oder Rendererentscheidung |
| `GameRuntime` | Lebenszyklus, Frame Loop, Szene, Kamera, Renderer und Physikwelt koordinieren | Produktzustand parallel zum `GameStore` speichern |
| `RendererFactory` | Backend initialisieren, Fallback, stabile Frames, Capability-Ergebnis und Dispose | Spielregeln oder separate Szenenmodelle |
| `GameStore` | Zustandsautomat, Zugstatus, Score, Bestwert, nächste Form und erlaubte Aktionen | Three-/Rapier-Objekte |
| `PhysicsWorld` | Rapier-Initialisierung, feste Simulationsschritte, Bodies, Collider, Ruhe- und Fallereignisse | UI oder Renderingqualität |
| `PieceCatalog` | Reproduzierbare Formdefinitionen, Masse-/Schwerpunktprofile, Render- und Colliderdaten | Laufzustand |
| `InputController` | Maus, Pointer/Touch und Tastatur in normalisierte `move`-, `drop`- und `restart`-Absichten übersetzen | Zustandsübergänge eigenständig ausführen |
| `BestScoreRepository` | Versionierten lokalen Bestwert lesen/schreiben und ungültige Werte sicher verwerfen | Aktuellen Lauf speichern |

## Kanonischer Zustandsautomat

```text
booting
  -> renderer-ready
  -> aiming
  -> dropping
  -> settling
  -> aiming
  -> game-over

booting -> compatibility-error -> retry -> booting
game-over -> restart -> aiming
```

- Nur `aiming` akzeptiert horizontale Bewegung und genau einen Abwurf.
- `dropping` wechselt in `settling`, sobald die Form Kontakt hat oder die definierte Fallphase erreicht.
- `settling` endet erfolgreich, wenn lineare und angulare Geschwindigkeit für eine definierte Folge fester Physikschritte unter den Ruhegrenzen liegen.
- Unterschreitet eine aktive Form die Fallgrenze oder verlässt den zulässigen Sockel-/Turmbereich, wechselt der Lauf genau einmal zu `game-over`.
- Score steigt ausschließlich beim erfolgreichen Übergang `settling -> aiming`.

## Renderer- und Fallbackdesign

1. Wenn `navigator.gpu` verfügbar ist, erstellt `RendererFactory` genau einen `WebGPURenderer`-Versuch. Fehlt WebGPU oder scheitert Initialisierung beziehungsweise stabile Präsentation, wird dieser Versuch vollständig disposed.
2. Der einzige Fallback-Versuch erzeugt auf demselben Canvas einen expliziten WebGL2-Kontext und übergibt ihn an Three.js `WebGLRenderer`. Er verwendet nicht den experimentellen WebGL-Backendpfad des `WebGPURenderer`.
3. Beide Rendererklassen werden durch dieselbe schmale `RendererSession` abstrahiert. Das initialisierte Backend wird als Capability `webgpu | webgl2` erfasst und dem UI sichtbar, aber nicht als eigener Spielmodus behandelt.
4. Nach jeder Initialisierung müssen innerhalb eines begrenzten Präsentationsbudgets zwei aufeinanderfolgende Frames erfolgreich gerendert werden.
5. Scheitert auch der klassische WebGL2-Versuch, besitzt `compatibility-error` die sichtbare Ursache, Retry und Browser-/Gerätehinweis. Es gibt keinen weiteren stillen Retry und keinen dauerhaften Loader.
6. Tests injizieren eine `RendererStrategy`; Produktionscode benutzt genau dieselbe Factory, Szene, Materialfamilie, Physik und Spielzustandsstruktur. Die zwei Rendererklassen sind Implementierungsadapter innerhalb eines Owners, keine parallelen Spiel- oder Szenenpfade.

WebGL2 darf Transmission, Brechung, Postprocessing, Schattenauflösung und Pixel Ratio reduzieren. Geometrie, Kamera, Physikzustand, Eingaben, Scoring und Zustandsübergänge bleiben identisch.

### Safari-Kompatibilitätskorrektur in Revision 2

WebKit 26.5 reproduziert mit Three.js 0.185.1 beim `WebGPURenderer({ forceWebGL: true })` einen Metal/ANGLE-Pipelinefehler und verliert den WebGL-Kontext. Dieselbe Szene und dieselben `MeshStandardMaterial`-Objekte rendern in derselben WebKit-Umgebung mit `WebGLRenderer` auf einem bestätigten `WebGL2RenderingContext` ohne Konsolenfehler. Revision 2 ersetzt deshalb ausschließlich den Fallback-Adapter; Backendstatus, Szene, Materialien, Physik, Zustandsautomat, Eingaben und UI-Vertrag bleiben unverändert.

## Physikdesign

- Rapier läuft mit festem Zeitschritt von `1/60 s`; ein begrenzter Accumulator verhindert eine Spirale bei langen Frames.
- Ein fester Seed erzeugt pro Lauf eine reproduzierbare Piece-Sequenz; Produktion kann den Seed zufällig wählen und Tests setzen ihn explizit.
- Sockel und statische Umgebung sind fixed bodies. Die positionierbare nächste Form ist bis zum Abwurf nicht Teil der dynamischen Simulation; beim Abwurf entsteht genau ein dynamic rigid body.
- Wiederverwendbare Piece-Definitionen koppeln Rendergeometrie an einfache, stabile Collider. Unterschiedliche Schwerpunkte entstehen über versetzte oder zusammengesetzte Collider/Massenprofile statt unsichtbarer Zusatzkräfte.
- Schnelle oder kleine Formen aktivieren erforderlichenfalls CCD. Schlafzustand und Geschwindigkeitsgrenzen bestimmen Stabilisierung; reine Renderframes entscheiden nie über Scoring.
- Die Physik nutzt SI-nahe konsistente Einheiten. Rendertransforms werden direkt aus den Rapier-Bodies abgeleitet.

## Formenkatalog

Der erste Katalog umfasst mindestens fünf klar unterscheidbare Profile: Quader, hoher Stab, flache Platte, Zylinder und asymmetrischer Verbundkörper. Jedes Profil definiert:

- stabile `piece_id`
- Rendergeometrie und Materialparameter
- Colliderkomposition
- Masse/Dichte und Schwerpunktprofil
- zulässige Skalierungsvarianten
- Vorschaugeometrie

Der Katalog ist Datenquelle für Szene, Vorschau, Physik und Tests; separate UI-Formdefinitionen sind verboten.

## Eingaben

- Pointerbewegung und Touch-Drag werden über Ray-/Plane-Projektion auf eine begrenzte horizontale Zielachse normalisiert.
- Klick/Tap und Leertaste senden dieselbe `drop`-Absicht.
- Neustartbutton und definierte Tastaturaktion senden dieselbe `restart`-Absicht.
- Der Zustandsautomat verwirft unzulässige Absichten deterministisch, statt sie später nachzuholen.
- Touch-Scroll wird nur innerhalb der aktiven Spielfläche unterdrückt.

## Kamera und visuelles Feedback

- Eine feste Studio-Komposition aus Welt-, Flächen- und Akzentlicht bleibt backendübergreifend lesbar.
- Die Kamera folgt einer geglätteten Zielhöhe, ohne den Sockel oder die aktive Turmspitze zu verlieren; beim Einsturz folgt sie kontrolliert abwärts.
- Aufprallfeedback besteht aus kurzer, amplitudenbegrenzter Kamera-/Lichtreaktion und optionalen Partikeln. Es beeinflusst die Physik nicht.
- Pixel Ratio und teure Effekte werden capability- und performanceabhängig begrenzt; der WebGL2-Pfad priorisiert Lesbarkeit.

## Persistenz und Recovery

- Nur der Bestwert wird unter einem versionierten Local-Storage-Key gespeichert.
- Fehlender, beschädigter oder nichtnumerischer Inhalt wird als `0` behandelt und bei nächster gültiger Speicherung ersetzt.
- Neustart disposed alle laufbezogenen Bodies, Listener und Animationen, setzt Score/Seedsequenz zurück und erhält den Bestwert.
- Renderer-Retry baut Canvas, Renderer, Szene und Physikwelt kontrolliert neu auf; doppelte Frame Loops oder Listener sind ein Blocker.

## Performancegrenzen

- Ein Frame Loop, ein Three.js-Renderer und eine Rapier-Welt sind die verbindlichen Single Owner.
- Physik arbeitet mit festem Schritt und maximaler Nachholschrittzahl.
- Dynamische Schatten und Transmission werden nach Backend begrenzt; statische Umgebung wird wiederverwendet.
- Geometrien und Materialien werden katalogbasiert geteilt und beim Runtime-Dispose genau einmal freigegeben.
- TP misst stabile Bedienbarkeit und Frameverhalten auf mindestens einem WebGPU- und einem WebGL2-Pfad; konkrete Schwellen werden dort als Testparameter festgehalten.

## Fehler- und Loggingvertrag

- Erwartete Capability-Abstufung wird als Status, nicht als Konsolenfehler behandelt.
- Unerwartete Initialisierungs-, Physik- oder Zustandsfehler werden einmal strukturiert protokolliert und führen in einen sichtbaren Recovery-Zustand.
- Browser-E2E schlägt bei `console.error`, unbehandelter Promise-Rejection oder doppeltem Frame Loop fehl.

## Testbarkeit

- Pure Tests: Zustandsautomat, Score-einmal-Semantik, Seedsequenz, Piece-Katalog, Bestwertvalidierung.
- Physikintegration: Fall, Kontakt, Stabilisierung, Fallgrenze, unterschiedliche Masse-/Schwerpunktprofile.
- Renderer-Vertrag: WebGPU-Erfolg, automatischer WebGL2-Fallback, erzwungener WebGL2-Retry, endgültiger Kompatibilitätszustand und Dispose.
- Browser-E2E: Maus, Touch, Tastatur, mehrere erfolgreiche Züge, Game over, Neustart und lokaler Bestwert.
- Sichtbare Evidenz: Screenshots/DOM-Zustände für Spiel, Fallback, Game over und Kompatibilitätsfehler.

## Sicherheits- und Datenboundary

Die Anwendung benötigt keine Konten, Netzwerk-API, persönlichen Daten oder Serverpersistenz. Local Storage enthält ausschließlich den numerischen Bestwert. Kein Telemetrie- oder Analytics-Scope wird eingeführt.

## Quellen

- Three.js `WebGPURenderer`: https://threejs.org/docs/pages/WebGPURenderer.html
- Three.js `WebGLRenderer`: https://threejs.org/docs/pages/WebGLRenderer.html
- Rapier JavaScript Getting Started: https://rapier.rs/docs/user_guides/javascript/getting_started_js/
- Rapier Determinism: https://rapier.rs/docs/user_guides/javascript/determinism/
- Rapier Common Mistakes: https://rapier.rs/docs/user_guides/javascript/common_mistakes/

## Offene Punkte für den Task/Test Plan

- Exakte Dateien, Tasks und Abhängigkeiten
- Test-Fixtures zum Erzwingen aller Rendererpfade
- Stabilitäts-, Fallgrenzen- und Präsentationsbudgets
- Browser-/Viewport-Matrix und sichtbare Evidenzschritte
- Saubere Initialisierung des noch fehlenden Git-/Projekt-Scaffolds
