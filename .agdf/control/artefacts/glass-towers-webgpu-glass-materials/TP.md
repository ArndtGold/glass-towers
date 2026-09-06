# TP: Backendgerechte Glasoptik und Kontrastführung

Status: approved
Gate: TP
Gate approval: `Approval: TP` vom 2026-08-21 für Revision `a2e5cfbf-311c-4216-be56-6321207269ee`
Run: `glass-towers-webgpu-glass-materials`
Stand: 2026-08-21
Based on: [approved PRD](PRD.md), [approved SD](SD.md), [Brownfield Review](BROWNFIELD_REVIEW.md)

## 1. Planungsziel

Dieser Plan setzt den genehmigten Material-Slice in zwei bestehenden Renderprofilen um und beweist die sichtbare Verbesserung ohne Änderung an Rendererwahl, Physik oder Spielsemantik. Jede Aufgabe besitzt einen begrenzten Owner, einen überprüfbaren Abschluss und eine Zuordnung zu den zwölf PRD-Akzeptanzkriterien.

## 2. Ausführungsreihenfolge

| Task ID | Aufgabe | Pfade / Owner | Abschlusskriterium | Abhängigkeit |
|---|---|---|---|---|
| GLASS-T-01 | Galerie-Baseline einfrieren und Messzustände festlegen | `tests/e2e/`, Testartefakte | aktueller Commit, Seed, Viewports sowie Start-, Score-3/Overlap-, High-build- und Game-over-Zustände für Auto und Forced WebGL2 sind reproduzierbar dokumentiert; Baseline-Bilder liegen vor Materialänderung vor | keine |
| GLASS-T-02 | Reine `GlassOptics`-Ableitung implementieren | `src/game/rendering/createMaterials.ts` | alle fünf `PieceDefinition`-Varianten liefern deterministisch geklemmte Dicke, Absorption, Rauheit und Compatible-Opacity; Katalog und Physik bleiben unverändert | T-01 |
| GLASS-T-03 | WebGPU-High-Material und kontrastreiches Studio-Environment umsetzen | `src/game/rendering/createMaterials.ts` | `MeshPhysicalMaterial` nutzt Transmission mit `opacity=1`, formabhängige Volumenwerte, begrenzte optionale Dispersion und eine High-Environment mit hellen sowie dunklen Reflexionskarten | T-02 |
| GLASS-T-04 | WebGL2-Compatible-Material glaslokal optimieren | `src/game/rendering/createMaterials.ts`, `src/game/rendering/createScene.ts` | `MeshStandardMaterial` erhält die Compatible-Environment direkt als `envMap`; `scene.environment` bleibt für Compatible leer; Galerieoberflächen bleiben unverändert | T-02 |
| GLASS-T-05 | Render-only Piece-Geometrien fasen und Compound-Visual zusammenführen | `src/game/rendering/createScene.ts` | Box, Cylinder und Compound zeigen innerhalb der Außenmaße kleine Fasen; Compound besteht aus einem sichtbaren Mesh; Collider-/Katalogwerte bleiben bytegleich | T-02 |
| GLASS-T-06 | Profil-, Cache- und Lifecycle-Integration absichern | `src/game/rendering/createScene.ts` | konfigurieren vor Erzeugen, ein Material je Piece/Backend, eine Environment je Profil, idempotentes Dispose, kein Ressourcenwachstum über Restart/Reload | T-03–T-05 |
| GLASS-T-07 | Unit- und Integrationsregressionen ergänzen | `tests/unit/galleryMaterials.test.ts`, `tests/unit/galleryEnvironment.test.ts`, bei Bedarf neue fokussierte Rendering-Tests | Materialinvarianten, Dickenableitung, Environment-Zuordnung, Geometriemaße, ein Compound-Mesh und Disposal sind automatisiert geprüft | T-02–T-06 |
| GLASS-T-08 | Sichtbare Lesbarkeits- und Zustandsnachweise automatisieren | `tests/e2e/gallery.spec.ts`, schmale Testhilfe unter `tests/e2e/` | gepaarte Zustandsbilder, drei komplementäre Kontrastmetriken, Console-/Page-Error-Guards und Profilparität laufen für Auto und Forced WebGL2 | T-01, T-06 |
| GLASS-T-09 | Vollständige Regression und Budgets ausführen | bestehende Test-/Buildskripte | Build, Lint, Unit, Integration, E2E und 20-Body-Stress bestehen; p95 Work ≤ 33,3 ms je ausführbarem Profil; keine Budgetüberschreitung | T-07, T-08 |
| GLASS-T-10 | Direkte Hardware-/Browser-Evidenz vorbereiten und nach QA in UAT erheben | Chrome/WebGPU, Safari/WebGL2; Testartefakte | gepaarte Start-, Score-3-, High-build-, Game-over- und Restart-Bilder in echten Browsern; Backendstatus sichtbar; keine Console-Fehler | T-09, nach QA |

## 3. Implementierungsdetails pro Task

