# PRD: Lesbare Glasmaterialien in WebGPU und WebGL2

Status: approved
Gate: PRD
Gate approval: `Approval: PRD` vom 2026-08-21 für Revision `da3a502b-f152-4a9d-b81e-3a8f84c5f867`
Run: `glass-towers-webgpu-glass-materials`
Stand: 2026-08-21
Based on: [UR](UR.md), [Brownfield Review](BROWNFIELD_REVIEW.md)

## Produktziel

Glass Towers soll in beiden vorhandenen Renderprofilen eindeutig als Spiel mit hochwertigen farbigen Glasobjekten lesbar sein. WebGPU darf seine physikalische Transmission und erweiterten optischen Eigenschaften sichtbar ausspielen; WebGL2 erhält eine performante, reflektierende und kontrastreiche Compatible-Darstellung. Beide Profile teilen Formen, Farben, Komposition und Spielsemantik.

## Nutzerproblem

Die pastellfarbenen Objekte verlieren vor den hellen, ebenfalls pastellfarbenen Galerieflächen an Kontur. Flächen wirken teilweise milchig oder flach, überlagerte Teile sind schwer zu trennen, und unterschiedliche Formdicken erzeugen zu wenig optische Variation. Im aktuellen WebGL2-Profil kann die konfigurierte Reflexionsintensität mangels aktiver Environment nicht vollständig wirken.

## Zielgruppen und Nutzungskontext

- Spieler in aktuellen Chrome-/Chromium-Browsern mit funktionsfähigem WebGPU.
- Spieler in Safari oder anderen Browsern, die den vorhandenen WebGL2-Compatible-Pfad verwenden.
- Desktop- und mobile Nutzer während Vorschau, Zielen, Fall, Aufprall, Stapelung, hohem Aufbau, Game over und Restart.

## Produktanforderungen

### Gemeinsame sichtbare Qualität

- Jedes Teil besitzt eine klar erkennbare Silhouette, sichtbare Kantenreaktion und eine vom Hintergrund unterscheidbare Pastellfarbe.
- Zwei oder mehr überlappende Teile bleiben als getrennte Volumen erkennbar; Kontaktflächen und Stapelreihenfolge dürfen nicht zu einer homogenen hellen Fläche verschmelzen.
- Dünne, dicke, zylindrische und zusammengesetzte Formen zeigen nachvollziehbar unterschiedliche optische Tiefe, ohne Collider, Masse oder Schwerpunkt zu verändern.
- Vorschau und aktives Spielobjekt verwenden dieselbe backendgerechte Materialidentität.
- Die Verbesserung gilt bei Start, Bewegung, Fall, Aufprall, ruhender Stapelung, hohem Turm, Game over und nach Restart.

### WebGPU High

- Hintergrund und benachbarte Objekte sind durch das Glas mit kohärenter, farblich getönter Transmission wahrnehmbar.
- Reflexion, Transmission, Volumenabsorption und Kantenhighlights wirken zusammen; klassische Alpha-Transparenz darf die physikalische Reflexion nicht sichtbar auswaschen.
- Optional eingesetzte Dispersion bleibt subtil und unterstützt Materialtiefe, ohne Text, Formkonturen oder Farbidentität durch Regenbogensäume zu stören.
- Das High-Profil darf höhere optische Qualität nutzen, muss aber innerhalb des bestehenden 20-Body-Performancebudgets bleiben.

### WebGL2 Compatible

- Das Compatible-Profil bleibt ohne verpflichtende physikalische Transmission oder Dispersion performant und Safari-tauglich.
- Standard-PBR-Reflexionen müssen sichtbar zur Formlesbarkeit beitragen; konfigurierte Reflexionsstärke darf nicht durch eine fehlende Environment wirkungslos bleiben.
- Alpha-Transparenz, Rauheit, Reflexion und Farbstärke müssen gemeinsam so kalibriert sein, dass Objekte weder deckend-plastisch noch flächig ausgewaschen erscheinen.
- Die Galerie darf durch eine Compatible-Environment nicht unbeabsichtigt ihre genehmigte Helligkeit, Farbwirkung oder Materialhierarchie verlieren.

