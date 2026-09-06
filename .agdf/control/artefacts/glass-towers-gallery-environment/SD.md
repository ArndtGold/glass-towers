# SD: Verfeinerte, vollständig gerenderte Galerieumgebung

Status: approved
Gate: SD
Gate approval: `Approval: SD` vom 2026-08-20 für Revision `33daa2ff-8a22-4f2a-bf74-19f29e49a22a`
Based on: [PRD](PRD.md), [Brownfield Review](BROWNFIELD_REVIEW.md)
Date: 2026-08-20
Owner: Technical Owner

## 1. Lösungsübersicht

Die bestehende Three.js-Szene wird innerhalb ihres aktuellen `SceneBundle` zu einer räumlich geschlossenen Galerie erweitert. Der bisherige einzelne Plane-Hintergrund und die groben Seitenpaneele werden durch eine gestaffelte, rein visuelle Architekturgruppe ersetzt. Sie besteht aus Bodenplatte, Rückraum, seitlichen Raumfassungen, vertikalen Pfeilern, tiefen Laibungen, Lichtfeldern und einem verfeinerten Sockel.

Die Materialqualität basiert auf backendportablen `MeshStandardMaterial`- und `MeshPhysicalMaterial`-Shadern, deterministisch erzeugten lokalen Oberflächenmaps, einer lokalen Reflexionsumgebung und weichen Studioleuchten. Es werden bewusst weder eigener GLSL-/WGSL-Code noch `ShaderMaterial`, `onBeforeCompile`, eine zweite Szene oder ein zweiter Renderpass eingeführt. So bleibt dieselbe Material- und Geometriequelle für den bevorzugten WebGPU-Pfad und den klassischen Safari-WebGL2-Fallback nutzbar.

Die Galerie ist rein visuell: Sie erzeugt keine Rapier-Collider und verändert keine Spielzustände. Der bestehende `GameRuntime`, die `RendererFactory`, der `GameStore`, die Physikwelt und der einzige Frame Loop bleiben ihre jeweiligen kanonischen Owner.

## 2. Ownership und Source of Truth

| Owner | Verantwortung in diesem Slice | Verbindliche Grenze |
|---|---|---|
| `createScene.ts` / `SceneBundle` | Einzige Szenenwurzel, Kamera, World-Root, Galerieeinbindung, Piece-Erzeugung und vollständiger Dispose | Keine zweite Szene, Kameraautorität oder Rendersteuerung |
| `createGalleryEnvironment.ts` als untergeordneter Builder | Erzeugt ausschließlich die statische Galeriegruppe, benannte Rollen und ihre wiederverwendbaren Geometrien | Kein eigener Lifecycle, Renderer, Frame Loop, Spielzustand oder Physikowner |
| `createMaterials.ts` | Einzige Fabrik für Galerie-, Glas-, Akzent- und Soft-Shadow-Materialprofile sowie prozedurale Texturen | Kein backendseparater Materialkatalog und keine extern geladenen Laufzeitressourcen |
| `GameRuntime` | Erstellt genau ein `SceneBundle`, aktiviert nach Rendererwahl genau ein Qualitätsprofil und besitzt Kamera-Follow/Resize | Keine zweite Galerieinstanz oder eigene Shaderentscheidung |
| `RendererFactory` | Unverändert alleiniger Owner für WebGPU-Preflight, klassischen WebGL2-Fallback, Pixel Ratio, stabile Frames und Renderer-Dispose | Dieser Slice ändert weder Auswahlreihenfolge noch Fehler-/Retry-Semantik |
| `GameStore` | Unverändert alleinige Autorität für Phase, Score, Bestwert und erlaubte Aktionen | Galerie darf keinen Produktzustand speichern oder ableiten |
| `PhysicsWorld` | Unverändert alleiniger Owner für Sockel-/Piece-Kollision und Stabilisierung | Galeriearchitektur erhält keine Collider |
| Galerie-PRD | Produkt-SoT für Raumcharakter, Lesbarkeit, Parität, Invarianten und Evidenz | SD darf keine abweichende visuelle Produktabsicht einführen |

`createGalleryEnvironment.ts` ist eine reine Auslagerung zur Begrenzung der Größe von `createScene.ts`, kein neuer paralleler Szenen-Owner. Alle erzeugten Ressourcen werden an das `SceneBundle` zurückgegeben und dort genau einmal disposed.

## 3. Architekturentscheidungen

### SD-GAL-01 — Eine gemeinsame Szenenstruktur

