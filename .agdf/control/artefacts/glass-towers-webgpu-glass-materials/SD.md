# SD: Backendgerechte Glasoptik und Kontrastführung

Status: approved
Gate: SD
Gate approval: `Approval: SD` vom 2026-08-21 für Revision `25ab457c-aa8a-47c8-be6a-efbe96ac1a2c`
Run: `glass-towers-webgpu-glass-materials`
Stand: 2026-08-21
Based on: [approved PRD](PRD.md), [Brownfield Review](BROWNFIELD_REVIEW.md)

## 1. Lösungsziel

Die bestehende Renderarchitektur erhält zwei klar getrennte, aber aus denselben Piece-Daten abgeleitete Glasprofile. WebGPU nutzt den physikalischen Transmissionspfad von `MeshPhysicalMaterial`; WebGL2 bleibt bei einer performanten `MeshStandardMaterial`-Annäherung mit eigener glaslokaler Reflexionsquelle. Rendererwahl, Fallback, Physik, Spiellogik und die genehmigte Galeriearchitektur bleiben unverändert.

## 2. Verbindliche Owner und Datenfluss

| Verantwortung | Kanonischer Owner | Entscheidung |
|---|---|---|
| Piece-Farbe, Abmessungen, Collider und Schwerpunkt | `src/game/pieces/catalog.ts` | bleibt unverändert; keine zweite Piece-Konfiguration |
| Optische Profilableitung, Glasmaterialien und Studio-Environment | `src/game/rendering/createMaterials.ts` | ein zentraler Owner für beide Backendprofile |
| Backend-Aktivierung, Material-/Geometrie-Cache und render-only Piece-Geometrie | `src/game/rendering/createScene.ts` | verwendet das bereits konfigurierte Rendererprofil |
| Rendererwahl und WebGPU→WebGL2-Recovery | `src/game/rendering/RendererFactory.ts` | geschützter Vertrag; keine Änderung |
| Collider, Masse und Schwerpunkt | `src/game/physics/PhysicsWorld.ts` plus Piece-Katalog | geschützter Vertrag; keine Änderung |

Der Laufzeitfluss bleibt: Renderer erfolgreich wählen → `configureRendererBackend` setzt genau ein Profil und dessen Environment → Piece-Objekt aus `PieceDefinition` erzeugen → Geometrie und Material backendbezogen cachen → bestehende Scene-Bundle-Disposal-Kette räumt alle Ressourcen einmalig auf. `GameRuntime.start()` konfiguriert das Backend bereits vor dem ersten Piece und erfüllt damit die Aktivierungsreihenfolge.

## 3. Gemeinsames optisches Profil

`createMaterials.ts` erhält eine kleine reine Profilfunktion, die aus `PieceDefinition` einen internen `GlassOptics`-Wert ableitet. Eingaben sind Farbe, sichtbare Gesamtausdehnung und die kleinste beziehungsweise mittlere Formtiefe; Compound-Teile werden über die Hüllabmessungen ihrer bestehenden Collider abgeleitet. Alle Werte werden auf dokumentierte Min-/Max-Grenzen geklemmt.

`GlassOptics` enthält ausschließlich renderrelevante Werte: `tint`, `opticalThickness`, `attenuationDistance`, `roughness` und `compatibleOpacity`. Es verändert weder den Katalog noch Physikdaten. Dünne Formen erhalten geringere Absorption und etwas höhere Durchsicht, dicke Formen stärkere Volumenfarbe; die Farbidentität bleibt in beiden Profilen gleich.

## 4. WebGPU-High-Profil

WebGPU verwendet genau ein `MeshPhysicalMaterial` pro Piece-Definition und Backend:

- `transmission` liegt als Kalibrierbereich bei 0,86–0,92; `opacity` bleibt bei 1, damit Transmission und Reflexion nicht durch klassische Alpha-Transparenz ausgewaschen werden.
- `transparent` und `depthWrite` werden nicht als Alpha-Workaround eingesetzt; der physikalische Transmissionspfad ist der Owner der Durchsicht.
- `ior` liegt bei 1,45–1,48, `roughness` bei 0,08–0,14, `metalness` bei 0.
- `thickness`, `attenuationColor` und `attenuationDistance` stammen aus `GlassOptics`; dadurch reagieren dünne, dicke und zusammengesetzte Formen unterschiedlich.
- `dispersion` ist optional und auf einen subtilen Bereich von 0,02–0,04 begrenzt. Sie wird deaktiviert, falls die Performance- oder Sichtprüfung dominante Farbsäume zeigt.
- `envMapIntensity` wird gegen die High-Environment kalibriert. Ein zusätzlicher Clearcoat wird nicht als zweites Reflexionsmodell verwendet; die Glas-Fresnelreaktion des Physical-Materials bleibt primär.