### GLASS-T-01 — Baseline

- Ausgangspunkt ist Commit `8e1b507a0884b86b8a414f0f3097fd70c298e257` zuzüglich des bereits geprüften Galerie-Fixes; die tatsächlich verwendete Commit-ID wird vor Codeänderung in der Testevidenz festgehalten.
- Desktop: 1440×900; Mobile: 390×844; deterministischer Seed und identische Kameraposition je Vergleich.
- Die Galerie-Baseline darf eingefroren werden, auch wenn ihr separater AGDF-Run noch auf QA-Freigabe wartet; dies ist ein Vergleichspunkt, keine implizite QA- oder UAT-Anerkennung.

### GLASS-T-02 bis GLASS-T-04 — Materialprofile

- `createGlassMaterial` nimmt die vollständige `PieceDefinition` und die profilbezogene Environment entgegen; Farbe oder Dimensionen werden nicht in einer Parallelstruktur dupliziert.
- Unit-Tests prüfen die im SD festgelegten Parameterbereiche und explizit: WebGPU `opacity === 1`, Compatible ohne `transmission`, Compatible `envMap === galleryMaterials.environment`.
- Die Environment-Auflösung beträgt High 256×128 und Compatible 128×64. Die Texturdiagnostik und Budgetberechnung werden mitgeführt.
- Dispersion startet bei 0,03 und wird vollständig auf 0 gesetzt, sobald Performance oder direkte Sichtprüfung den SD-Exit auslöst; kein dritter Materialpfad entsteht.

### GLASS-T-05 — Geometrie

- Fasenradius: 3 % der kleinsten Dimension, geklemmt auf 0,015–0,045 Welteinheiten; Außenmaße dürfen pro Achse höchstens 0,5 % abweichen.
- Box- und Compoundsegmente verwenden eine wiederverwendbare Rounded-/Bevel-Geometrie mit niedriger Segmentzahl.
- Cylinder verwenden ein Profil mit schmaler gerundeter Randzone und höchstens 32 radialen Segmenten.
- Compoundsegmente werden vor dem Merge um ihre bestehenden Offsets transformiert. Genau ein renderbares Mesh wird dem Piece-Group hinzugefügt.

### GLASS-T-08 — Kontrastmetrik

Bei festem Seed wird der zentrale piece-bezogene ROI aus dem Canvas unmittelbar nach einem stabilen Renderframe in einen temporären 2D-Canvas kopiert. Der Test berechnet:

1. mittlere absolute Luminanzgradienten im Silhouettenband;
2. absolute Luminanz-/Chroma-Differenz zwischen innerem Piece-Bereich und äußerem Hintergrundring;
3. lokale Chroma-Varianz im inneren Bereich.

Für jedes ausführbare Profil gilt gegenüber seiner eingefrorenen Baseline:

- Silhouettengradient ≥ `max(6, baseline × 1,10)` auf einer 0–255-Luminanzskala;
- Innen/Außen-Differenz ≥ `max(5, baseline × 1,08)`;
- Chroma-Varianz ≥ `max(3, baseline × 0,95)`.

Der Vergleich ist ungültig, wenn Viewport, Seed, Backend, Kamerazustand oder ROI abweichen. Diese Metrik beweist keine echte WebGPU-Darstellung auf einem WebGL2-Host und ersetzt GLASS-T-10 nicht.

## 4. Testfälle

| Test ID | Ebene | Szenario | Erwartung |
|---|---|---|---|
| GLASS-UT-01 | Unit | `GlassOptics` für alle fünf Pieces | deterministisch, geklemmt, dünne und dicke Formen optisch verschieden |
| GLASS-UT-02 | Unit | High-Material | Physical, Transmission aktiv, `opacity=1`, Volumenfarbe/-tiefe und Dispersion im Bereich |
| GLASS-UT-03 | Unit | Compatible-Material | Standard-PBR, glaslokale Environment, Alpha/Rauheit im Bereich, keine Transmission |
| GLASS-UT-04 | Unit | Environment-Pixel und Diagnostik | helle und dunkle Karten vorhanden; 256/128 Breite; Bytebudget korrekt |
| GLASS-UT-05 | Unit | Render-only Geometrien | Außenmaßtoleranz, Fasen, Cylinderprofil, Compound genau ein Mesh |
| GLASS-UT-06 | Unit | Profilwechsel und Dispose | keine veraltete Environment-Referenz; jede Ressource genau einmal entsorgt |
| GLASS-E2E-01 | Browser | Start/Preview mit fünf Seeds/Farben | Silhouette, Farbe und Materialidentität je Profil sichtbar |
| GLASS-E2E-02 | Browser | Score 3 mit Überlagerung | drei Volumen und Reihenfolge getrennt erkennbar; Kontrastwächter besteht |
| GLASS-E2E-03 | Browser | Drop/Impact und High build | keine schwarzen Frames, Shaderausfälle oder Sortiersprünge; Galeriehierarchie stabil |
| GLASS-E2E-04 | Browser | Game over, drei Restarts, Reload | ein Canvas, eine Szene/Environment-Zuordnung, stabile Zähler, keine Fehler |
| GLASS-E2E-05 | Browser | Auto gegenüber Forced WebGL2 | gleiche Anker, Kamera, Formen, Steuerung, Score und Failure-Semantik |
| GLASS-PERF-01 | Browser | 20 Bodies Auto | p95 Work ≤ 33,3 ms; Ressourcen und Draw Calls im Budget |
| GLASS-PERF-02 | Browser | 20 Bodies Forced WebGL2 | p95 Work ≤ 33,3 ms; Ressourcen und Draw Calls im Budget |
| GLASS-UAT-01 | Direkt | Chrome mit bestätigtem WebGPU | gepaarte Zustände erfüllen GLASS-AC-01–08 und 10–12 ohne Console-Fehler |
| GLASS-UAT-02 | Direkt | Safari mit WebGL2 | gepaarte Zustände erfüllen GLASS-AC-01, 02, 04–12 ohne Console-Fehler |