`createSceneBundle(aspect)` bleibt der einzige Einstieg. Der Scene Graph erhält genau eine benannte `gallery-environment`-Gruppe unter `worldRoot`:

```text
Scene
└─ worldRoot
   ├─ gallery-environment
   │  ├─ floor-and-plinth
   │  ├─ rear-architecture
   │  ├─ side-returns
   │  ├─ columns-and-reveals
   │  ├─ light-panels
   │  └─ soft-contact-shadows
   ├─ pedestal
   └─ piece objects
```

Die bestehende klare `scene.background`-Farbe bleibt nur Clear-/Fog-Farbe außerhalb der sichtbaren Geometrie. Die bisherige einzelne `PlaneGeometry` mit Rolle `backdrop` entfällt vollständig. Kein Screen-Space-Hintergrund und kein DOM-Bild wird ergänzt.

### SD-GAL-02 — Räumliche Hülle und Geometrieprofil

- Boden und Sockel erhalten Volumen; der Sockel verwendet abgerundete beziehungsweise gefaste Kanten statt einer scharfkantigen Einzelbox.
- Der Rückraum liegt deutlich hinter dem Spielbereich und wird durch tiefe Wandfelder, Laibungen und vertikale Module gestaffelt.
- Seitliche Raumfassungen bilden perspektivische Rückläufe und verdecken aus den geprüften Kamerawinkeln die Clear-Farbe.
- Wiederholte Wand-/Pfeilermodule verwenden geteilte Geometrien oder `InstancedMesh`; große Flächen werden nach Materialgruppe zusammengefasst.
- Architektur reicht über den im TP definierten höchsten Testkamerabereich hinaus. Fog und seitliche Überdeckung kaschieren nur ferne Übergänge, niemals fehlende tragende Raumteile.
- Alle Galerie-Meshes sind render-only und erhalten stabile Namen beziehungsweise `userData.galleryRole` für strukturelle Tests.

### SD-GAL-03 — Backendportable PBR-Shader statt Dual-Shader

Die Lösung nutzt die in Three.js `0.185.1` vorhandenen Standard-/Physical-PBR-Materialklassen. WebGPURenderer übersetzt diese intern in seine Node-Materialbibliothek; der klassische WebGLRenderer kompiliert seine bestehende GLSL-Pipeline. Eigene TSL-, WGSL- oder GLSL-Implementierungen würden zwei unabhängige Shaderquellen schaffen und sind in diesem Slice verboten.

`createMaterials.ts` liefert datengetriebene Profile:

- `mineral`: warme helle Hauptarchitektur, hohe Rauheit, geringe Metallizität, subtile Farb- und Rauheitsvariation.
- `accent`: etwas dunklere, seidenmatte Einfassungen mit klarerer Glanzkante.
- `pedestal`: heller Stein beziehungsweise Verbundmaterial mit stärkerer Kantenlesbarkeit und geringer Variation.
- `light-panel`: zurückhaltende emissive Fläche ohne Bloom- oder Postprocessing-Abhängigkeit.
- `soft-shadow`: transparente, lokal erzeugte Gradientfläche zur statischen Kontaktverankerung.

Niederfrequente Albedo-, Rauheits- und Normalvariation entsteht deterministisch aus lokal erzeugten `DataTexture`-/`CanvasTexture`-Daten. Sie ist kein sichtbarer Bildhintergrund und benötigt keinen Netzwerkabruf.

### SD-GAL-04 — Qualitätsprofile ohne neuen Spielmodus

Das `SceneBundle` erhält eine idempotente Methode `configureRendererBackend(backend)`. Vor der Rendererwahl verwendet die Szene ein konservatives, von beiden Renderern unterstütztes Baselineprofil, damit die bestehenden stabilen Initialisierungsframes unverändert funktionieren. Nach erfolgreicher Rendererwahl ruft `GameRuntime` die Methode genau einmal vor dem ersten interaktiven Frame auf.

| Eigenschaft | WebGPU `high` | WebGL2 `compatible` |
|---|---|---|
| Galeriekomposition und Geometrie | vollständig | identisch |
| PBR-Materialfamilien | Standard/Physical mit höherer Mapauflösung und Detailstärke | dieselben Familien mit reduzierter Mapauflösung und Detailstärke |
| Reflexions-/Umgebungsintensität | höher, solange Glaslesbarkeit besteht | reduziert |
| Lichtfelder | vollständige Studioanordnung | gleiche tragende Lichter, optionale Akzentintensität reduziert |
| Soft-Shadow-Auflösung | höher | reduziert |
| Pixel Ratio | bestehende Renderergrenze | bestehende niedrigere Renderergrenze |