Die bestehende High-Environment bleibt `scene.environment`. Ihre prozedural erzeugte Equirectangular-Textur erhält klar getrennte helle Studioflächen und dunkle Kontrastkarten, damit Rundungen, Fasen und Kanten vor hellen Pastellflächen lesbar werden.

## 5. WebGL2-Compatible-Profil

WebGL2 verwendet weiterhin genau ein transparentes `MeshStandardMaterial` pro Piece-Definition und Backend:

- `metalness` bleibt 0, `roughness` liegt als Kalibrierbereich bei 0,12–0,20 und `opacity` bei 0,70–0,78; `depthWrite` bleibt aus, um die vorhandene transparente Sortierung nicht durch Tiefenschreibartefakte zu verschärfen.
- Farbe und `compatibleOpacity` stammen aus demselben `GlassOptics` wie im High-Profil.
- Das Material erhält die Compatible-Environment direkt als `envMap` und eine profilgerechte `envMapIntensity`. Damit sind Reflexionen wirksam, ohne `scene.environment` für alle genehmigten Galerieoberflächen zu aktivieren.
- Es werden keine Transmission, Dispersion, zweite Hülle, Outline oder ein weiterer Renderpass emuliert.

Diese glaslokale Bindung ist die vorgeschlagene WebGL2-Optimierung: Sie erhöht Kanten- und Formkontrast gezielt am Glas und schützt zugleich Boden, Wände, Paneele und Podest vor einem unbeabsichtigten Environment-Wechsel.

## 6. Environment und Kontrastführung

`createEnvironmentTexture` bleibt deterministisch und lokal. Das High-Profil nutzt 256×128 Pixel, Compatible 128×64 Pixel. Beide Texturen kombinieren warme helle Softboxen, eine schmale kühle Randfläche und breite dunkle Karten. Die Auflösungen bleiben deutlich innerhalb des bestehenden Texturbudgets und benötigen weder Netzwerkzugriff noch externe HDR-Dateien.

Gallery- und Glasmaterialien teilen dieselbe profilbezogene Environment-Ressource und deren bestehenden Lifecycle. High bindet sie zusätzlich szenenweit; Compatible bindet sie ausschließlich an die Glasmaterialien. Ein Profilwechsel entsorgt die vorherige Material-/Texturgruppe erst nach der synchronen Neubindung. Restart erzeugt keine neue Environment.

## 7. Render-only Geometrieverfeinerung

Hartkantige Box-Visuals werden innerhalb ihrer bisherigen Außenmaße durch flach segmentierte, leicht gefaste Geometrien ersetzt. Der Fasenradius wird aus der kleinsten Dimension abgeleitet, auf 2–4 % und einen kleinen absoluten Höchstwert geklemmt. Cylinder erhalten eine schmale gerundete Randzone statt einer scharfen Deckelkante.

Compound-Visuals werden aus den bestehenden Colliderboxen aufgebaut und zu einer gecachten sichtbaren `BufferGeometry` pro Piece zusammengeführt. Positionen und Außenmaße bleiben erhalten; Collider, Masse und Schwerpunkt werden nicht berührt. Das Zusammenführen vermeidet zusätzliche transparente Teilmeshes und reduziert interne Sortierflächen sowie Draw Calls. Es gibt weiterhin genau ein sichtbares Material pro Piece.

## 8. Lifecycle, Fehler und Recovery

- `createSceneBundle` bleibt alleiniger Owner der Geometrie-, Glasmaterial- und Gallery-Material-Caches.
- Environment-Referenzen werden nicht separat von einzelnen Glasmaterialien entsorgt; `GalleryMaterialSet.dispose()` besitzt die Textur, der Material-Cache besitzt nur die Materialien.
- `dispose()` bleibt idempotent und leert Environment-Zuordnung, Geometrien, Materialien und Szene genau einmal.
- Ein WebGPU-Fehler wird ausschließlich vom bestehenden `RendererFactory`-Recoverypfad behandelt. Das Compatible-Profil wird erst nach erfolgreicher WebGL2-Auswahl aktiviert.
- Ein Material- oder Profilfehler darf keinen zusätzlichen Renderer, Canvas, Scene Graph oder stillen Qualitäts-Fallback erzeugen; er ist als Test-/QA-Fehler sichtbar zu machen.

## 9. Diagnostik und automatisierte Lesbarkeit

Die vorhandenen Canvas-Datasets für Profil und Ressourcen werden um keine produktive Steuerlogik erweitert. Tests dürfen aus den bestehenden Scene-/Material-Diagnosen Materialtyp, Environment-Zuordnung, Texturgröße und Ressourcenanzahl prüfen.

