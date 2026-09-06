# User Requirements: WebGPU- und WebGL2-Glasmaterialien

Status: approved
Run: `glass-towers-webgpu-glass-materials`
Stand: 2026-08-21
Approval: `Approval: UR` vom 2026-08-21 für Revision `a7171196-54a7-4155-9400-a6a02bd8bfbf`

## Problem

Die vorhandenen pastellfarbenen Glasobjekte sind vor der hellen, ebenfalls pastellfarbenen Galerie zu wenig kontrastreich. Im WebGPU-Profil kombiniert das Material physikalische Transmission mit klassischer Alpha-Transparenz; zudem verwenden alle Formen dieselben optischen Parameter und die lokale Reflexionsumgebung bietet nur begrenzte Hell-Dunkel-Kanten.

## Ziel

Die WebGPU-Darstellung soll die Übertragungsqualität, räumliche Tiefe, Farbtrennung und Silhouettenlesbarkeit der Glasobjekte deutlich verbessern. WebGL2 soll eine entsprechend optimierte, aber kostengünstigere Glasdarstellung erhalten. Die Objekte sollen in beiden Backends als hochwertiges, unterschiedlich gefärbtes Glas erkennbar bleiben, ohne Spielmechanik oder Physik zu verändern.

## Nutzeranforderungen

- WebGPU-Glas verwendet physikalisch konsistente Transmission, Reflexion und Volumenabsorption.
- Pastellfarben bleiben unterscheidbar; Kanten, Überlagerungen und Kontaktzonen bleiben vor der hellen Galerie lesbar.
- Dünne, dicke und zusammengesetzte Formen dürfen optisch unterschiedlich reagieren, ohne ihre Collider oder Masseneigenschaften zu ändern.
- Bewegung, Aufprall, Stapelung, hoher Turm und Vorschau bleiben auf Desktop und Mobil klar erkennbar.
- WebGL2 erhält ein eigenständig kalibriertes Compatible-Profil mit klareren Reflexionen, kräftigerer Farbtrennung und lesbaren Überlagerungen, ohne die teuren WebGPU-Effekte vorauszusetzen.
- WebGPU und WebGL2 müssen dieselben Formen, Farben und räumlichen Anker zeigen; die optische Qualität darf backendgerecht abgestuft sein.
- Die Optimierung bleibt innerhalb der bestehenden Material-, Geometrie-, Szenen- und Lifecycle-Owner und erzeugt keinen zweiten Renderpfad.
- Lint, Unit-, Browser-, Performance- und direkte reale WebGPU-Sichtprüfung müssen die Änderung belegen.

## Empfohlene zusätzliche Optimierung

Neben korrekten Materialparametern soll die spätere Lösung eine gezielte optische Kontraststaffelung prüfen: kontrastreiche Studio-Reflexionsbänder in backendgerecht aufgelösten lokalen Umgebungen kombiniert mit kleinen visuellen Fasen an harten Glaskanten. Dadurch entstehen in WebGPU und WebGL2 stabile Kantenlichter und lesbare Silhouetten, ohne Outline-Postprocessing oder zusätzliche transparente Hüllen.

Für WebGL2 ist besonders zu prüfen, die bereits erzeugte kleine Compatible-Environment tatsächlich für das Glas nutzbar zu machen. Der aktuelle Compatible-Pfad setzt `scene.environment` auf `null`, sodass `envMapIntensity` des Glasmaterials keine Umgebungsreflexion verstärken kann. Das WebGL2-Profil soll Standard-PBR und Alpha-Transparenz behalten, aber Reflexionskontrast, Opazität, Rauheit und Farbsättigung gemeinsam kalibrieren.

## Akzeptanzgrenze

- Direkter Vorher-/Nachher-Vergleich in echtem Chrome/WebGPU sowie Safari/WebGL2 für Start, drei gestapelte Teile, überlappende Teile und hohen Aufbau.
- Keine nahezu unsichtbaren oder flächig milchigen Formen vor der Galerie.
- Keine neue Console-/Page-Error-Klasse, kein schwarzer Frame und kein sichtbarer Sortierfehler bei transparenten Überlagerungen.
- Bestehende Gameplay-, Restart-, Ressourcen- und Performancegrenzen bleiben erfüllt.

## Nicht-Ziele

- Keine Änderung an Steuerung, Score, Physik, Piece-Sequenz oder Failure-Semantik.
- Keine Änderung an Rendererwahl oder Fallbackentscheidung; nur die visuelle Qualität des bereits gewählten Compatible-Profils darf verbessert werden.
- Kein globales Postprocessing, kein Outline-Pass und kein separater Glas-Renderer ohne späteren SD-Nachweis einer zwingenden Notwendigkeit.

## Offene Entscheidungen für Brownfield Review / PRD

- Ob formbezogene optische Profile aus vorhandenen Dimensionen abgeleitet oder explizit katalogisiert werden.
- Welche minimale Fase je Geometrietyp visuell wirksam bleibt, ohne das Geometriebudget zu gefährden.
- Welche messbaren Kontrast- und Performancekriterien den direkten WebGPU-Vergleich ergänzen.
- Ob die Compatible-Environment szenenweit oder ausschließlich am Glas gebunden wird, damit Galerieoberflächen nicht unbeabsichtigt verändert werden.
