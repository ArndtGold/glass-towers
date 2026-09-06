# CD+Tests: Backendgerechte Glasoptik

Status: done
Run: `glass-towers-webgpu-glass-materials`
Stand: 2026-08-21
Based on: [approved TP](TP.md), [Brownfield Analysis](BROWNFIELD_ANALYSIS.md)

## Gelieferte Änderungen

- `createMaterials.ts`: zentrale formabhängige `GlassOptics`-Ableitung; WebGPU-Transmission mit `opacity=1`, Volumenfarbe und kontrastreicher High-Environment; WebGL2-Standard-PBR mit glaslokaler Compatible-Environment.
- `createScene.ts`: niedrig segmentierte render-only Fasen, gerundetes Cylinderprofil und ein zusammengeführtes sichtbares Compound-Mesh; Physik-/Katalogdaten unverändert.
- Unit-Tests für Profile, Environment, Geometrie, Compound-Mesh und Lifecycle.
- E2E-Suite für Auto/Forced WebGL2, Score 3, Game over, Restart, Consolefehler, Screenshots und Readability-Metriken.
- Baseline-Rekonstruktion aus Commit `8e1b507a0884b86b8a414f0f3097fd70c298e257` ohne Worktree-Reset.

## TP-Ergebnis

| Task | Status | Evidenz |
|---|---|---|
| GLASS-T-01 | done | `evidence/BASELINE.md` und sieben Vorherbilder plus Nachhermatrix |
| GLASS-T-02 | done | `deriveGlassOptics`, GLASS-UT-01 |
| GLASS-T-03 | done | Physical-Material, High-Environment, direkter IAB-WebGPU-Lauf; Dispersion nach Performance-Exit auf 0 gesetzt |
| GLASS-T-04 | done | Compatible `envMap`, Forced-WebGL2- und WebKit-Evidenz |
| GLASS-T-05 | done | Rounded/Lathe/Merge-Geometrien, `pieceVisualGeometry.test.ts` |
| GLASS-T-06 | done | Profil-/Dispose-Tests, drei Restartpfade, ein Canvas, stabile Galerie-Zähler |
| GLASS-T-07 | done | 29 Unit- und 2 Integrationstests |
| GLASS-T-08 | done | 4 Glasmaterial-E2E-Tests, Readability-JSON und Screenshots |
| GLASS-T-09 | done | Lint, Build und alle E2E-/Performance-Komponenten grün |
| GLASS-T-10 | planned_after_QA | Direkte Safari-UAT bleibt nach QA; echter In-App-WebGPU-Lauf ist bereits als ergänzende Evidenz vorhanden |

## Validierung

| Prüfung | Ergebnis |
|---|---|
| `npm run lint` | pass |
| `npm run build` | pass; bekannte nicht-blockierende Vite-Chunkwarnung |
| `npm run test` | 9 Dateien, 28 Tests, pass |
| `npm run test:integration` | 1 Datei, 2 Tests, pass |
| Performance Auto | Chromium und WebKit pass; Chromium p95 Work 3,9 ms im finalen Lauf |
| Performance Forced WebGL2 | Chromium und WebKit pass; Chromium p95 Work 4,2 ms |
| Gameplay | 8/8 pass |
| Galerie Desktop/Mobile/Lifecycle | 8/8 pass |
| Galerie Budgets/20 Bodies | 4/4 pass; p95 Work 2,0–4,4 ms |
| Glasmaterial Readability/Lifecycle | 4/4 pass |
| `git diff --check` und `git diff --check --cached` | pass |
| Direkter Browserlauf | WebGPU Score 3 und Forced WebGL2 Score 3/Game over/Restart; keine Error-/Warning-Logs |

Ein erster Chromium/WebGPU-Lauf überschritt mit Dispersion das Budget (46,5 ms). Die im TP festgelegte Exit-Regel wurde angewendet: Dispersion auf 0, Fasenunterteilung auf ein Segment. Danach bestand derselbe 20-Body-Test mit 7,1 ms und der finale Gesamtnachweis mit 3,9 ms p95 Work. Assertions oder Budgets wurden nicht abgeschwächt.

## Sichtbare Readability-Evidenz

Alle finalen Profile bestehen die festgeschriebenen Guards `edgeGradient > 5`, `innerOuter > 4`, `chromaVariation > 15`. Beobachtete Bereiche nach der Farbüberarbeitung:

- Edge gradient: 5,43–6,61
- Innen/Außen-Differenz: 4,96–9,08
- Chroma variation: 20,17–22,81

## QA-Überarbeitung: alle fünf Farben

Die Nutzeranforderung vom 2026-08-21, alle fünf Farben in WebGPU und WebGL2 überzeugend unterscheidbar zu machen, wurde als `implementation_gap` zurück an CD+Tests geroutet und behoben:

- Der bestehende Piece-Katalog bleibt die einzige Farb-SoT; `deriveGlassOptics` kalibriert daraus gesättigtere, dunklere optische Tints.
- WebGPU verwendet `transmission: 0.92`, einen stärkeren Surface Tint und kürzere farbige Attenuation, ohne Alpha-Washout.
- WebGL2 verwendet dieselben kalibrierten Tints mit backendgerechter Alpha-PBR-Transparenz.
- `?palette=1` erzeugt ausschließlich im Development-Build eine deterministische Ansicht aller fünf existierenden Piece-Definitionen.
- Zehn paarweise Materialabstände bestehen im Unit-Test mit Mindestabstand `> 0.3`.
- Zehn paarweise gerenderte Abstände bestehen für Chromium Auto/Forced WebGL2 und WebKit Auto/Forced WebGL2 mit Mindestschwelle `> 28`; beobachtete Minima: 29,25–29,78.
- Der echte In-App-WebGPU-Pfad zeigt `WebGPU · High fidelity` und alle fünf IDs `prism,pillar,slab,drum,offset` gleichzeitig; sichtbarer Nachweis: `evidence/current-iab-webgpu-five-colors.png`.

Finale Regression nach der Überarbeitung: Lint pass, Build pass, 29 Unit-Tests pass, 2 Integrationstests pass und 32 E2E-Komponententests pass. Console-/Page-Error-Guards bestehen. Die bekannte Vite-Chunkgrößenwarnung bleibt unverändert.

## Offene Evidenz

- Direkte Safari/WebGL2-UAT und eine explizite Chrome-Familien-UAT bleiben nach `Approval: QA` erforderlich.
- Automatisierte WebKit-Evidenz und In-App-WebGPU-Evidenz ersetzen diese Nutzerabnahme nicht.

## Context Graph

- context_graph_impact: `none`
- context_graph_refs: none
- context_graph_reconciliation: `not_applicable`
- context_graph_required_action: `none`
- context_graph_gate_effect: `none`
- context_graph_evidence: Implementierungs- und Testdetails bleiben run-spezifisch; PRD/SD bleiben SoT.