Die Methode darf Materialien und lokale Texturen innerhalb desselben Owners ersetzen, muss ersetzte Ressourcen sofort disposen und darf keine Szene, keinen Zustand und keine Fallbackentscheidung erzeugen. Wiederholter Aufruf mit demselben Backend ist wirkungslos.

### SD-GAL-05 — Licht und visuelle Verankerung

- Zwei großflächige `RectAreaLight`-ähnliche Studioquellen beziehungsweise die backendkompatible Three.js-Flächenlichtform liefern breite Highlights auf Glas und Architektur.
- Ein begrenztes Füll-/Rim-Licht trennt Glas- und Raumkanten; die bisher sehr hohe globale Ambient-Intensität wird reduziert, damit Relief und Materialwechsel sichtbar werden.
- Emissive Lichtfelder in der Architektur erklären helle Reflexe, ohne einen Bloom- oder Postprocessing-Pass einzuführen.
- Statische, transparente Soft-Shadow-Meshes verankern Sockel, Pfeiler und Laibungen. Echte Shadow Maps werden in diesem Slice nicht neu aktiviert, damit die bereits korrigierte RendererFactory nicht erweitert und kein schwerer backendabhängiger Pfad eingeführt wird.
- Piece-Physik und Aufprallanimation bleiben unverändert; die Lichtabstimmung muss deren Bewegung lesbar halten.

### SD-GAL-06 — Lokale Reflexionsumgebung

Eine kleine, deterministisch erzeugte und lokal gehaltene equirektangulare Lichttextur wird ausschließlich als `scene.environment` für PBR-Reflexionen verwendet. Sie wird nicht als sichtbarer Hintergrund gerendert. Ihre hellen und dunklen Zonen entsprechen den sichtbaren Lichtfeldern der Galerie, sodass Glas und Akzentmaterialien plausible Studio-Highlights erhalten.

Kann ein Backend diese optionale Textur nicht stabil verwenden, fällt das Materialprofil auf direkte Studioleuchten und konservative PBR-Werte zurück. Dieser Qualitätsabstieg ist kein Rendererfehler und löst keinen Kompatibilitätsdialog aus.

### SD-GAL-07 — Kamera- und Viewportintegration

- Die bestehende Perspektivkamera, horizontale Ausrichtung und vertikale Follow-Logik bleiben autoritativ.
- Galerieabmessungen werden auf die aktuellen Startkoordinaten und den im TP festgelegten Mehrteil-/Stresskamerabereich ausgelegt; eine freie Kamera oder ein Galerie-Scrollmodus ist ausgeschlossen.
- `resize()` ändert weiterhin nur Aspect Ratio, Projektionsmatrix und Renderergröße. Responsive Lesbarkeit entsteht durch ausreichend breite Raumfassungen und kontrollierte Tiefenstaffelung, nicht durch einen zweiten mobilen Scene Graph.
- Sollte der mobile Bildausschnitt eine minimale Kompositionskorrektur benötigen, darf `SceneBundle` einen deterministischen, aspect-basierten Kameraoffset liefern; `GameRuntime` bleibt der einzige Anwender und Kameraowner.

### SD-GAL-08 — Ressourcen- und Dispose-Vertrag

Ein scene-lokaler Ressourcenregister besitzt jede einzigartige Geometrie, jedes Material und jede prozedurale Textur genau einmal. Clones und Instanzen referenzieren diese Ressourcen, besitzen sie aber nicht. `SceneBundle.dispose()`:

1. entfernt Listener oder backendbezogene Galeriebindungen, falls vorhanden;
2. disposed jede Galerie- und Piece-Geometrie genau einmal;
3. disposed Materialprofile und zugehörige lokale Texturen genau einmal;
4. leert Register und Scene Graph;
5. bleibt bei wiederholtem Aufruf wirkungslos.

Restart erzeugt keine neue Galerie. Nur ein vollständiger Renderer-Retry beziehungsweise Runtime-Neustart erzeugt nach dem bisherigen Dispose eine neue Instanz.

### SD-GAL-09 — Performancebudgets

