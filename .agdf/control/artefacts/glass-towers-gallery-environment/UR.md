# UR: Verfeinerte, vollstaendig gerenderte Galerieumgebung

Status: approved
Gate: UR
Gate approval: `Approval: UR` vom 2026-08-20 fuer Revision `eaaa80a1-f6fc-4566-8f5b-3926a7ff3375`
Datum: 2026-08-20
Owner: Product Owner

## 1. Problem

Die aktuelle Galerieumgebung wirkt durch einfache Flaechen, grobe Geometrie und gleichfoermige Standardmaterialien wie ein statischer Bildhintergrund. Dadurch erreichen Sockel, Raum und Glasobjekte nicht die angestrebte visuelle Qualitaet und raeumliche Tiefe.

## 2. Ziel

Die Spielszene soll als zusammenhaengende, vollstaendig in 3D gerenderte Galerie wahrgenommen werden. Verfeinerte Architektur, Materialien und Shader sollen glaubwuerdige Tiefe, Lichtreaktion und hochwertige Oberflaechen erzeugen, waehrend Turm, aktive Form und Spielzustand jederzeit klar lesbar bleiben.

## 3. Umfang

- Die bisher flach oder niedrig aufgeloest wirkenden Galerieelemente durch verfeinerte, wiederverwendbare 3D-Geometrie ersetzen.
- Einen vollstaendig gerenderten raeumlichen Hintergrund statt einer bildhaften oder ebenen Rueckwandkomposition schaffen.
- Galerie-, Sockel- und Umgebungsoberflaechen durch geeignete Materialien und Shader differenzieren.
- Licht, Schatten, Reflexionen, Nebel und Tiefenstaffelung als ein konsistentes Galerie-Studio abstimmen.
- Die visuelle Qualitaet fuer WebGPU und den Safari-tauglichen WebGL2-Fallback capability-basiert erhalten.
- Die bestehende Kamera- und Spielszenenlesbarkeit auf Desktop- und mobilen Viewports bewahren.

## 4. Nicht-Ziele

- Keine Aenderung an Spielregeln, Physik, Scoring, Eingaben, Bestwert oder Game-over-Ablauf.
- Kein neuer Rendererpfad und keine Aenderung der freigegebenen WebGPU-/WebGL2-Fallbacklogik.
- Keine neue Netzwerk-, Konto-, Persistenz-, Telemetrie- oder Deploymentfunktion.
- Keine ungepruefte Abhaengigkeit von extern gehosteten Laufzeit-Assets.

## 5. Akzeptanzsignale

- Die sichtbare Umgebung besteht aus raeumlicher 3D-Geometrie und zeigt aus der Spielkamera keine flache Bild- oder Kulissenwirkung.
- Sockel, Boden, Waende beziehungsweise architektonische Elemente besitzen verfeinerte Silhouetten, Kanten und materialtypische Lichtreaktionen.
- Glasobjekte bleiben vor allen relevanten Hintergrundbereichen klar lesbar; Score, Vorschau und Eingabehinweise bleiben unbeeintraechtigt.
- WebGPU und erzwungener WebGL2-Fallback zeigen dieselbe Galeriekomposition mit zulaessiger, dokumentierter Effektabstufung.
- Build, Lint, relevante automatisierte Tests und sichtbare Browserlaeufe fuer Desktop und Mobil bleiben ohne Konsolenfehler.
- Die Performance bleibt innerhalb spaeter im Task-/Testplan festgelegter, browserbezogener Budgets.

## 6. Bestehende Source of Truth

- `.agdf/control/artefacts/glass-towers/PRD.md` besitzt weiterhin Spielziel, Nutzerfluss, Renderer-Fallback und visuelle Grundanforderungen.
- `.agdf/control/artefacts/glass-towers/SD.md` besitzt weiterhin `GameRuntime`, `RendererFactory`, `GameStore`, einen Frame Loop sowie die gemeinsame Szene fuer WebGPU und WebGL2.
- `src/game/rendering/createScene.ts` ist der aktuelle Owner fuer Galeriegeometrie, Kamera und Studiolicht.
- `src/game/rendering/createMaterials.ts` ist der aktuelle Owner fuer Galerie- und Glasmaterialien.
- `src/game/rendering/RendererFactory.ts` bleibt der einzige Owner der Rendererwahl und darf durch diesen Umfang nicht dupliziert werden.

## 7. Risiken und offene Punkte

- Brownfield Review muss klaeren, ob die neue Umgebung als kompakter Slice aus den vorhandenen Szenen- und Material-Ownern umgesetzt werden kann.
- PRD beziehungsweise SD muessen den beabsichtigten Galeriecharakter, die sichtbaren Architekturmerkmale, Shader-Fallbacks und Performancegrenzen ausreichend konkretisieren.
- Die Loesung darf keine zweite Szene, keinen zweiten Frame Loop und keine getrennten WebGPU-/WebGL2-Welten erzeugen.
- Neue Geometrie, Schatten oder Shader koennen GPU-, Speicher- und Ladebudget erhoehen; Qualitaetsstufen und Wiederverwendung muessen messbar bleiben.
- Vorhandene uncommittete Safari-Fallbackaenderungen gehoeren zum abgeschlossenen Run `glass-towers` und duerfen nicht in diesen Umfang vermischt werden.

## 8. Naechster Schritt

Diese UR pruefen und nur mit folgendem exakten Wert freigeben:

`Approval: UR`