## 5. Akzeptanzabdeckung

| PRD-Kriterium | Tasks | Tests / Evidenz |
|---|---|---|
| GLASS-AC-01 | T-01–T-04, T-08 | UT-01–04, E2E-01, UAT-01/02 |
| GLASS-AC-02 | T-04–T-08 | UT-05, E2E-02, UAT-01/02 |
| GLASS-AC-03 | T-03, T-07–T-10 | UT-02/04, E2E-01–03, PERF-01, UAT-01 |
| GLASS-AC-04 | T-04, T-07–T-10 | UT-03/04, E2E-01–03, PERF-02, UAT-02 |
| GLASS-AC-05 | T-02, T-05, T-07–T-10 | UT-01/05, E2E-01/02, UAT-01/02 |
| GLASS-AC-06 | T-02–T-04, T-08 | UT-01–03, E2E-01/03 |
| GLASS-AC-07 | T-06–T-10 | UT-06, E2E-03/04, UAT-01/02 |
| GLASS-AC-08 | T-02–T-09 | UT-01, E2E-05, Gameplay-Regression |
| GLASS-AC-09 | T-01, T-04, T-08–T-10 | UT-03, E2E-03/05, UAT-02 |
| GLASS-AC-10 | T-03–T-09 | UT-04–06, PERF-01/02 |
| GLASS-AC-11 | T-06–T-09 | UT-06, E2E-04 |
| GLASS-AC-12 | T-10 | UAT-01/02 und gepaarte Artefakte |

## 6. Auszuführende Befehle

Nach den fokussierten Tests werden mindestens ausgeführt:

```bash
npm run lint
npm run build
npm run test
npm run test:integration
npm run test:e2e
```

Fokussierte Vitest-/Playwright-Aufrufe dürfen während der Entwicklung früher laufen; die vollständigen Skripte sind für CD+Tests-Evidenz verbindlich. Fehlgeschlagene, übersprungene oder abgeschwächte Assertions gelten nicht als Pass.

## 7. Abbruch- und Rücksteuerungsregeln

- Änderung an Rendererwahl/Fallback, Physik, Katalogsemantik, UI oder Spielregeln: Stop und Rücksteuerung mindestens zu SD, bei geänderter Nutzerwirkung zu PRD.
- Zusätzlicher Renderpass, zweite transparente Hülle oder externe HDR-Abhängigkeit: Design Gap, Rücksteuerung zu SD.
- Nicht erfüllbare Kontrastschwelle ohne globale Galerieänderung: Requirements-/Design-Prüfung; keine globale Helligkeitskorrektur als Workaround.
- p95 Work > 33,3 ms: Dispersion zuerst deaktivieren und Environment-/Geometrieauflösung innerhalb des SD reduzieren; bleibt die Grenze verletzt, CD+Tests nicht abschließen.
- Echte WebGPU-Evidenz nicht verfügbar: automatisierte QA kann nur WebGL2-/Fallback-Anteile belegen; UAT bleibt offen.

## 8. Brownfield- und Reviewfolge nach TP-Freigabe

Nach `Approval: TP` ist zuerst die Implementation-Preparation Brownfield Analysis auszuführen. Erst bei Pass folgen GLASS-T-01 bis GLASS-T-09 als CD+Tests. Danach sind Task Plan Review, Clean Implementation Review und mandatory Code Review erforderlich, bevor der QA-Gate-Entscheid erstellt wird. GLASS-T-10 bleibt direkte UAT-Evidenz nach QA-Freigabe.

## Context Graph

- context_graph_impact: `none`
- context_graph_refs: none
- context_graph_reconciliation: `not_applicable`
- context_graph_required_action: `none`
- context_graph_gate_effect: `none`
- context_graph_evidence: Der Plan operationalisiert nur das genehmigte Material-SD und erzeugt keine neue übergreifende Wissensautorität.