- Höchstens 28 zusätzliche statische Galerie-Draw-Calls pro Frame; wiederholte Module werden instanziert oder materialweise zusammengeführt.
- Höchstens 14 einzigartige Galeriegeometrien und acht gleichzeitig aktive Galeriematerialien pro Qualitätsprofil.
- Prozedurale Galerie- und Reflexionstexturen bleiben zusammen unter 4 MiB unkomprimiertem RGBA-Budget.
- Keine Material-, Geometrie-, Textur- oder Lichtallokation im Frame Loop.
- Keine neue Physikarbeit, kein Postprocessing-Pass und kein zusätzlicher `requestAnimationFrame`.
- Der bestehende 20-Body-Test muss für Auto und erzwungenes WebGL2 bei p95-Arbeitszeit `≤ 33,3 ms` bleiben; langsamere reale Frameintervalle werden getrennt von gemessener Work Time dokumentiert.

### SD-GAL-10 — Fehler- und Fallbackvertrag

- Ein optionaler Material-, Textur- oder Lichtdetailfehler fällt innerhalb des Galerie-Materialowners einmalig auf das kompatible Profil zurück.
- Erwartete Qualitätsabstufung erzeugt kein `console.error`.
- Fehler bei Scene-Graph-Erzeugung oder Ressourcenverwaltung werden nicht verschluckt und führen über den bestehenden Runtime-Fehlerpfad in einen sichtbaren Recoveryzustand.
- Renderer-Retry bleibt auf genau einen WebGPU- und einen klassischen WebGL2-Versuch begrenzt.
- Keine User-Agent-Erkennung, kein Reload-Workaround und keine dritte Rendererstrategie.

## 4. Integrationspunkte

| Integrationspunkt | Änderung | Unveränderte Grenze |
|---|---|---|
| `src/game/rendering/createScene.ts` | Flachen Backdrop ersetzen, Galerie-Builder einbinden, Backendkonfiguration und Ressourcenregister exponieren | Ein `SceneBundle`, eine Kamera, ein World-Root |
| `src/game/rendering/createGalleryEnvironment.ts` | Neue reine Builderdatei für statische Architektur und Rollenmetadaten | Kein eigener Lifecycle oder Runtimezustand |
| `src/game/rendering/createMaterials.ts` | PBR-Profile, deterministische lokale Maps, Reflexionsumgebung und Soft-Shadow-Material | Eine Materialfabrik, kein externer Loader |
| `src/game/runtime/GameRuntime.ts` | Nach `renderer-ready` genau einmal `configureRendererBackend()` aufrufen | Ein Frame Loop, gleiche State-/Physics-Reihenfolge |
| `src/game/rendering/RendererFactory.ts` | Keine funktionale Änderung in diesem Slice | Safari-Fallback und stabile Frames bleiben exakt erhalten |
| `src/game/config.ts` | Nur statische Galerie-/Qualitätsbudgets, falls Tests sie als kanonische Konstanten benötigen | Keine Spiel- oder Physikwerte ändern |
| `tests/unit` | Struktur-, Materialprofil-, Determinismus- und Dispose-Verträge ergänzen | Keine Assertions bestehender Tests schwächen |
| `tests/e2e` / Playwright | Viewport-, Screenshot-, Backend-, Lifecycle- und Performanceevidenz erweitern | Bestehende Gameplay-/Fehlerprüfungen bleiben bestehen |

Es gibt keine API-, Datenbank-, Persistenz-, Netzwerk-, Authentifizierungs-, Deployment- oder Migrationsintegration.

## 5. Constraints und Kompatibilität

- Verbindlicher Stack bleibt React 19, Three.js `0.185.1`, Rapier und Vite.
- WebGPU wird nur nach erfolgreichem Adapter-Preflight verwendet; Safari/WebKit muss weiterhin über den klassischen `WebGLRenderer` auf WebGL2 funktionieren.
- Alle sichtbaren Raumteile, Objektpositionen und Kamerabeziehungen sind backendgleich. Nur Detailstärke und Auflösung dürfen variieren.
- Eigener GLSL-/WGSL-/TSL-Shadercode, `ShaderMaterial`, `onBeforeCompile`, Postprocessing und ein zweiter Renderpass sind ausgeschlossen.
- Neue externe Pakete und neue Laufzeit-Netzwerkassets sind ausgeschlossen; Three.js-Kern und bereits gebündelte Addons dürfen verwendet werden.
- Der bestehende `RendererFactory.ts`-Diff des vorherigen Safari-Runs wird nicht in diesem Slice verändert. Vor einer späteren Commitbildung müssen beide Run-Umfänge selektiv nachvollziehbar bleiben.
- HUD, Dialoge und CSS werden nur geändert, wenn die visuelle Evidenz eine konkrete Kontrastregression zeigt; eine allgemeine UI-Neugestaltung ist nicht erlaubt.
- `prefers-reduced-motion` bleibt wirksam; die Galerie benötigt keine Daueranimation.

