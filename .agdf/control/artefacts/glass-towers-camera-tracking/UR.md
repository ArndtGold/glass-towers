# UR: Dynamische Kameraführung für Turm und Kollaps

Status: approved
Gate: UR
Approval: approved — user supplied exact `Approval: UR` on 2026-08-21
Run: `glass-towers-camera-tracking`
Revision: `e3540183-b1b8-48fa-9ede-5f48b3560b5e`
Stand: 2026-08-21

## Nutzerbedarf

Die Kamera soll einem wachsenden Turm ruhig nach oben folgen und bei einem Kollaps kontrolliert wieder nach unten mitgehen. Während beider Bewegungsrichtungen soll die relevante Skulptur sichtbar und räumlich verständlich bleiben.

## Gewünschtes Verhalten

1. Mit zunehmender stabiler Turmhöhe verfolgt die Kamera den Aufbau weich nach oben, ohne Sprünge, Zittern oder abrupte Blickrichtungswechsel.
2. Während eines Kollapses sinkt die Kameraführung weich mit der fallenden beziehungsweise verbleibenden Struktur ab, statt auf der zuvor erreichten Höhe stehen zu bleiben oder sofort zur Ausgangsposition zu springen.
3. Die Bildkomposition hält Sockel, Turm und die für den Kollaps relevanten Glasstücke so weit wie praktisch möglich im sichtbaren Bereich.
4. Das Verhalten bleibt bei unterschiedlichen Bildformaten, in WebGPU und im WebGL2-Fallback konsistent.
5. Restart führt kontrolliert zur Ausgangskomposition zurück.

## Akzeptanzkriterien

| ID | Kriterium |
|---|---|
| CAM-AC-01 | Ein wachsender Turm löst eine kontinuierliche, zeitbasierte Aufwärtsbewegung von Kameraposition und Blickziel aus. |
| CAM-AC-02 | Kleine physikalische Höhenschwankungen erzeugen kein sichtbares Kamera-Zittern oder Oszillieren. |
| CAM-AC-03 | Bei einem Kollaps folgt die Komposition der sinkenden Struktur weich nach unten und hält die relevanten fallenden beziehungsweise verbleibenden Teile sichtbar. |
| CAM-AC-04 | Sockel und Turm bleiben während Aufbau und Kollaps ausreichend im Bild, ohne dass die Kamera Geometrie durchschneidet. |
| CAM-AC-05 | Nach Restart kehrt die Kamera weich und reproduzierbar zur Ausgangskomposition zurück. |
| CAM-AC-06 | Kameraübergänge sind bildratenunabhängig und funktionieren in WebGPU und WebGL2 gleichartig. |
| CAM-AC-07 | Eingabe, Physik, Scoring, Game-over und Renderer-Fallback-Semantik bleiben unverändert. |
| CAM-AC-08 | Automatisierte Tests decken Zielberechnung, Aufwärtsverfolgung, Kollapsabstieg und Reset ab; Browsernachweise prüfen hohe Türme und Kollaps visuell. |

## Nicht-Ziele

- keine freie Orbit-, Zoom- oder manuelle Kamerasteuerung
- keine Änderung an Physik, Spawnlogik, Scoring oder Game-over-Regeln
- kein Umbau der WebGPU-/WebGL2-Auswahl oder der Galerieumgebung

## Offene Punkte für Brownfield Review / PRD

- Welche vorhandene Höhen- oder Bounds-Quelle bildet während eines Kollapses die sichtbare Struktur zuverlässig ab?
- Muss die Distanz beziehungsweise das Sichtfeld zusätzlich zur vertikalen Position angepasst werden, um sehr hohe oder weit auseinanderfallende Strukturen sichtbar zu halten?
- Soll `prefers-reduced-motion` die Übergangsgeschwindigkeit oder nur dekorative Kamerabewegung beeinflussen?

## Freigabe

Der Nutzer hat die UR mit exakt `Approval: UR` für Revision `e3540183-b1b8-48fa-9ede-5f48b3560b5e` am 2026-08-21 freigegeben. Die Freigabe erlaubt die Brownfield Review und proportionale Pfadwahl, nicht die Implementierung.