## Arbeitsmodi und sichtbare Zustände

| Modus / Zustand | Erwartete sichtbare Wirkung |
|---|---|
| WebGPU High | physikalische Transmission, Volumenfarbe, deutliche Reflexions- und Kantenreaktion |
| WebGL2 Compatible | performante Alpha-Transparenz mit klaren Standard-PBR-Reflexionen und stabiler Farbtrennung |
| Next-Piece-Vorschau | Form, Farbe und Glascharakter vor dem Ablegen unmittelbar erkennbar |
| Aiming / Bewegung | Silhouette bleibt vor wechselnden hellen und dunklen Galeriebereichen stabil lesbar |
| Drop / Impact | keine schwarzen Frames, Materialausfälle oder störenden Sortiersprünge |
| Settled / Overlap | einzelne Volumen, Reihenfolge und Kontaktzonen bleiben unterscheidbar |
| High build | Glas bleibt vor Rückraum, Lichtfeldern und Seitenfassungen lesbar |
| Game over / Restart | Materialprofil bleibt korrekt; keine zusätzliche Szene, Environment oder Ressource entsteht |

## Aktivierung, Fallback und Recovery

- Das Materialprofil wird ausschließlich aus der bereits erfolgreichen Rendererwahl abgeleitet.
- Ein WebGPU-Initialisierungs- oder Präsentationsfehler nutzt weiterhin genau den vorhandenen WebGL2-Fallback.
- Diese Änderung fügt keinen weiteren Renderer-, Recovery- oder Profilpfad hinzu.
- Restart, Reload und Backend-Fallback dürfen keine Material-, Textur- oder Environment-Ressourcen duplizieren.

## Akzeptanzkriterien

| ID | Kriterium |
|---|---|
| GLASS-AC-01 | In gepaarten Startbildern sind alle fünf Piece-Farben in beiden Profilen vor der Galerie klar unterscheidbar. |
| GLASS-AC-02 | Bei mindestens drei gestapelten beziehungsweise überlappenden Teilen bleiben Silhouetten, Volumengrenzen und Stapelreihenfolge visuell trennbar. |
| GLASS-AC-03 | WebGPU zeigt kohärente farbige Transmission und Reflexion ohne milchiges Auswaschen, schwarze Flächen oder dominante chromatische Säume. |
| GLASS-AC-04 | WebGL2 zeigt sichtbare Standard-PBR-Reflexionen und klare Farbtrennung, ohne physikalische Transmission als Voraussetzung. |
| GLASS-AC-05 | Dünne, dicke, zylindrische und zusammengesetzte Formen zeigen erkennbar unterschiedliche optische Tiefe bei unveränderter Physik. |
| GLASS-AC-06 | Vorschau, aktives Teil und abgelegtes Teil behalten innerhalb desselben Backends dieselbe Farb- und Materialidentität. |
| GLASS-AC-07 | Drop, Impact, hohe Stapelung, Game over und Restart erzeugen keine schwarzen Frames, sichtbaren Shaderausfälle oder neue Console-/Page-Errors. |
| GLASS-AC-08 | Auto-WebGPU und Forced-WebGL2 behalten identische Raumanker, Kamera, Formen, Farben, Steuerung, Score- und Failure-Semantik. |
| GLASS-AC-09 | Safari/WebGL2 behält die genehmigte Galeriehierarchie; Materialoptimierung macht Boden, Wände oder Lichtfelder nicht flach, überbelichtet oder farbstichig. |
| GLASS-AC-10 | Der bestehende isolierte 20-Body-Test bleibt je Profil bei p95 Work ≤ 33,3 ms; Ressourcen bleiben innerhalb der genehmigten Galerie-/Renderbudgets. |
| GLASS-AC-11 | Drei Restarts und ein Reload behalten genau einen Canvas, eine Szene, eine aktive Environment-Zuordnung und stabile Ressourcen-/Materialzähler. |
| GLASS-AC-12 | Direkte UAT in echtem Chrome/WebGPU und Safari/WebGL2 bestätigt Start, Score 3 mit Überlagerung, hohen Aufbau, Game over und Restart anhand gepaarter Screenshots. |

