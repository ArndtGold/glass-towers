# PRD: Verfeinerte, vollständig gerenderte Galerieumgebung

Status: approved
Gate: PRD
Gate approval: `Approval: PRD` vom 2026-08-20 für Revision `efcdc963-3930-4e79-9afc-dea1837f31f7`
Based on: [UR](UR.md), [Brownfield Review](BROWNFIELD_REVIEW.md)
Date: 2026-08-20
Owner: Product Owner

## 1. Produktumfang

Glass Towers erhält innerhalb der bestehenden Spielszene eine hochwertige, vollständig in 3D gerenderte Galerieumgebung. Sie ersetzt den aktuellen Eindruck aus flacher Rückwand, einfachen Paneelen und gleichförmigen Oberflächen durch eine räumlich geschlossene, minimalistische Studioarchitektur mit verfeinerter Geometrie, differenzierten Materialien und überzeugender Lichtreaktion.

Der Umfang ist ein begrenzter visueller Slice. Spielregeln, Physik, Eingaben, Wertung, Bestwert, Game-over, Rendererwahl und Recovery bleiben unverändert.

### PRD-GAL-01 — Räumliche Galeriekomposition

Die Spielkamera zeigt eine zusammenhängende Galerie mit wahrnehmbarer Boden-, Wand-, Seiten- und Höhenstaffelung. Perspektive, Überdeckung, Kontakt und Lichtverlauf vermitteln einen echten Innenraum statt einer flachen Kulisse.

### PRD-GAL-02 — Vollständig gerenderter Hintergrund

Alle dominanten Hintergrundelemente gehören zur 3D-Welt und reagieren auf Kamera, Licht, Nebel und Tiefenstaffelung. Eine bildschirmfüllende Bilddatei, ein statisches Hintergrundfoto oder eine alleinige ebene Rückwand darf den Raumeindruck nicht tragen.

### PRD-GAL-03 — Verfeinerte Geometrie

Sockel und sichtbare Architektur besitzen saubere Proportionen, ablesbare Kanten, kontrollierte Fugen oder Rücksprünge und glaubwürdige Kontaktzonen. Grobe Platzhalterformen und unbeabsichtigt scharf wirkende Low-Quality-Kanten sind nicht Teil des finalen Bildes.

### PRD-GAL-04 — Material- und Shadercharakter

Die Galerie verwendet eine ruhige, warme Museumspalette mit mindestens zwei klar unterscheidbaren Oberflächenfamilien: einer hellen mineralischen Hauptarchitektur und zurückhaltenden Akzentflächen beziehungsweise Einfassungen. Rauheit, Glanz, Normalwirkung, Reflexion und Lichtantwort müssen Materialunterschiede sichtbar machen, ohne den minimalistischen Charakter zu verlieren.

### PRD-GAL-05 — Glaslesbarkeit

Transluzente Spielobjekte bleiben gegenüber Boden, Sockel und Hintergrund in Silhouette, Kanten, Überlagerung und Bewegung lesbar. Die Umgebung darf weder die Glasfarben auswaschen noch stabile und fallende Formen visuell verschlucken.

### PRD-GAL-06 — Licht, Schatten und Tiefe

Weiches Studio-Hauptlicht, Füllung und Kantenlicht bilden Volumen, Materialwechsel und räumliche Ebenen ab. Kontakt- und Schlagschatten verankern den Sockel und die Architektur. Lichtquellen und helle Flächen dürfen keine großflächig ausgebrannten oder kontrastlosen Spielbereiche erzeugen.

### PRD-GAL-07 — Backendgerechte Qualitätsstufen

WebGPU und WebGL2 zeigen dieselbe Galeriekomposition und dieselben gameplayrelevanten Sichtbeziehungen. WebGL2 darf Auflösung, Schatten, Reflexion, Materialdetails oder vergleichbare Effekte reduzieren, aber keine tragenden Raumteile entfernen und keinen anderen Spielmodus erzeugen.

### PRD-GAL-08 — Kamera- und Viewportkontinuität

Die Galerie bleibt während der vorhandenen vertikalen Kameranachführung räumlich geschlossen. Auf Desktop- und mobilen Viewports bleiben Sockel, aktive Form, Turmspitze und HUD lesbar; es entstehen keine sichtbaren Kulissenenden, Leerflächen oder störenden Architekturüberschneidungen innerhalb der später definierten Testhöhen.

