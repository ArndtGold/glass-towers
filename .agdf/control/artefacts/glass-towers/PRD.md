# Product Requirements Document: Glass Towers

- Status: approved
- Run: `glass-towers`
- Gate: `PRD`
- Freigabe: `Approval: PRD` vom 20. August 2026
- Abgeleitet aus: [UR](UR.md), [Brownfield Review](BROWNFIELD_REVIEW.md), [UX Intent Definition](UX_INTENT_DEFINITION.md)

## Produktziel

Glass Towers ist ein fokussiertes Einzelspieler-Browserspiel, das aus wenigen verständlichen Aktionen eine physikalisch glaubwürdige, visuell hochwertige und wiederholbare Herausforderung erzeugt. Spielende positionieren transluzente Formen, lassen sie fallen und bauen so lange weiter, bis eine Form vom Sockel fällt.

## Primärer Nutzerfluss

1. Die Anwendung prüft Renderer-Fähigkeiten und startet bevorzugt mit WebGPU, andernfalls mit WebGL2.
2. Die Spieloberfläche zeigt Sockel, aktuelle Form, nächste Form, Score und lokalen Bestwert.
3. Die aktuelle Form wird horizontal positioniert und per Maus, Touch oder Leertaste fallengelassen.
4. Während Fall und Stabilisierung entscheidet die Physik über Erfolg oder Scheitern.
5. Eine stabile Form erhöht den Score genau einmal und aktiviert den nächsten Zug.
6. Eine vom Sockel fallende Form beendet den Lauf und zeigt Endstand sowie Neustart.

## Produktanforderungen

### PRD-01 — Spielszene und Ziel

Die Anwendung zeigt eine zentrale 3D-Szene mit kleinem Sockel. Ziel ist die höchste stabile Skulptur aus transluzenten Formen.

### PRD-02 — Einheitliche Eingaben

Maus, Touch und Tastatur bieten semantisch dieselbe horizontale Positionierung, Abwurfaktion und Neustartmöglichkeit. Eine fallende oder stabilisierende Form kann nicht erneut abgeworfen werden.

### PRD-03 — Formen und Physik

Ein wiederverwendbarer Formensatz variiert Größe, Masse und Schwerpunkt. Schwerkraft, Kollision, Impuls und Ruheverhalten bestimmen nachvollziehbar, ob eine Form stabil bleibt oder herunterfällt.

### PRD-04 — Laufzustand und Wertung

Die Oberfläche zeigt Score, lokalen Bestwert und nächste Form. Eine stabil platzierte Form erhöht den Score genau einmal. Der Bestwert bleibt lokal über Neustarts und erneute Seitenaufrufe erhalten.

### PRD-05 — Game over und Recovery

Ein Fall vom Sockel beendet den Lauf genau einmal. Der Game-over-Zustand zeigt Endstand, Bestwert und eine eindeutige Neustartaktion, die einen sauberen neuen Lauf erzeugt.

### PRD-06 — Renderer-Fähigkeit und Fallback

WebGPU ist der bevorzugte Renderer. Kann WebGPU nicht verwendet oder nicht stabil initialisiert werden, aktiviert die Anwendung automatisch WebGL2. Beide Pfade erhalten Steuerung, Physik, Wertung, Vorschau, Game over und Neustart. WebGL2 darf visuelle Effekte reduzieren. Scheitern beide Pfade, endet der Start in einem verständlichen Kompatibilitätszustand mit Retry oder Geräte-/Browserhinweis; ein dauerhafter Loader ist unzulässig.

### PRD-07 — Visuelle Qualität und Feedback

Transparenz, Reflexionen, weiches Studiolicht und kurzes Aufprall-Feedback machen Material und Bewegung lesbar. Visuelle Qualität darf die Bedienbarkeit oder praxistaugliche Browser-Performance nicht verdrängen.

### PRD-08 — Qualitätsnachweis

Build und Lint müssen bestehen. Mehrere vollständige Browserläufe prüfen Positionierung, Abwurf, Kollision, Stabilisierung, Score, Scheitern und Neustart. WebGPU und erzwungener WebGL2-Fallback werden getrennt verifiziert; die geprüften Läufe erzeugen keine Konsolenfehler.

## Beobachtbare Akzeptanzkriterien

| ID | Kriterium |
|---|---|
| AC-01 | Ein aktiver Zug zeigt genau eine steuerbare Form, nächste Form, Score und lokalen Bestwert. |
| AC-02 | Klick, Touch und Leertaste lösen denselben Abwurf aus; Eingaben während Fall/Stabilisierung erzeugen keinen zweiten Abwurf. |
| AC-03 | Eine stabilisierte Form erhöht den Score genau einmal und aktiviert anschließend die nächste Form. |
| AC-04 | Eine vom Sockel gefallene Form aktiviert genau einmal Game over und verhindert weitere Spielzüge bis zum Neustart. |
| AC-05 | Neustart setzt Lauf, Physikobjekte und Score zurück, erhält aber den lokalen Bestwert. |
| AC-06 | Ein erzwungener WebGPU-Fehler aktiviert WebGL2 automatisch und erhält alle Kernfunktionen. |
| AC-07 | Ein erzwungener Fehler beider Renderer beendet den Start in einem sichtbaren Kompatibilitätszustand mit nächster Handlung. |
| AC-08 | Die Glasformen unterscheiden sich sichtbar und physikalisch in Größe, Masse oder Schwerpunkt. |
| AC-09 | Build und Lint bestehen; dokumentierte Browserläufe für WebGPU und WebGL2 bleiben frei von Konsolenfehlern. |

## Nicht im Umfang

- Mehrspieler, Benutzerkonten oder serverseitige Bestenlisten
- Zusätzliche Spielmodi
- Veröffentlichung, Hosting oder produktiver Betrieb
- Feature-Parität visueller Effekte zwischen WebGPU und WebGL2 über die Kernmechanik hinaus

## Produktgrenzen für spätere Artefakte

- SD legt technische Owner, Renderer-Abstraktion, Physik- und Zustandsarchitektur, Persistenz sowie Fallback-/Timeout-Mechanik fest.
- TP legt automatisierte und sichtbare Evidenz für beide Renderer, Eingaben, Physik, Wertung, Game over und Neustart fest.
- Implementierung bleibt bis zur Freigabe von PRD, SD und TP sowie bestandener Implementation-preparation Brownfield Analysis gesperrt.
