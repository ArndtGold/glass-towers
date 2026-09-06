# PRD: Sichtbarkeitsorientierte Kameraführung

Status: approved
Gate: PRD
Approval: approved — user supplied exact `Approval: PRD` on 2026-08-21
Run: `glass-towers-camera-tracking`
Revision: `1fc17261-ae54-4fd6-a85b-5f38c8b98d52`
Stand: 2026-08-21
Based on: [approved UR](UR.md) · [Brownfield Review](BROWNFIELD_REVIEW.md)

## 1. Produktziel

Die Kamera soll den Aufbau einer Glasskulptur ruhig nach oben begleiten und einen Kollaps kontrolliert nach unten verfolgen. Dabei bleibt die spielrelevante Struktur lesbar, ohne hektische Richtungswechsel, extreme Zoomsprünge oder Änderungen an Spiel-, Physik- und Renderersemantik.

## 2. Scope

Im Scope sind:

- automatische vertikale Ziel- und Positionsführung während Aufbau, Drop, Settling, Kollaps und Restart
- sichtbarkeitsorientiertes Framing für Sockel, tragende Skulptur und das aktuell relevante bewegte Stück
- stabile Dämpfung mit Hysterese gegen physikalisches Mikro-Zittern
- responsives Verhalten für Desktop-, Tablet- und Hochformat-Viewports
- identische Kameralogik vor WebGPU- und WebGL2-Rendering
- systemseitige Bewegungsreduktion über `prefers-reduced-motion`
- automatisierte und direkte visuelle Abnahmeevidenz

## 3. Begriffe und Prioritäten

### 3.1 Priorisierte Komposition

Die Kamera muss nicht jedes bereits ausgeschiedene Fragment verfolgen. Die priorisierte Komposition besteht aus:

1. dem Sockel als räumlichem Anker,
2. allen noch auf oder unmittelbar an der Skulptur befindlichen Glasstücken,
3. dem aktuellen Aim-/Drop-/Settling-Stück,
4. nach dem Fehlschlag dem auslösenden Stück und dem sichtbar kollabierenden Kern, solange sie sich im aktiven Spielvolumen befinden.

Teile, die die vorhandene Fall- oder Außenbegrenzung überschritten haben, dürfen aus dem Framing ausgeschlossen werden. Dadurch erzwingt ein weit entferntes Fragment kein extremes Herauszoomen.

### 3.2 Sicherer Bildbereich

Der sichere Bildbereich umfasst die mittleren 88 % der Viewport-Breite und 84 % der Viewport-Höhe. UI-Overlays dürfen nicht als Geometrie-Bounds behandelt werden; die priorisierte Komposition bleibt trotzdem visuell von den Viewporträndern getrennt.

### 3.3 Ausgangskomposition

Die Ausgangskomposition entspricht der heutigen Perspektive auf Sockel und erste Drop-Zone. Sie ist die Zielkomposition beim Start und nach Restart, darf aber durch die neue Framinglogik weich erreicht werden.

## 4. Nutzer- und Zustandsverhalten

| Spielzustand | Kameraverhalten | Sichtbare Priorität |
|---|---|---|
| Boot / erstes Aiming | Ausgangskomposition ohne Einfluganimation | Sockel und erstes Aim-Stück |
| Aiming nach stabilem Stein | weich nach oben auf neue Kompositionshöhe nachführen | Sockel, tragender Turm und Aim-Stück |
| Dropping / Settling | Ziel nicht hektisch mit jeder Physikschwankung wechseln | Sockel, Turm und aktives Stück |
| Game-over / Kollaps | mit dem sinkenden Kollapskern nach unten gehen; nicht auf Maximalhöhe einfrieren und nicht sofort auf Ausgangshöhe springen | Sockel, verbleibender Kern und auslösendes Stück im aktiven Spielvolumen |
| Game-over nach abgeschlossenem Fall | in einer ruhigen, lesbaren Endkomposition verbleiben | Sockel und verbleibende Skulptur |
| Restart | weich und reproduzierbar zur Ausgangskomposition zurückkehren | Sockel und neues Aim-Stück |
| Compatibility error | keine neue Kamerabewegung | bestehender Fehlerzustand unverändert |

## 5. Funktionale Anforderungen

### CAM-PRD-01 — Wachstumsverfolgung