### PRD-GAL-09 — Spiel- und Recovery-Invarianten

Galeriegeometrie beeinflusst keine Piece-Kollision, Stabilisierung, Fallgrenze, Wertung oder Eingabe. Restart und Renderer-Retry erzeugen weiterhin genau eine saubere Szene, eine Physikwelt und einen Frame Loop. Ein nicht unterstützter Qualitätseffekt wird abgestuft; erst das Scheitern beider bestehenden Rendererpfade führt in den Kompatibilitätszustand.

### PRD-GAL-10 — Gebündelte Ressourcen und Performance

Neue Galerie-Ressourcen sind prozedural erzeugt oder lokal gebündelt und benötigen keinen zusätzlichen Laufzeit-Netzwerkabruf. Die Szene hält das bestehende 20-Body-Arbeitsbudget ein und erzeugt in den geprüften Chromium-/WebKit-Pfaden keine Konsolen- oder Seitenfehler.

## 2. UX-Intent und Erfolg

- ui_ux_impact: `low`
- ux_intent_definition: direkt definierte Low-Impact-Semantik aus freigegebener UR und abgeschlossenem Brownfield Review; separate UX Intent Definition ist `not_applicable`
- primary_user_intent: Beim Balancieren eine hochwertige, räumlich glaubwürdige Galerie erleben, ohne dass die Umgebung von der Skulptur oder der nächsten Handlung ablenkt.
- success_signal: Die Galerie wird aus den vorgesehenen Spielkameras eindeutig als vollständig gerenderter 3D-Raum wahrgenommen; Glas, Sockel, Turm und UI bleiben in beiden Rendererpfaden klar lesbar und performant.
- primary_decision_or_action: Unverändert die aktuelle Glasform horizontal positionieren und per Klick, Tap oder Leertaste fallen lassen.

## 3. Arbeitsmodi und effektiver Zustand

| working_mode | effective_state | visible_state_types | effective_state_authority | primary_state_presentation_owner |
|---|---|---|---|---|
| Start / Rendererinitialisierung | Die Anwendung prüft WebGPU und fällt bei Bedarf auf WebGL2 zurück; die Galerie ist erst nach einer stabilen Rendererpräsentation aktiv. | Ladezustand, anschließend Rendererbadge und 3D-Szene | Bestehender Start- und Rendererzustand | App-Shell für Status; Spielcanvas für die Galerie |
| Aktiver Lauf | Die vorhandenen Phasen `aiming`, `dropping` und `settling` entscheiden Eingaben und Physik; die Galerie ist ein nicht autoritativer visueller Kontext. | Galerie, Sockel, aktive beziehungsweise fallende Form, Turm, Score, Bestwert, Vorschau und Hinweis | Bestehender Spielzustand | Spielcanvas für Welt und Objekte; HUD für Status |
| Game over | Der Lauf ist beendet; Galerie und gefallene Skulptur bleiben als räumlicher Kontext sichtbar. | Gerenderte Szene, Game-over-Dialog, Endstand, Bestwert und Neustart | Bestehender Spielzustand | App-Shell-Dialog über dem Spielcanvas |
| Kompatibilitätsfehler | Beide Rendererpfade sind fehlgeschlagen; eine vollständige 3D-Galerie kann nicht garantiert werden. | Verständlicher Fehlerzustand mit Retry beziehungsweise Browser-/Gerätehinweis | Bestehender Renderer- und Recoveryzustand | App-Shell-Fehlerfläche |

## 4. Aktivierung, Blocker, Recovery und Übergänge

