# UAT-Checkliste: Sichtbarkeitsorientierte Kameraführung

Status: ready
Run: `glass-towers-camera-tracking`
Stand: 2026-08-21
Based on: genehmigter [QA-Bericht](QA_REPORT.md)

## Ziel

Die Kameraführung auf realen Browser-/GPU-Pfaden subjektiv und sichtbar bestätigen. Automatisierte Browser- und Performanceevidenz bleibt unterstützend und ersetzt diese Nutzerabnahme nicht.

## UAT-01 — Chrome mit WebGPU

1. Anwendung in einer aktuellen Chrome-Version öffnen und im Status-Badge `WEBGPU · HIGH FIDELITY` prüfen.
2. Mindestens acht Steine stabil platzieren.
3. Bestätigen, dass die Kamera weich nach oben folgt, ohne den Sockel oder die relevante Turmstruktur unnötig aus dem Bild zu verlieren.
4. Einen Kollaps auslösen und bestätigen, dass die Kamera kontrolliert nach unten folgt und die verbleibende Struktur sichtbar hält.
5. Restart auslösen und bestätigen, dass die Kamera weich zur Ausgangskomposition zurückkehrt.
6. DevTools-Konsole auf neue Fehler prüfen.

Erwartetes Ergebnis: Wachstum, Kollaps und Restart wirken kontinuierlich; kein störendes Pumpen, Springen oder Clipping; Spielsteuerung und Score bleiben unverändert; keine Console Errors.

## UAT-02 — Safari mit WebGL2

1. Anwendung in Safari öffnen und im Status-Badge `WEBGL2 · COMPATIBILITY` prüfen.
2. Dieselben Schritte wie UAT-01 durchführen.
3. Zusätzlich bestätigen, dass Galerie, Glassteine, Sockel und UI mit normaler Helligkeit sichtbar bleiben.
4. Safari-Webinspektor auf neue Fehler prüfen.

Erwartetes Ergebnis: dieselbe Kamerasemantik wie im WebGPU-Pfad; keine schwarze Szene, kein Backendfehler und keine neuen Console Errors.

## UAT-03 — Hochformat und Reduced Motion

1. Ein schmales Hochformat verwenden.
2. Mit aktivierter Betriebssystemoption „Bewegung reduzieren“ mindestens drei Steine platzieren, Kollaps auslösen und neu starten.
3. Bestätigen, dass die Struktur im Safe Frame bleibt und alle Übergänge deutlich kürzer, aber nicht abrupt unkontrolliert sind.

Erwartetes Ergebnis: relevante Struktur bleibt sichtbar; Reduced Motion konvergiert schnell und bewahrt die Orientierung.

## Abnahmeregel

UAT ist erst bestanden, wenn Chrome/WebGPU und Safari/WebGL2 direkt bestätigt sind. Festgestellte Abweichungen werden mit Browser, Backend, Viewport, Reproduktionsschritten und Screenshot erfasst. Bis dahin bleiben Commit, Push, PR und Release nicht autorisiert.