## Evidenzanforderungen

- Automatisierte Desktop- und Mobilbilder für Auto und Forced WebGL2 bei Start, Score 3/Überlagerung, Hochbau und Game over.
- Ein automatisierter Kontrast-/Lesbarkeitswächter, der nicht nur mittlere Canvas-Helligkeit, sondern Piece-zu-Hintergrund- beziehungsweise Kantenvariation prüft.
- Unit-Tests für Profiltyp, physikalische WebGPU-Invarianten, Compatible-Environment-Wirkung, formabhängige optische Eingaben und idempotentes Dispose.
- Gameplay-, Fallback-, Restart-, Performance- und Ressourcenregressionen.
- Direkte Vorher-/Nachher-Evidenz auf echtem Chrome/WebGPU und Safari/WebGL2; Headless-Auto auf diesem Host ist kein Ersatz für echte WebGPU-Evidenz.

## Leistungs- und Ressourcenrahmen

- Bestehende Grenze p95 Work ≤ 33,3 ms im isolierten 20-Body-Stresslauf je Backendprofil.
- Kein zusätzlicher Fullscreen-Postprocessing-Pass und kein zweiter Renderer.
- Keine transparente Zweithülle pro Piece als Standardlösung.
- Render-only Fasen dürfen Colliderzahl, Physikschritte und Spielzustandsarbeit nicht erhöhen.
- Lokale Texturen müssen deterministisch, lifecycle-owned und innerhalb des bestehenden Texturbudgets bleiben.

## Abhängigkeiten

- Die post-fix Galerie-QA/UAT oder eine ausdrücklich eingefrorene Galerie-Baseline muss vor der Material-Vorher-/Nachher-Abnahme vorliegen.
- Three.js `0.185.1` und die bestehenden `MeshPhysicalMaterial`-/`MeshStandardMaterial`-Pfade bilden die technische Capability-Basis.
- Rendererwahl und Fallbackvertrag aus dem bestehenden Glass-Towers-SD bleiben bindend.

## Nicht-Ziele

- Keine Änderung an Spielregeln, Eingaben, Score, Bestwert, Piece-Sequenz, Dichte, Collider oder Schwerpunkt.
- Keine neue Rendererwahl, kein weiterer Fallback und kein erzwungenes WebGPU für inkompatible Geräte.
- Kein globaler Outline-Pass, kein zweiter Scene Graph, kein externer HDR-Download und kein eigener Glas-Renderer.
- Keine exakte Festlegung von Materialparametern, Environment-Bindung oder Fasenradius im PRD; diese Entscheidungen gehören in das SD.

## Offene Solution-Design-Entscheidungen

- Ableitung formabhängiger optischer Tiefe aus Dimensionen versus zentrale optische Profilfunktion.
- Szenenweite oder glaslokale Bindung der Compatible-Environment.
- Geometrietyp-spezifische render-only Fasen innerhalb des Vertex-/Geometriebudgets.
- Minimal sinnvolle Dispersion und Environment-Auflösung im High-Profil.
- Robuste automatisierbare Kontrastmetrik zusätzlich zur direkten Sichtprüfung.

## Context Graph

- context_graph_impact: `none`
- context_graph_refs: none
- context_graph_reconciliation: `not_applicable`
- context_graph_required_action: `none`
- context_graph_gate_effect: `none`
- context_graph_evidence: Anforderungen sind run-spezifisch; bestehende Produkt- und Architektur-SoT werden nicht ersetzt.
