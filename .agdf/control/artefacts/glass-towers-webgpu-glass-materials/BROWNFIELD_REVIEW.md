# Brownfield Review: WebGPU- und WebGL2-Glasmaterialien

Status: done
Run: `glass-towers-webgpu-glass-materials`
Stand: 2026-08-21
Mode: `post_ur_review`
Based on: [UR](UR.md)

## Entscheidung

- decision: `pass`
- mode_slice_decision: `structured_slice`
- required_next_gate: `PRD`
- scope: backendgerechte Verbesserung von Transmission, Reflexion, Farbtrennung und Kantenlesbarkeit innerhalb der bestehenden Renderarchitektur
- delivery_context: `brownfield`
- ui_ux_impact: `low`
- ui_ux_impact_reason: Die sichtbare Materialqualität ändert sich deutlich, aber Nutzerziel, Eingaben, Arbeitsmodi, Backendwahl, Status, Blocker und Recovery-Semantik bleiben unverändert.
- ux_intent_definition_required: `no`
- ux_intent_definition_status: `not_applicable`
- transparency: Quick Task und Verified Change sind zu schmal, weil zwei Backendprofile, Material-, Environment- und Rendergeometrie-Owner sowie direkte Hardwareevidenz gemeinsam abgestimmt werden müssen. Full Structured Delivery ist nicht erforderlich, da keine Autoritäts-, Persistenz-, externe Vertrags-, Deployment- oder Runtimegrenze verändert wird.
- missing_evidence: keine für die Pfadwahl; reale Vorher-/Nachher-Evidenz wird im späteren PRD/TP verbindlich.
- required_next_step: ein fokussiertes PRD für die gemeinsame sichtbare Qualitätsgrenze und backendgerechte Akzeptanzkriterien erstellen

## Bestehende Owner und Abdeckung

| Bereich | Bestehender Owner | Abdeckung | Strategie |
|---|---|---|---|
| Glasmaterialprofile | `src/game/rendering/createMaterials.ts::createGlassMaterial` | partially_done | `extend` |
| Lokale Reflexionsumgebung | `src/game/rendering/createMaterials.ts::createEnvironmentTexture` | partially_done | `extend` |
| Backendprofil und Environment-Aktivierung | `src/game/rendering/createScene.ts::configureRendererBackend` | partially_done | `extend` |
| Visuelle Piece-Geometrie | `src/game/rendering/createScene.ts::createPieceObject` | partially_done; harte Boxkanten ohne Fase | `refactor` innerhalb desselben Owners |
| Piece-Farben und Dimensionen | `src/game/pieces/catalog.ts` | fully_done als Eingabe | `reuse`; keine neue optische SoT im Katalog ohne SD-Entscheid |
| Rendererwahl und Fallback | `src/game/rendering/RendererFactory.ts` | fully_done | unverändert schützen |
| Material-/Lifecycle-Tests | `tests/unit/galleryMaterials.test.ts`, `tests/unit/galleryEnvironment.test.ts` | partially_done | `extend` |
| Browser-/Sichtevidenz | `tests/e2e/gallery.spec.ts`, Galerie-Evidenzordner | partially_done; echtes post-fix WebGPU fehlt | `extend` |

## Technische Befunde

- WebGPU nutzt `MeshPhysicalMaterial`, aber `transmission: 0.58` zusammen mit `opacity: 0.72`; der lokale Three.js-Vertrag verlangt bei Transmission Opacity 1.
- Alle fünf Piece-Formen teilen trotz unterschiedlicher Dimensionen dieselben Werte für `thickness` und `attenuationDistance`.
- WebGL2 nutzt `MeshStandardMaterial` mit `envMapIntensity: 0.72`; `configureRendererBackend` setzt `scene.environment` im Compatible-Profil jedoch auf `null`.
- Die vorhandene lokale Environment ist deterministisch, ressourcenarm und wiederverwendbar, enthält aber nur weiche Helligkeitsbänder.
- Box- und Compound-Geometrien besitzen Unterteilungen, aber keine visuell wirksamen Fasen; damit fehlen stabile Kantenhighlights vor der hellen Galerie.
- Rendererwahl, WebGPU-zu-WebGL2-Fallback, Physik, Collider, Piece-Sequenz und Spielzustand müssen nicht verändert werden.

## Minimaler sauberer Slice