## 6. Test- und Evidenzstrategie

### Automatisierte Struktur- und Materialtests

- Ein `galleryEnvironment`-Test beweist genau eine Galeriegruppe, stabile Rollen, vorhandene Raumhülle, fehlenden alten Plane-Backdrop und render-only-Geometrie ohne Physikbindung.
- Ein Materialtest beweist deterministische Texturdaten, gültige `high`-/`compatible`-Profile, idempotente Backendkonfiguration und Dispose genau einmal.
- Ein SceneBundle-Test beweist geteilte Ressourcen, begrenzte Unique-Counts und einen idempotenten Gesamt-Dispose.
- Ein Runtime-Test beweist genau eine Backendkonfiguration pro erfolgreicher Session sowie keine zusätzliche Konfiguration bei Restart.
- Bestehende RendererFactory-, State-, Input-, Physics- und Persistence-Tests bleiben unverändert grün.

### Browser- und sichtbare Evidenz

- Chromium und WebKit, jeweils Auto und erzwungenes WebGL2, müssen ohne Console/Page Errors starten und den vollständigen Kernlauf bestehen.
- Screenshotmatrix: leere Startszene, drei stabile Teile, repräsentative hohe Turmsituation und Game over.
- Viewports: `1280×720` und `390×844`; zusätzlich der bestehende Performanceviewport `640×360`.
- Gepaarte Backendbilder prüfen identische Raumanker, Sockelposition, Architekturabdeckung, Materialunterscheidung und Glaslesbarkeit.
- Ein Netzwerkcheck schlägt fehl, wenn neue Galerie-Ressourcen von einem externen Host geladen werden.
- Wiederholte Restart- und Renderer-Retry-Läufe prüfen, dass keine zweite Galerie, kein zweiter Frame Loop und keine Ressourcenverdopplung entsteht.

### Performance und Reviews

- Zehnsekündige 20-Body-Probe mit p95 Work `≤ 33,3 ms` in Chromium und WebKit für Auto und erzwungenes WebGL2.
- Draw-Call-, Geometrie-, Material- und Texturbudgets werden über deterministische Scene-Metadaten oder Rendererinfo erfasst, nicht aus Screenshots geschätzt.
- Task Plan Review bildet jedes `GAL-AC-*` auf Tasks, Tests und sichtbare Evidenz ab.
- Clean Implementation Review prüft insbesondere Dual-Shader, zweite Szene, zweiten Frame Loop, versteckte Fallbacks, manuelle Shadow-Map-Abzweigungen und Ressourcenlecks.
- Code Review prüft Backendkompatibilität, Dispose, deterministische Texturerzeugung, mobile Komposition und Teststabilität.
- UAT umfasst eine direkte visuelle Prüfung in realem Safari sowie einem WebGPU-fähigen Browser.

## 7. Risiken und offene Fragen

- `RectAreaLight`- und PBR-Details können sich zwischen WebGPU und WebGL2 sichtbar unterscheiden; die Komposition und Lesbarkeit sind verbindlich, pixelidentische Highlights nicht.
- Große abgerundete Geometrien können unnötig viele Vertices erzeugen; Segmentzahlen müssen über die Budgets begrenzt und im TP gemessen werden.
- Prozedurale Normal- und Rauheitsmaps können bei zu hoher Stärke wie Rauschen wirken; TP benötigt visuelle Vergleichsschritte, nicht nur Strukturtests.
- Die maximale realistische Turmhöhe ist nicht produktseitig begrenzt. TP definiert deshalb einen repräsentativen hohen Akzeptanzfall; außerhalb davon darf die Umgebung nicht abstürzen, aber eine unendliche Galerie ist kein Ziel.
- WebGPU kann in WebKit-Tests nicht auf jeder Maschine real verfügbar sein. Auto und erzwungenes WebGL2 bleiben automatisierbar; reale WebGPU- und Safari-UAT bleiben getrennte Akzeptanzevidenz.
- Die bestehenden Safari-Fallbackänderungen liegen noch uncommittet im Worktree. Vor Implementierung oder spätestens vor selektivem Commit muss ihre Ownership erhalten bleiben; dieser SD-Slice vermeidet bewusst Änderungen an `RendererFactory.ts`.

## 8. Nächster Schritt

Dieses Lösungsdesign prüfen und nur mit folgendem exakten Wert freigeben:

`Approval: SD`
