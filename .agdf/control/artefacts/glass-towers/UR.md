# User Requirement: Glass Towers

- Status: approved
- Run: `glass-towers`
- Gate: `UR`
- Quelle: Nutzerauftrag vom 20. August 2026
- Freigabe: `Approval: UR` vom 20. August 2026

## Ziel

Glass Towers soll ein minimalistisches 3D-Browserspiel werden, in dem Spielende transluzente Objekte auf einem kleinen zentralen Sockel zu einer möglichst hohen, stabilen Skulptur stapeln.

## Nutzererlebnis

Die nächste Glasform wird horizontal positioniert und per Mausklick, Touch-Geste oder Leertaste fallengelassen. Form, Masse, Schwerpunkt und Impuls beeinflussen die physikalische Stabilität. Der Lauf endet, sobald ein Objekt vom Sockel fällt.

## Funktionale Anforderungen

1. Eine zentrale 3D-Szene enthält einen kleinen Sockel und wiederverwendbare Glasformen mit unterschiedlichen Größen, Massen und Schwerpunkten.
2. Die nächste Form kann horizontal bewegt und per Maus, Touch oder Tastatur fallengelassen werden.
3. Kollisionen, Schwerkraft, Impuls und Instabilität erzeugen ein nachvollziehbares Balancierspiel.
4. Die Anwendung zeigt Punktestand, lokalen Bestwert und eine Vorschau der nächsten Form.
5. Ein Lauf besitzt einen klaren Game-over-Zustand und kann zuverlässig neu gestartet werden.
6. Transparenz, Reflexionen, weiches Studiolicht und Aufprall-Feedback vermitteln eine hochwertige Glasästhetik bei praxistauglicher Browser-Performance.
7. Die Anwendung bevorzugt WebGPU, fällt bei fehlender oder nicht stabil initialisierbarer WebGPU-Unterstützung automatisch auf einen funktionalen WebGL2-Renderer zurück und zeigt erst dann einen eindeutigen Kompatibilitätshinweis, wenn auch WebGL2 die Mindestanforderungen nicht erfüllt.

## Akzeptanzkriterien

- Maus-, Touch- und Tastatursteuerung funktionieren für Positionierung, Abwurf und Neustart.
- Erfolgreich platzierte Formen erhöhen den Punktestand; ein herunterfallendes Objekt beendet den Lauf.
- Der lokale Bestwert bleibt nach einem Neustart der Anwendung erhalten.
- Vorschau, aktueller Punktestand, Neustart und Game-over-Zustand sind eindeutig erkennbar.
- Mehrere vollständige Browserläufe bestätigen Kollisionen, Wertung, Scheitern und Neustart ohne Konsolenfehler.
- Der WebGPU-Pfad und der WebGL2-Fallback erreichen dieselbe Kernspielmechanik; reduzierte visuelle Effekte im Fallback sind zulässig, sofern Steuerung, Physik, Wertung, Vorschau, Game-over und Neustart erhalten bleiben.
- Wenn weder WebGPU noch WebGL2 verwendbar sind, endet der Startvorgang zeitnah in einem verständlichen Kompatibilitätszustand mit nächster Handlung statt in einem endlosen Ladebildschirm.
- Build und Lint laufen erfolgreich.

## Nicht im Umfang

- Mehrspielerfunktionen, Benutzerkonten und serverseitige Bestenlisten
- Veröffentlichung oder produktiver Betrieb
- Zusätzliche Spielmodi außerhalb des beschriebenen Einzelspieler-Stapelspiels

## Offene Produktentscheidungen

- Keine für die Freigabe der Nutzeranforderung. Technologie-, Browser- und Performance-Grenzen werden erst in den nachfolgenden zulässigen Schritten festgelegt.