1. Ein gemeinsames optisches Ziel mit zwei expliziten Profilen definieren: `high` für physikalische WebGPU-Transmission und `compatible` für performantes Standard-PBR in WebGL2.
2. Bestehende Environment-Erzeugung zu kontrastreichen Studio-Bändern erweitern und im SD entscheiden, ob Compatible-Reflexion szenenweit oder glaslokal gebunden wird.
3. Formdicke aus vorhandenen Dimensionen ableiten oder in einer einzigen Materialprofilfunktion normalisieren; keine zweite Piece-Konfiguration erzeugen.
4. Kleine render-only Fasen innerhalb des bestehenden Geometrieowners prüfen; Collider und Masse bleiben unverändert.
5. Gepaarte Auto-/Forced-WebGL2-Automation sowie direkte Chrome-WebGPU- und Safari-WebGL2-Bilder mit Überlagerungs-, Hochbau- und Performanceevidenz verlangen.

## Invarianten und Risiken

- `RendererFactory.ts` und die Fallbackentscheidung bleiben außerhalb des geplanten Produktdiffs.
- Es bleibt eine Szene, eine Environment-Zuordnung, ein Materialowner je Piece/Backend und ein Frame Loop.
- Kein Outline-Pass, keine transparente Zweithülle, kein zweiter Renderer und kein externer HDR-Loader.
- Eine szenenweite Compatible-Environment könnte Galerieoberflächen verändern; das SD muss den kleinsten Owner und gepaarte Regressionsevidenz festlegen.
- Transmission, Dispersion und transparente Überlagerungen können GPU-Kosten erhöhen; WebGPU und WebGL2 benötigen getrennte Budgets.
- Die Galerie-Revision bleibt bis zur direkten UAT die visuelle Baseline. Materialimplementierung darf diese Abnahme nicht rückwirkend als bestanden erscheinen lassen.

## Structured Depth Evidence

- depth_policy_version: 1
- depth_facts_status: `complete`
- primary_reason_code: `bounded_structured_slice`
- decisive_full_depth_triggers: none
- rejected_alternative: `quick_task` und `verified_change` sind wegen der kohärenten, aber owner- und backendübergreifenden sichtbaren Qualität samt Hardwareevidenz ungeeignet; `structured_delivery` ist mangels Full-Depth-Trigger überdimensioniert.
- missing_or_conflicting_facts: none
- depth_evidence_refs: `UR.md`, `src/game/rendering/createMaterials.ts`, `src/game/rendering/createScene.ts`, `src/game/pieces/catalog.ts`, `tests/unit/galleryMaterials.test.ts`, `tests/e2e/gallery.spec.ts`

| Check ID | Ergebnis | Evidenz |
|---|---|---|
| `coherent_outcome` | pass | ein sichtbares Ergebnis: lesbares, hochwertiges Glas in beiden vorhandenen Backendprofilen |
| `authority_boundary` | pass | bestehende Produkt-/Architektur-SoT und Owner bleiben erhalten; keine neue Trust-, Policy- oder Permission-Grenze |
| `owner_consumer_coordination` | pass | Material-, Scene-/Geometrie- und Testowner liegen innerhalb dieses Repository-Slices |
| `full_depth_impacts_absent` | pass | keine Architektur-, Persistenz-, Daten-, API-, CLI-, Release- oder Cross-Host-Änderung |
| `migration_propagation_bounded` | pass | keine Migration; Parameter, lokale Textur und Rendergeometrie sind lokal testbar und reversibel |
| `failure_recovery_local` | pass | Fallback bleibt unverändert; Rücknahme des Material-/Geometriediffs stellt den Ausgangszustand wieder her |
| `independently_acceptable` | pass | gepaarte Backendbilder, Überlagerungslesbarkeit und getrennte Performancebudgets bilden eine eigenständige Akzeptanzgrenze |

## Context Graph

- context_graph_impact: `none`
- context_graph_refs: none
- context_graph_reconciliation: `not_applicable`
- context_graph_required_action: `none`
- context_graph_gate_effect: `none`
- context_graph_evidence: Die Owner- und Risikobefunde sind run-spezifisch und werden in PRD/SD konkretisiert; keine wiederverwendbare projektweite Entscheidung ist bereits getroffen.

## Knowledge Persistence Decision

- memory_target: `scope_artifact`
- memory_reason: Brownfield-Befunde und Pfadwahl gelten für diesen Material-Slice.
- memory_refs: `BROWNFIELD_REVIEW.md`