Eine höhere priorisierte Komposition verschiebt Blickziel und Kameraposition kontinuierlich nach oben. Die Reaktion beginnt spätestens 150 ms nach einer relevanten Höhenänderung und erreicht bei normaler Bewegung innerhalb von 1,4 s mindestens 90 % des neuen Zielzustands.

### CAM-PRD-02 — Stabile Dämpfung

Die Bewegung ist zeit- statt framebasiert. Höhenänderungen bis 0,08 Welteinheiten dürfen keine sichtbare Richtungsumkehr auslösen. Ein Übergang überschwingt sein Ziel um höchstens 5 % der angeforderten Distanz.

### CAM-PRD-03 — Sichtbarkeitsorientiertes Framing

Bei den Referenzformaten 16:9, 4:3 und 9:16 bleibt die priorisierte Komposition bis zu einer reproduzierbaren Zwölf-Stein-Skulptur innerhalb des sicheren Bildbereichs. Die Kamera darf Position und Abstand anpassen; sichtbare, abrupte Brennweiten- oder Zoomsprünge sind nicht zulässig.

### CAM-PRD-04 — Kollapsverfolgung

Nach dem ersten `fell`-Ereignis folgt die Kamera der sinkenden priorisierten Komposition nach unten. Sie darf die zuvor erreichte Höhe kurz dämpfungsbedingt halten, muss aber innerhalb von 250 ms erkennbar abwärts reagieren und innerhalb von 1,8 s mindestens 90 % des aktuellen Kollapsziels erreichen.

### CAM-PRD-05 — Endkomposition und Ausschluss ausgeschiedener Teile

Stücke außerhalb der bestehenden Fall-/Außengrenze beeinflussen das Framing nicht mehr. Nach Ende der relevanten Bewegung bleibt die Kamera auf Sockel und verbleibender Skulptur, bis Restart ausgelöst wird.

### CAM-PRD-06 — Restart

Restart setzt Kameraabsicht und historische Maximalhöhe zurück. Die Ausgangskomposition wird ohne Sprung innerhalb von 900 ms zu mindestens 90 % erreicht; alte Kollaps-Bounds dürfen den neuen Lauf nicht beeinflussen.

### CAM-PRD-07 — Bewegungsreduktion

Bei `prefers-reduced-motion: reduce` bleibt das Sichtbarkeitsziel identisch, aber langsames filmisches Nachlaufen und Überschwingen entfallen. Relevante Zielwechsel erreichen innerhalb von 300 ms mindestens 90 % des Ziels. Es wird keine zusätzliche In-App-Einstellung eingeführt.

### CAM-PRD-08 — Backend- und Bildratenparität

Die Zieltrajektorie ist rendererunabhängig. Bei identischen Zustands-/Bounds-Folgen unterscheiden sich 30-, 60- und 120-Hz-Simulationen nach gleicher verstrichener Zeit um höchstens 0,05 Welteinheiten in Kameraposition und Blickziel. WebGPU und WebGL2 nutzen dieselbe Berechnung.

### CAM-PRD-09 — Performance

Mit dem vorhandenen 20-Stein-Stressaufbau verursacht die Kameraberechnung im p95 höchstens 0,30 ms zusätzliche Main-Thread-Arbeit pro Frame und erzeugt keine wachsende Ressource oder Event-Listener-Zahl.

### CAM-PRD-10 — Unveränderte Spielsemantik

Drop-Steuerung, Physikparameter, Spawnlogik, Stabilisierung, Scoring, Best Score, Game-over, Restart-Berechtigung und WebGPU-zu-WebGL2-Fallback bleiben unverändert.

## 6. Akzeptanzkriterien und Evidenz

