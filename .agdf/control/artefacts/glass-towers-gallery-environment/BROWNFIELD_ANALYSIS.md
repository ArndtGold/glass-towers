# Brownfield Analysis: Galerieumgebung vor Implementierung

Mode: `pre_implementation_analysis`
Decision: `pass`
Run: `glass-towers-gallery-environment`
Date: 2026-08-20
Based on: approved [TP](TP.md), approved [SD](SD.md), [Brownfield Review](BROWNFIELD_REVIEW.md)

## Scope

T-GAL-01 prüft unmittelbar vor CD+Tests die vorhandenen Owner, den tatsächlichen Worktree, die Three.js-`0.185.1`-Fähigkeiten, die geplanten Testpfade und die Trennung vom vorherigen Safari-Run.

## Existing-System Evidence

| Bereich | Beobachtete Evidenz | Bewertung |
|---|---|---|
| Szene | `createScene.ts` besitzt genau ein `SceneBundle`, eine Kamera, einen `worldRoot`, Geometrie-/Materialmaps und Dispose | `partially_done`; sauber erweiterbar |
| Material | `createMaterials.ts` besitzt Galerie- und Glasmaterialfabriken | `partially_done`; innerhalb desselben Owners refaktorierbar |
| Runtime | `GameRuntime.start()` erzeugt genau ein SceneBundle und eine RendererSession; ein Frame Loop besitzt Rendering und Kamera-Follow | `fully_done` als zu erhaltende Grenze |
| Renderer | `RendererFactory.ts` besitzt WebGPU-Preflight und klassischen WebGL2-Fallback | `fully_done`; für diesen Slice geschützt und unverändert |
| Physik/Zustand | Rapier und GameStore besitzen Kollision, Stabilisierung, Score, Game over und Restart | `fully_done`; nicht betroffen |
| Browser | Chromium-/WebKit-Projekte, Gameplay- und Performance-Suites bestehen | `partially_done`; neue Galerie-Suites werden separat ergänzt |
| Ressourcen | Keine Galerie-Laufzeitassets im `public`-Pfad; Three.js liefert benötigte PBR-Materialien und `RoundedBoxGeometry` | `partially_done`; lokale/prozedurale Ressourcen erforderlich |

## Worktree Baseline And Isolation

Baseline `git status --porcelain=v1 --untracked-files=all`:

```text
 M playwright.config.ts
 M src/game/rendering/RendererFactory.ts
 M tests/e2e/gameplay.spec.ts
 M tests/e2e/performance.spec.ts
AM tests/unit/rendererFactory.test.ts
```

Geschützte Diff-Fingerprints:

| Pfad | Worktree-Diff-Hash | Index-Diff-Hash |
|---|---|---|
| `playwright.config.ts` | `3cb85f543e37529e3a08f27cfedf35053a1febaf` | `e69de29bb2d1d6434b8b29ae775ad8c2e48c5391` |
| `src/game/rendering/RendererFactory.ts` | `3025247b4085e24e1a550a10cf79a623203d0cfe` | `e69de29bb2d1d6434b8b29ae775ad8c2e48c5391` |
| `tests/e2e/gameplay.spec.ts` | `4ee71a609e217584774fbf4d46cf64b349898c6d` | `e69de29bb2d1d6434b8b29ae775ad8c2e48c5391` |
| `tests/e2e/performance.spec.ts` | `a9fae221ae7fab6d8b7729c0d607c09f5207aea3` | `e69de29bb2d1d6434b8b29ae775ad8c2e48c5391` |
| `tests/unit/rendererFactory.test.ts` | `dc471df8189a2701beae371e122c043783db396b` | `95ae8d70678703919749d4b66ec8422f2034a88d` |

`createScene.ts`, `createMaterials.ts`, `GameRuntime.ts`, `config.ts` und `package.json` sind am Implementierungsbaseline sauber. Die geplanten neuen Galerie-Dateien existieren noch nicht. Damit ist eine isolierte Umsetzung möglich, solange die fünf Fingerprints unverändert bleiben.

## Reuse Strategy

- `extend`: vorhandenes `SceneBundle`, Kamera, World-Root und Runtime-Lifecycle.
- `refactor`: bestehende schmale Galerie-Materialfabrik zu datengetriebenen PBR-Profilen innerhalb desselben Owners.
- `new`: untergeordneter reiner `createGalleryEnvironment`-Builder und isolierte Galerie-Testdateien.
- `replace`: ausschließlich die aktuelle Plane-Rückwand und groben Paneel-Meshes innerhalb des bestehenden Scene Graphs.
- `reuse`: bestehende Rendererstatus-, Stress-Fixture-, Input-, Physik-, Score-, Restart- und Browserprojektpfade.