- activation_and_deactivation: Die Galerie wird gemeinsam mit dem bestehenden `renderer-ready`-Übergang sichtbar, bleibt über einen Lauf und Restart aktiv und wird beim bestehenden Runtime-Dispose vollständig abgebaut. Es gibt keinen separaten Galerie-Modus oder Aktivierungsschalter.
- blockers_and_visible_next_actions: Ein einzelner nicht unterstützter Shader- oder Qualitätseffekt blockiert den Lauf nicht, sondern verwendet die zulässige niedrigere Qualitätsstufe. Scheitern WebGPU und WebGL2, bleibt der vorhandene Kompatibilitätszustand mit Retry die einzige sichtbare Blockade.
- recovery_paths: Restart setzt wie bisher nur den Lauf zurück und behält dieselbe Galerie. Renderer-Retry baut dieselbe Galerie in genau einer neuen Runtime auf. Viewportänderungen werden ohne Reload in eine weiterhin lesbare Komposition überführt.
- relevant_state_transitions:
  - Start → Renderer bereit: stabile Präsentation aktiviert die vollständige Szene und zeigt das Backendbadge; bei WebGPU-Fehler folgt automatisch WebGL2.
  - Renderer bereit → aktiver Lauf: Galerie, Sockel und aktive Form erscheinen gemeinsam; es gibt keinen nachgeladenen Hintergrundsprung.
  - Aktiver Lauf → Game over: Umgebung bleibt konsistent sichtbar, der Dialog wird darüber eingeblendet.
  - Game over → Restart: Spielobjekte werden zurückgesetzt, die Galerie bleibt einmalig vorhanden.
  - Beliebiger gerenderter Zustand → Resize: Kamera und Komposition passen sich an; HUD und Spielobjekte bleiben lesbar.
  - Beide Renderer fehlgeschlagen → Kompatibilitätsfehler: sichtbare Erklärung und Retry; keine unvollständige Ersatzgalerie.

## 5. Akzeptanzkriterien