| ID | Akzeptanzkriterium | Erforderliche Evidenz |
|---|---|---|
| CAM-AC-01 | Eine wachsende Zwölf-Stein-Skulptur wird ohne Sprung nach oben verfolgt. | Controller-/Berechnungstest plus Browsersequenz vor/nach Wachstum |
| CAM-AC-02 | Mikrobewegungen bis 0,08 Einheiten erzeugen keine sichtbare Richtungsumkehr; Überschwingen bleibt ≤ 5 %. | deterministischer Unit-Test |
| CAM-AC-03 | Nach `fell` beginnt die Kamera innerhalb 250 ms abzusinken und erreicht innerhalb 1,8 s ≥ 90 % des Kollapsziels. | Zeitreihentest plus Browseraufnahme |
| CAM-AC-04 | Die priorisierte Komposition bleibt bei 16:9, 4:3 und 9:16 innerhalb 88 % Breite / 84 % Höhe. | Screen-Space-Bounds-Test und Screenshots |
| CAM-AC-05 | Ausgeschiedene Fragmente erzwingen kein Herauszoomen; Sockel und Reststruktur bleiben in der Endkomposition. | Bounds-Unit-Test und Game-over-Screenshot |
| CAM-AC-06 | Restart erreicht innerhalb 900 ms ≥ 90 % der Ausgangskomposition und übernimmt keine alten Kollapsdaten. | Reset-Unit-Test und Browser-Run |
| CAM-AC-07 | Reduced Motion erreicht Zielwechsel innerhalb 300 ms ohne Überschwingen. | Media-Preference-Test |
| CAM-AC-08 | 30/60/120 Hz sowie WebGPU/WebGL2 bleiben innerhalb der definierten Trajektorien-Toleranz. | deterministischer Frequenztest und beide Browserprofile |
| CAM-AC-09 | Kameraarbeit bleibt p95 ≤ 0,30 ms beim 20-Stein-Stressaufbau. | Browser-Performance-Messung |
| CAM-AC-10 | Gameplay-, Renderer-, Material- und bestehende Browserregressionen bleiben pass; keine Console Errors. | vollständige relevante Testläufe und direkte UAT |

## 7. Referenz-Abnahme

Direkte UAT umfasst mindestens:

1. Chrome/WebGPU: hoher Turm, Drop/Settling, Kollaps und Restart im Desktopformat.
2. Safari/WebGL2: derselbe Ablauf im Desktopformat.
3. Ein Hochformat-Viewport: sicherer Bildbereich bei Wachstum und Kollaps.
4. Reduced-Motion-Profil: kurze, nicht überschwingende Übergänge.
5. Browserkonsole: keine Fehler oder unbehandelten Exceptions.

## 8. Nicht-Ziele

- manuelle Kamera-, Orbit-, Pan- oder Zoomsteuerung
- Kamerawackeln, Impact-Shake, filmische Schnitte oder wechselnde Blickwinkel
- neue Physik-, Kollaps-, Spawn-, Score- oder Game-over-Regeln
- Verfolgung jedes bereits ausgeschiedenen Fragments
- neue persistente Einstellung oder UI für Kameraverhalten
- Änderung der Galeriegeometrie, Glasmaterialien oder Renderer-Auswahl

## 9. Abhängigkeiten und Risiken

- Die aktuelle `towerHeight()`-Semantik reicht nicht als Kollaps-Sichtbarkeitsquelle; die Lösung muss vorhandene Snapshots beziehungsweise daraus abgeleitete Bounds nutzen, ohne Physikregeln zu verändern.
- Sehr weite Kollapsbewegungen können nicht gleichzeitig detailliert und vollständig sichtbar bleiben; die priorisierte Komposition und Ausschlussregeln sind deshalb normativ.
- Der bestehende uncommitted Material-Scope berührt `GameRuntime.ts`; spätere Implementierung und Review müssen die Kameraänderungen zeilen- und evidenzgenau isolieren.
- Screen-Space-Grenzen müssen die tatsächliche Perspektive und transformierte Geometrie prüfen, nicht nur Mittelpunkt- oder rohe Dimensionswerte.

## 10. Traceability

| UR-Kriterium | PRD-Abdeckung |
|---|---|
| CAM-AC-01 | CAM-PRD-01, CAM-PRD-08 |
| CAM-AC-02 | CAM-PRD-02 |
| CAM-AC-03 | CAM-PRD-04, CAM-PRD-05 |
| CAM-AC-04 | CAM-PRD-03, CAM-PRD-05 |
| CAM-AC-05 | CAM-PRD-06 |
| CAM-AC-06 | CAM-PRD-08 |
| CAM-AC-07 | CAM-PRD-10 |
| CAM-AC-08 | Abschnitt 6 und 7 |

## 11. Freigabe

Der Nutzer hat das PRD mit exakt `Approval: PRD` für Revision `1fc17261-ae54-4fd6-a85b-5f38c8b98d52` am 2026-08-21 freigegeben. Die Freigabe erlaubt das Lösungsdesign, nicht die Implementierung.