## Interface And Regression Impact

| Schnittstelle | Geplante Änderung | Regressiongrenze |
|---|---|---|
| `SceneBundle` | Backendkonfiguration und Galerie-Diagnostik ergänzen | Bestehende Felder und Piece-Erzeugung bleiben kompatibel |
| `GameRuntime.start()` | Nach erfolgreicher Rendererwahl einmalig Galerieprofil aktivieren | Reihenfolge Renderer → Physik → State → Input → Frame Loop bleibt erhalten |
| Materialfabrik | Neue Galerieprofile und lokale Texturen | Bestehende `createGlassMaterial()`-Semantik bleibt erhalten |
| Scene Graph | Plane-Backdrop ersetzen, Galeriegruppe ergänzen | Pedestal-TopY, Piece-Positionen und PhysicsWorld unverändert |
| npm scripts | Neue Galerie-Suites ergänzen | Bestehende Testbefehle und geschützte Spec-Dateien bleiben erhalten |

Keine API-, Persistenz-, Datenmodell-, Migrations-, Sicherheits-, Authentifizierungs-, Deployment- oder externe Vertragswirkung.

## Parallel-Structure And Integrity Checks

- Zweite Szene: nicht erforderlich und verboten; Builder liefert nur eine Gruppe an `SceneBundle`.
- Zweiter Frame Loop: nicht erforderlich und verboten; Galerie ist statisch und wird im bestehenden Renderpfad gezeichnet.
- Dual-Shader: nicht erforderlich und verboten; dieselben Three.js-PBR-Materialklassen werden profilbasiert konfiguriert.
- Zweiter Produktzustand: nicht erforderlich; Qualitätsprofil leitet sich einmalig aus dem bestehenden Rendererstatus ab.
- Physikparallelität: nicht erforderlich; Galerie bleibt render-only.
- Ressourcenowner: `SceneBundle.dispose()` bleibt der einzige finale Owner; Builder gibt Ownership zurück.
- Sichtbare Zustandsautorität: Canvas zeigt Galerie; AppShell und GameStore behalten Status, Recovery und Aktionen.

## Test Impact

- Neue Unit-Dateien decken Galerieaufbau, Materialdeterminismus, Qualitätsprofile, Budgets und Dispose ab.
- Neue E2E-Dateien decken sichtbare Galerie, Backendparität, Mobilansicht, Lifecycle, Netzwerk und Performance ab.
- Geschützte vorhandene Tests werden nicht editiert und müssen vollständig grün bleiben.
- `package.json` darf neue Suites in den Gesamtlauf aufnehmen, ohne einen vorhandenen Test zu entfernen.

## Risks

| Risiko | Wirkung | Kontrolle |
|---|---|---|
| Geschützter Pfad ändert sich | `block` | Fingerprints nach Implementierung erneut vergleichen |
| PBR-/Lichtdetail verhält sich backendverschieden | `warn/revise` | Gleiche Komposition, gepaarte Screenshots und explizite Compatible-Profile |
| Material-/Geometriekosten überschreiten Budget | `block` | Deterministische Ressourcenlimits und 20-Body-p95-Test |
| Visuelle Qualität bleibt subjektiv | `revise` | Strukturbelege plus festgelegte Screenshotmatrix und direkte UAT |
| Echte WebGPU-/Safari-Hardware nicht automatisierbar | `warn` bis UAT | Automatisierte Auto-/WebGL2-Evidenz vollständig halten; direkte UAT separat |

## Context Graph Impact

- context_graph_impact: `none`
- context_graph_refs: none
- context_graph_reconciliation: `not_applicable`
- context_graph_required_action: `none`
- context_graph_gate_effect: `none`
- context_graph_evidence: Die wiederverwendbaren Produkt- und Architekturentscheidungen sind bereits im SOT Registry über freigegebenes PRD/SD verankert; Baseline und Implementierungsweg sind run-spezifische Evidenz.

## Decision

- decision: `pass`
- missing_evidence: none für den Start von CD+Tests
- current_coverage: `partially_done`
- reuse_strategy: vorhandene Owner erweitern, Materialfabrik lokal refaktorieren, nur Builder und isolierte Tests neu anlegen
- required_next_step: T-GAL-02 bis T-GAL-12 innerhalb des genehmigten Pfadsatzes implementieren und die geschützten Fingerprints unverändert halten.
