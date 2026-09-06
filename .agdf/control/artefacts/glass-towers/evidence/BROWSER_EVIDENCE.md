# Browser- und Qualitätsnachweis: Glass Towers

- Stand: 20. August 2026
- Run: `glass-towers`
- Referenz: lokaler Vite-Server, Playwright Chromium und WebKit sowie Codex In-App Browser

## Automatisierte Qualitätsläufe

| Prüfung | Ergebnis | Nachweis |
|---|---|---|
| `npm run lint` | bestanden | ESLint ohne Befund |
| `npm test` | bestanden | 6 Dateien, 15 Tests |
| `npm run test:integration` | bestanden | 1 Datei, 2 Rapier-Tests |
| `npm run build` | bestanden | TypeScript und Vite-Produktionsbuild |
| `npm run test:e2e` | bestanden | 12 Playwright-Fälle: je 4 Performance- und 8 Gameplay-/Recovery-Fälle über Chromium und WebKit |

Der Build meldet einen nicht blockierenden Größenhinweis für die Three.js-Anwendung und das separat lazy geladene Rapier-Chunk. Rapier liegt nicht im initialen Hauptchunk.

## Akzeptanzläufe

- Auto-Backend: drei stabile Platzierungen, Score `03`, absichtlicher Fehlwurf, Game over, Button-Restart, Bestwert `03` und Bestwert-Erhalt nach Seitenreload.
- Erzwungenes WebGL2: zwei stabile Platzierungen, Score `02`, absichtlicher Fehlwurf und Tastatur-Restart.
- Rendererfehler: kontrollierter Compatibility Error mit sichtbarem Retry; wiederholter Retry bleibt kontrolliert.
- Eingabematrix: Maus, synthetischer Touch-Pointer und Space lösen dieselbe Drop-Absicht aus.
- Alle Playwright-Fälle sammeln `console.error`, Page Errors und unbehandelte Fehler und bestanden ohne solche Einträge.
- WebKit Auto ohne nutzbaren WebGPU-Adapter: direkter klassischer WebGL2-Fallback, Score `03`, Game over, Restart und Bestwert-Erhalt.
- WebKit Forced WebGL2: klassischer `WebGLRenderer` auf explizitem Standard-WebGL2-Kontext, Score `02`, Failure und Restart ohne Kontextverlust.
- Zusätzlich im In-App Browser gespielt: echter WebGPU-Lauf mit Scoring, Fehlwurf und Restart; erzwungener WebGL2-Lauf mit Scoring; Compatibility-Error-Pfad. In den abschließenden frischen Läufen gab es keine Konsolenfehler.

## Performance

| Umgebung | Backend | Last | Dauer | Samples | p95 Frame | p95 Arbeitszeit | Bewertung |
|---|---|---:|---:|---:|---:|---:|---|
| In-App Browser, Hardware | WebGPU | 20 Pieces | 10 s | 501 | 33,10 ms | 1,60 ms | Ziel `<= 33,3 ms` bestanden |
| Playwright Chromium, 640×360 | Auto | 20 Pieces | 10 s | 166 | 116,7 ms | 2,3 ms | Arbeitsbudget bestanden; rAF im Hintergrund gedrosselt |
| Playwright Chromium, 640×360 | Forced WebGL2 | 20 Pieces | 10 s | 149 | 116,7 ms | 2,8 ms | Arbeitsbudget bestanden; rAF im Hintergrund gedrosselt |
| Playwright WebKit, 640×360 | Auto → WebGL2 | 20 Pieces | 10 s | 594 | 24,0 ms | 1,0 ms | Frame- und Arbeitsbudget bestanden |
| Playwright WebKit, 640×360 | Forced WebGL2 | 20 Pieces | 10 s | 598 | 21,0 ms | 1,0 ms | Frame- und Arbeitsbudget bestanden |

Die Headless-Frameabstände sind wegen Browser-Hintergrunddrosselung kein belastbarer GPU-Frame-Benchmark; deshalb werden sie nicht als Ersatz für den Hardwarewert ausgegeben. Der reale Forced-WebGL2-Stresstest konnte selbst nach Reduktion auf 640×360 nicht über die Browsersteuerung abgeschlossen werden. Diese fehlende Backend-spezifische Hardwaremessung bleibt als Warnung sichtbar; WebGL2-Funktion, Kollisionen, Scoring, Failure und Restart sind unabhängig davon vollständig nachgewiesen.

## Sichtbare Evidenz

- `chromium-auto-score-3.png` und `webkit-auto-score-3.png`: Auto-Läufe mit Score `03`
- `chromium-auto-game-over.png` und `webkit-auto-game-over.png`: klare Game-over-Zustände
- `chromium-webgl2-score-2.png` und `webkit-webgl2-score-2.png`: erzwungene WebGL2-Läufe mit Score `02`
- `chromium-renderer-failure.png` und `webkit-renderer-failure.png`: Compatibility Error und Retry
- `performance-{chromium|webkit}-{auto|forced-webgl2}.json`: getrennte maschinenlesbare Headless-Messwerte

## Safari-/WebKit-Korrektur

Der produktive WebGL2-Fallback verwendet nicht länger `WebGPURenderer(forceWebGL)`. `RendererFactory` prüft zuerst, ob ein echter WebGPU-Adapter verfügbar ist, verwendet dafür weiterhin `WebGPURenderer` und fällt andernfalls auf einen klassischen `WebGLRenderer` mit explizitem Standard-WebGL2-Kontext zurück. Zusätzliche erzwungene Context-Attribute wurden nach reproduziertem WebKit-Kontextverlust entfernt. Der abschließende WebKit-Lauf bestand danach vollständig ohne `console.error`, Page Error oder Kontextverlust.