| criterion_id | working_mode | source_state | trigger/action | expected_effective_state | visible_feedback | blocker/failure behavior | recovery/next action | observable success | required evidence |
|---|---|---|---|---|---|---|---|---|---|
| GAL-AC-01 | Aktiver Lauf | Renderer bereit | Spielszene öffnen | Eine räumlich geschlossene Galerie rahmt den zentralen Sockel | Boden, Seiten-/Rückraum und Höhenstaffelung zeigen Perspektive, Überdeckung und Lichttiefe | Fehlende Raumebenen oder eine dominante flache Rückwand sind ein Produktfehler | Szene überarbeiten | Aus der festen Startkamera ist ohne Erklärung ein zusammenhängender Innenraum erkennbar | Desktop-Screenshots in Chromium und WebKit |
| GAL-AC-02 | Aktiver Lauf | Galerie sichtbar | Kamera folgt einer wachsenden Skulptur | Der Hintergrund bleibt innerhalb der festgelegten Testhöhe vollständig und räumlich kontinuierlich | Keine Kulissenränder, leeren Farbfelder, Clippingflächen oder abrupten Fog-Brüche | Sichtbares Ende der Umgebung blockiert die Abnahme | Geometrie-/Kameragrenzen korrigieren | Start-, mittlere und hohe Turmsituation zeigen denselben kohärenten Raum | Screenshotfolge mit definierter Mehrteil-Turmhöhe |
| GAL-AC-03 | Aktiver Lauf | Galerie sichtbar | Sockel und Architektur betrachten | Verfeinerte Silhouetten und Kontaktzonen ersetzen Platzhaltercharakter | Ablesbare Kanten, Fugen/Rücksprünge und Kontaktverschattung | Harte Low-Poly-/Plane-Wirkung oder schwebende Bauteile gelten als Fehler | Geometrie und Beleuchtung nacharbeiten | Sockel und mindestens zwei Architekturtypen zeigen nachvollziehbare Formdetails | Nah- und Gesamtscreenshots beider Renderer |
| GAL-AC-04 | Aktiver Lauf | Galerie sichtbar | Licht trifft Haupt- und Akzentoberflächen | Mindestens zwei Oberflächenfamilien reagieren unterscheidbar auf Licht | Mineralische Hauptfläche und Akzentfläche unterscheiden sich in Rauheit, Glanz oder Relief | Gleichförmige, ausgewaschene oder flackernde Oberfläche gilt als Fehler | Materialstufe korrigieren oder sauber degradieren | Materialwechsel ist in hellen und schattigen Bereichen sichtbar | Visuelle Vergleichsevidenz WebGPU/WebGL2 |
| GAL-AC-05 | Aktiver Lauf | `aiming`, `dropping`, `settling` | Formen bewegen, fallen lassen und stapeln | Glas bleibt in jeder Phase gegenüber der Umgebung lesbar | Kanten, Farbe, Überlagerung und Bewegung sind erkennbar | Form verschmilzt über relevante Bildbereiche mit dem Hintergrund | Kontrast, Licht oder Material abstimmen | Jede Katalogform bleibt in repräsentativen Positionen klar lokalisierbar | Screenshotmatrix plus vollständiger Gameplaylauf |
| GAL-AC-06 | Start / Rendererinitialisierung | Auto oder erzwungenes WebGL2 | Anwendung starten | Beide Backends zeigen dieselbe Raumkomposition und tragenden Geometrien | Backendbadge darf Qualität, nicht Inhalt unterscheiden | Fehlende Raumteile oder anderer Bildaufbau im Fallback gelten als Fehler | Effektqualität reduzieren, gemeinsame Komposition erhalten | Referenzpunkte, Sockel und Architekturelemente stimmen in beiden Pfaden überein | Gepaarte Chromium-/WebKit-Screenshots |
| GAL-AC-07 | Aktiver Lauf | Desktop- oder Mobilviewport | Start, Resize und mehrere Drops | Spielobjekte und HUD bleiben frei lesbar | Sockel, aktive Form, Turmspitze, Score, Vorschau und Hinweis bleiben sichtbar | Architektur verdeckt Spiel oder UI beziehungsweise erzeugt horizontales Clipping | Responsive Komposition korrigieren | Definierte Desktop- und Mobilviewports bestehen ohne Überdeckung | Viewportmatrix mit Screenshots und DOM-Prüfungen |
| GAL-AC-08 | Aktiver Lauf | Beliebige Spielphase | Drop, Kollision, Stabilisierung, Fall und Restart | Galerie verändert keine Spielsemantik oder Physik | Score, Game over, Bestwert und Neustart verhalten sich unverändert | Zusätzliche Kollision, Doppel-Frame-Loop oder Zustandsabweichung blockiert | Bestehende Ownergrenzen wiederherstellen | Vorhandene Gameplay-Suite besteht unverändert in Chromium und WebKit | Unit-/Integrations- und Playwright-Ergebnisse |
| GAL-AC-09 | Start / Recovery | Hohe Qualität nicht verfügbar | Shader-/Effektfähigkeit fehlt | Anwendung verwendet eine lesbare kompatible Qualitätsstufe | Kein neuer Fehlerdialog nur wegen eines optionalen Effekts | Nur das Scheitern beider Renderer darf den Kompatibilitätszustand auslösen | Bestehenden Retry verwenden | Erzwungenes WebGL2 startet Galerie und Kernspiel ohne Konsolenfehler | Renderer-Regression plus WebKit-Lauf |
| GAL-AC-10 | Aktiver Lauf | 20 Physikkörper in der Szene | Zehnsekündige Stressprobe | Galerie und Spiel bleiben innerhalb des bestehenden Arbeitsbudgets bedienbar | Keine sichtbare Blockade; Messwerte werden erfasst | p95-Arbeitszeit über `33,3 ms`, Konsolen- oder Seitenfehler blockieren QA | Qualität reduzieren oder Renderpfad optimieren | Auto und erzwungenes WebGL2 erfüllen das Budget in der festgelegten Browsermatrix | Performance-JSON und fehlerfreie Browserlogs |
| GAL-AC-11 | Start / Lauf / Dispose | Seite laden, neu starten und Runtime neu aufbauen | Neue Galerie-Ressourcen bleiben lokal und werden kontrolliert wiederverwendet | Kein zusätzlicher externer Assetabruf, kein sichtbarer Nachladesprung, keine vervielfachte Galerie | Fehlgeschlagener neuer Assetabruf oder duplizierte Welt ist ein Fehler | Auf lokale/prozedurale Ressource und bestehenden Lifecycle zurückführen | Netzwerknachweis und wiederholte Restart-/Retry-Läufe bleiben sauber | Browser-Netzwerk-/Lifecycle-Evidenz und Code Review |

## 6. Nicht-Ziele

- Keine Änderung an Formenkatalog, Colliderdaten, Masse, Schwerpunkt, Physikgrenzen oder Scoring.
- Keine neuen Spielmodi, Kameraauswahl, freie Kamerasteuerung oder begehbare Galerie.
- Keine UI-Neugestaltung von HUD, Vorschau, Dialogen oder Texten, außer minimalen Kontrastkorrekturen zur Lesbarkeit.
- Keine zweite Szene, kein zweiter Frame Loop, kein eigener Hintergrundrenderer und kein neuer Rendererstatus.
- Keine serverseitigen oder extern gehosteten Galerie-Assets, Konten, Telemetrie oder Persistenz.
- Kein Anspruch auf pixelidentische Effekte zwischen WebGPU und WebGL2.
- Kein Hosting, Deployment oder Release in diesem Slice.

## 7. Nutzer und Rollen

