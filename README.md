# Glass Towers

![Glass Towers mit einer wachsenden Skulptur aus farbigen Glassteinen](assets/intro.png)

Glass Towers ist ein minimalistisches 3D-Browserspiel über Balance, Komposition und den unvermeidlichen Moment, in dem eine fragile Skulptur kippt. WebGPU wird für die hochwertige Darstellung bevorzugt; falls es nicht verfügbar ist oder nicht stabil initialisiert werden kann, verwendet dieselbe Three.js-Szene automatisch WebGL2.

## Spielziel

Bewege den nächsten Glasstein horizontal über die Skulptur und lasse ihn im richtigen Moment fallen. Jeder stabilisierte Stein erhöht den Score um einen Punkt. Ziel ist es, den höchsten stabilen Turm zu bauen.

Der Durchlauf endet, sobald ein Stein den Sockel verfehlt oder die Skulptur so instabil wird, dass ein Teil herunterfällt. Der persönliche Bestwert bleibt lokal im Browser gespeichert.

## Steuerung

| Eingabe | Aktion |
|---|---|
| Klicken oder mit gedrückter Maustaste ziehen und loslassen | Aktiven Stein positionieren und fallen lassen |
| Touch ziehen und loslassen | Aktiven Stein positionieren und fallen lassen |
| `←` / `→` | Stein schrittweise horizontal bewegen |
| `Space` | Stein fallen lassen |
| `R` oder `Enter` | Nach Game over neu starten |
| **Build again** | Neuen Durchlauf über die sichtbare Schaltfläche starten |

## Features

- Physikbasiertes Stapeln mit Rapier und unterschiedlichen Formen, Größen und Schwerpunkten
- Fünf klar unterscheidbare Glasfarben mit backendgerechten Materialprofilen
- Transparenz, Reflexionen, weiches Studiolicht und eine vollständig gerenderte Galerie
- Dynamische Kameraführung, die dem wachsenden Turm nach oben und einem Kollaps kontrolliert nach unten folgt
- Responsive Safe Frames für Desktop, Hochformat und kleine Viewports
- Score, lokal gespeicherter Bestwert und Vorschau des nächsten Steins
- Kontrollierter Game-over-Zustand mit sofortigem Neustart
- Maus-, Touch- und Tastatursteuerung
- Unterstützung für `prefers-reduced-motion`

## Wie Glass Towers entstanden ist

Glass Towers entstand nicht in einem einzigen Generierungsschritt. Das Spiel wurde in klar abgegrenzten Arbeitsabschnitten aufgebaut und nach jeder Erweiterung erneut gegen den bestehenden Stand geprüft. Die Iterationen beschreiben Entwicklungsschwerpunkte und sind nicht als eigenständige Releases zu verstehen.

| Iteration | Schwerpunkt | Ergebnis |
|---|---|---|
| 1 | Spielbarer Kern | Three.js- und Rapier-Grundlage, Sockel, Glasformen, Platzieren und Fallenlassen, Score, Bestwert, Vorschau und Restart |
| 2 | Browserkompatibilität | Automatischer WebGL2-Fallback für Safari und ein kontrollierter Fehlerzustand, wenn kein Renderer initialisiert werden kann |
| 3 | Galerieumgebung | Verfeinerte Geometrie, Studiobeleuchtung und ein vollständig gerenderter Hintergrund anstelle eines statischen Bildcharakters |
| 4 | Glasdarstellung | Backendgerechte Materialprofile, höherer Kontrast und fünf in WebGPU und WebGL2 klar unterscheidbare Farben |
| 5 | Kameraführung | Weiches Tracking beim Turmaufbau, kontrollierte Abwärtsfahrt beim Kollaps, responsive Safe Frames und Reduced Motion |

### Was AGDF beigetragen hat

Von Anfang an wurde das AI native Governance and Delivery Framework (AGDF) eingesetzt. AGDF hat die kreative Richtung des Spiels nicht ersetzt. Sein Beitrag bestand darin, Änderungen nachvollziehbar zu begrenzen, Entscheidungen zu dokumentieren und Behauptungen durch passende Evidenz abzusichern.

Im Projekt wurde das insbesondere an diesen Punkten sichtbar:

- Anforderungen, Lösungsdesign, Aufgaben, Tests und Abnahme blieben über eine gemeinsame Artefaktkette miteinander verbunden.
- Visuelle Ziele wie „fünf unterscheidbare Farben“ oder „die relevante Struktur bleibt sichtbar“ wurden zu überprüfbaren Akzeptanzkriterien.
- Brownfield-Analysen halfen, bestehende Runtime-, Rendering-, Material- und Teststrukturen wiederzuverwenden, statt parallele Lösungen einzuführen.
- WebGPU, WebGL2 und Safari wurden als getrennte Kompatibilitäts- und Evidenzpfade behandelt.
- Automatisierte QA, sichtbare Browser-Evidenz und direkte Nutzerabnahme blieben voneinander unterscheidbar.
- Bereits vorhandene Änderungen im gemeinsamen Worktree wurden erfasst und vor unbeabsichtigtem Überschreiben geschützt.
- Fachliche Freigaben führten nicht automatisch zu Commit, Push, Pull Request oder Release.

Dadurch wurde nicht einfach mehr Prozess erzeugt: Die strukturierten Erweiterungen erhielten einen klaren Umfang, messbare Erfolgskriterien und eine überprüfbare Abschlussgrenze.

## Grafikmodi und Browser

Das Badge unten links zeigt den aktiven Renderer:

- **WebGPU · High fidelity:** bevorzugter Modus mit hochwertiger Glas- und Lichtdarstellung.
- **WebGL2 · Compatible:** automatischer Kompatibilitätsmodus, unter anderem für Safari-Systeme ohne nutzbares WebGPU.

Wenn weder WebGPU noch WebGL2 initialisiert werden kann, zeigt das Spiel einen erklärenden Fehlerzustand mit erneutem Versuch. In diesem Fall helfen meist ein aktueller Browser und aktivierte Hardwarebeschleunigung.

## Entwicklung

```bash
npm install
npm run dev
```

## Qualitätsprüfungen

```bash
npm run lint
npm test
npm run test:integration
npm run test:e2e
npm run build
```

Die Browser-Suite deckt das automatische Backend, erzwungenes WebGL2, vollständiges Renderer-Scheitern, Eingabekanäle, Glasmaterialien, Galerie, Kameraführung sowie Performanceproben mit bis zu 20 Rapier-Bodies ab. Die Query-Parameter `renderer`, `seed` und `stress` sind ausschließlich im Development-Build aktiv.