Für die sichtbare Lesbarkeit wird in Playwright bei festem Seed ein deterministischer piece-zentrierter Bildausschnitt ausgewertet. Gemessen werden (a) mittlere absolute Luminanzgradienten an der Silhouette, (b) Differenz zwischen innerem Piece-Bereich und äußerem Hintergrundring und (c) lokale Farbvarianz. Die Schwellen werden im TP gegen die eingefrorene Galerie-Baseline festgelegt; alle drei Werte müssen verhindern, dass ein lediglich global helleres oder dunkleres Canvas als Verbesserung gilt. Automatische Metriken ergänzen, ersetzen aber nicht die gepaarte Sichtprüfung.

## 10. Test- und Evidenzdesign

| Ebene | Pflichtnachweis | PRD-Bezug |
|---|---|---|
| Unit – Profilableitung | gleiche Piece-Daten, geklemmte formabhängige Optik, unterschiedliche Dickenwirkung | GLASS-AC-01, 05, 06 |
| Unit – WebGPU | `MeshPhysicalMaterial`, Transmission aktiv, `opacity=1`, Volumenwerte gesetzt, Dispersion begrenzt | GLASS-AC-03 |
| Unit – WebGL2 | `MeshStandardMaterial`, direkte Compatible-`envMap`, kalibrierte Alpha-/Rauheitswerte, keine Transmission | GLASS-AC-04, 09 |
| Unit – Geometrie/Lifecycle | gefaste Maße innerhalb Toleranz, Compound als ein sichtbares Mesh, Colliderdaten unverändert, Dispose idempotent | GLASS-AC-05, 11 |
| E2E – Zustände | Auto und Forced WebGL2 bei Start, Score 3/Overlap, Drop/Impact, High build, Game over, dreifachem Restart und Reload | GLASS-AC-01, 02, 06–09, 11 |
| E2E – Lesbarkeit | Gradient-, Innen/Außen- und Farbvarianz-Wächter plus gepaarte Screenshots | GLASS-AC-01–05, 09 |
| Performance | isolierter 20-Body-Stress je Profil, p95 Work ≤ 33,3 ms; Ressourcen/Draw Calls innerhalb Galerie-Budget | GLASS-AC-10 |
| Direkte UAT | echtes Chrome/WebGPU und Safari/WebGL2 mit gepaarten Start-, Score-3-, High-build-, Game-over- und Restart-Bildern | GLASS-AC-12 |

Headless-Auto auf dem Entwicklungshost darf WebGL2-Regressionen beweisen, aber keine echte WebGPU-Hardwareevidenz ersetzen. Console- und Page-Errors werden für alle E2E-Läufe als Fehler behandelt.

## 11. Änderungsgrenzen

Vorgesehene Implementierungsowner:

- `src/game/rendering/createMaterials.ts`
- `src/game/rendering/createScene.ts`
- zugehörige Unit-/E2E-Tests und ausschließlich testbezogene Hilfen

Nur falls die vorhandenen Exporte für reine Tests nicht genügen, darf ein schmaler Diagnoseexport im jeweiligen Rendering-Owner ergänzt werden. `RendererFactory.ts`, Piece-Katalog, Physik, Store, Eingaben, UI, Score und Persistenz sind nicht Teil der Änderung.

## 12. Abgelehnte Alternativen

- Szenenweite Compatible-Environment: verworfen, weil sie genehmigte Galerieoberflächen mitverändert.
- Alpha-Transparenz zusätzlich zur WebGPU-Transmission: verworfen, weil sie Reflexion und Volumenwirkung auswaschen kann.
- Transparente Zweithüllen oder Edge-Meshes: verworfen wegen Sortierproblemen, Draw Calls und paralleler Materialstruktur.
- Fullscreen-Outline/Postprocessing: verworfen wegen zusätzlichem Pass und stilistisch unpassender Kontur.
- Externe HDR-Assets: verworfen wegen Netzwerk-, Lizenz-, Lifecycle- und Determinismusaufwand.

## 13. Offene Kalibrierpunkte für TP/CD

- Exakte Parameter innerhalb der festgelegten Bereiche werden durch gepaarte Bilder und Performanceevidenz bestimmt.
- Die finalen Lesbarkeitsschwellen werden aus der eingefrorenen Galerie-Baseline abgeleitet und im TP als ausführbare Assertions festgeschrieben.
- Dispersion bleibt nur aktiv, wenn GLASS-AC-03 und GLASS-AC-10 gleichzeitig erfüllt sind.

## Context Graph

- context_graph_impact: `none`
- context_graph_refs: none
- context_graph_reconciliation: `not_applicable`
- context_graph_required_action: `none`
- context_graph_gate_effect: `none`
- context_graph_evidence: Das Design konkretisiert ausschließlich den run-spezifischen Material-Slice und ersetzt keine übergreifende Architektur-SoT.