- Spielende sind die einzige Laufzeitrolle. Sie sehen die Galerie, bedienen aber keine separaten Umgebungsfunktionen.
- Der Product Owner entscheidet über visuelle Akzeptanz und Priorität der Galerieanforderungen.
- Der technische Owner entscheidet im späteren SD über Geometrie-, Material-, Shader- und Qualitätsstufen innerhalb dieser Produktgrenzen.
- QA prüft beobachtbare Lesbarkeit, Parität, Regression und Performance; sie definiert keine neue visuelle Produktabsicht.

## 8. Constraints

- Die bestehende React-/Three.js-/Rapier-SPA und ihre Single-Owner-Grenzen bleiben verbindlich.
- WebGPU bleibt bevorzugt; klassischer WebGLRenderer mit WebGL2 bleibt der Safari-taugliche Fallback.
- Beide Backends verwenden dieselbe Szene, Kamera, Physik und Spielzustandsquelle.
- Der vorhandene GameStore bleibt alleinige Autorität für Spielphase, Score, Bestwert und erlaubte Aktionen.
- Optionale visuelle Effekte müssen capability-basiert degradieren und dürfen keine neue Produkt- oder Recoveryentscheidung erzeugen.
- Neue Ressourcen müssen lokal gebündelt oder prozedural erzeugt, wiederverwendbar und entsorgbar sein.
- `prefers-reduced-motion` bleibt respektiert; die Galerie führt keine erforderliche Daueranimation ein.
- Bestehende Chromium-/WebKit-Kompatibilität und der fehlerfreie WebGL2-Pfad dürfen nicht regressieren.

## 9. Evidenzanforderungen

- Lint, TypeScript-Build und alle bestehenden Unit-/Integrationssuiten.
- Neue automatisierte Prüfungen für Galerieaufbau, Ressourcenwiederverwendung und backendabhängige Qualitätswahl auf der jeweils geeigneten Ebene.
- Vollständige Gameplayläufe in Chromium und WebKit für Auto-Backend und erzwungenes WebGL2 ohne `console.error`, Page Error oder unhandled rejection.
- Gepaarte Screenshots für Startszene, mindestens drei stabile Teile, hohe repräsentative Turmsituation und Game over.
- Viewportmatrix mindestens für Desktop `1280×720` und Mobil `390×844`; TP darf zusätzliche kritische Viewports festlegen.
- Sichtbarer Vergleich von WebGPU beziehungsweise Auto und WebGL2 für Raumkomposition, Materialunterscheidung und Glaslesbarkeit.
- Zehnsekündige 20-Body-Stressprobe mit p95-Arbeitszeit höchstens `33,3 ms` in den festgelegten Chromium-/WebKit-Profilen.
- Netzwerkevidenz, dass keine neue Galerie-Ressource zur Laufzeit von einem externen Host geladen wird.
- Code- und Clean-Implementation-Review gegen zweite Szene, zweiten Frame Loop, parallele Materialwelt, Ressourcenleck und versteckte Fallbacklogik.

## 10. Risiken und offene Fragen

- SD muss die konkrete Raumgeometrie, Kameragrenzen und den getesteten vertikalen Galeriebereich festlegen, ohne eine unendliche Geometriewelt zu erzeugen.
- SD muss Materialfamilien, Shadertechnik, Licht-/Schattenmodell und die expliziten WebGPU-/WebGL2-Qualitätsstufen besitzen.
- SD muss entscheiden, ob Relief ausschließlich geometrisch/prozedural oder zusätzlich über lokal gebündelte Texturen erzeugt wird.
- TP muss deterministisch festlegen, wie „räumlich statt Kulisse“, Materialunterscheidung und Glaslesbarkeit durch Screenshots und nachvollziehbare Prüfschritte bewertet werden.
- TP muss die repräsentative hohe Turmsituation sowie Browser-/Viewportkombinationen festlegen und die bestehende p95-Messung ohne Headless-Frame-Scheingenauigkeit interpretieren.
- Der bestehende externe Schriftabruf ist nicht Teil dieses Slices; neue Galerie-Ressourcen dürfen diese Abhängigkeit nicht ausweiten.
- Die noch uncommitteten Safari-Fallbackänderungen des vorherigen Runs müssen bei späterer Implementierung und Commitbildung separat nachvollziehbar bleiben.

## 11. Nächster Schritt

Dieses PRD prüfen und nur mit folgendem exakten Wert freigeben:

`Approval: PRD`
