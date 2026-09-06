# Brownfield Analysis: Safari-WebGL2-Korrektur

- mode: pre_implementation_analysis
- decision: pass
- mode_slice_decision: structured_delivery
- required_next_gate: none
- artefact: `.agdf/control/artefacts/glass-towers/BROWNFIELD_ANALYSIS.md`
- scope: Freigegebene TP-Revision 2 für den begrenzten Renderer-Fallbackwechsel und die WebKit-Regression.

## Evidenz und bestehender Zustand

- evidence: `src/game/rendering/RendererFactory.ts` besitzt bereits Capability-Erkennung, Versuchsreihenfolge, stabile Frames, Backendstatus und Dispose; `GameRuntime` konsumiert nur `render`, `setSize` und `dispose`; Szene und Materialfamilie verwenden backendkompatible Three.js-Standardobjekte.
- current_coverage: partially_done; WebGPU, Chromium-WebGL2, Zustandsmaschine, Physik, UI, Input und bestehende Tests sind vorhanden. Nur der `WebGPURenderer(forceWebGL)`-Fallback ist in WebKit nachweislich defekt.
- existing_product_owner: freigegebenes `PRD.md`
- existing_architecture_owner: freigegebenes `SD.md` Revision 2
- existing_implementation_owner: `src/game/rendering/RendererFactory.ts`
- existing_test_owner: `tests/unit/rendererStrategy.test.ts`, `tests/e2e/gameplay.spec.ts`, `tests/e2e/performance.spec.ts` und `playwright.config.ts`
- reuse_strategy: replace innerhalb des bestehenden Fallback-Adapters; Factory, Session, Runtime, Szene, Materialien, Physik, Store, Input und UI werden weiterverwendet.

## Owner- und Änderungspfad

1. `RendererFactory.ts` verbreitert `GlassRenderer` auf einen schmalen Runtime-Vertrag und behält den einzigen Capability-/Fallback-Owner.
2. Der WebGPU-Adapter bleibt `WebGPURenderer`; der WebGL2-Adapter erzeugt explizit `canvas.getContext('webgl2')` und einen klassischen `WebGLRenderer`.
3. Fehlende WebGPU-Fähigkeit überspringt den WebGPU-Versuch; ein fehlgeschlagener Versuch wird vor genau einem WebGL2-Versuch disposed.
4. `GameRuntime` und `createSceneBundle` bleiben dieselben Verbraucher. Es entsteht kein zweiter Frame Loop, Store, Szenen- oder Physikpfad.
5. Deterministische Factory-Tests belegen Reihenfolge, Dispose, stabile Frames und Doppelfehler; Playwright WebKit belegt Auto-Fallback, Scoring, Failure und Restart ohne Konsolenfehler.

## Auswirkungen

- files_modules: `src/game/rendering/RendererFactory.ts`, zugehörige Renderer-Test-Seams, `tests/**`, `playwright.config.ts` und Testskripte.
- interfaces: `RendererSession.renderer` wird auf die bereits von `GameRuntime` genutzten Operationen begrenzt; `RendererStatus` und UI-Vertrag bleiben unverändert.
- data_model_migrations: none.
- backwards_compatibility: Chromium/WebGPU und Chromium/WebGL2 bleiben durch die bestehende Suite geschützt; WebKit erhält den klassischen WebGL2-Pfad.
- regression_tests: bestehende Unit-, Physik-, Gameplay- und Performance-Läufe plus WebKit-Fallbacklauf.
- side_effects: Ein WebGPU-Initialisierungsfehler kann weiterhin einmal intern abgefangen werden; erwarteter Fallback darf keine Konsolenfehler erzeugen.

## Risiken und Gegenmaßnahmen

- parallel_structure_risk: kontrolliert; zwei Rendereradapter liegen hinter einer Session und teilen Szene, Runtime und State.
- canvas_context_risk: Nach einem tatsächlich verlorenen WebGPU-Kontext kann derselbe Canvas eventuell keinen neuen Kontext liefern; fehlendes WebGPU wird deshalb vor Renderer-Erzeugung capability-basiert übersprungen, Doppelfehler bleibt sichtbar und begrenzt.
- type_surface_risk: `WebGPURenderer` und `WebGLRenderer` besitzen unterschiedliche konkrete Typen; die Session exponiert nur `render`, `setSize`, `setPixelRatio` und `dispose`.
- test_evidence_risk: Playwright WebKit ist Safari-nahe Evidenz, ersetzt aber keine zusätzliche manuelle Prüfung auf einem realen Safari-Gerät.
- sot_drift: none; Implementierung folgt SD und TP Revision 2.
- context_graph_impact: none
- context_graph_reconciliation: not_applicable

## Ergebnis

- transparency: Die Korrektur erweitert keine Produktsemantik. Sie ersetzt nur den nachweislich inkompatiblen Fallback-Adapter im kanonischen Renderer-Owner.
- missing_evidence: none für den Start von CD+Tests; reale Safari-Hardware bleibt spätere zusätzliche UAT-Evidenz.
- required_next_step: T-04, T-11 und T-12 aus TP Revision 2 implementieren, anschließend vollständige Regression und WebKit-Browserevidenz ausführen.
