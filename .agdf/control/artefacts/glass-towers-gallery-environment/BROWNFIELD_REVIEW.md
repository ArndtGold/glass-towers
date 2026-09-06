# Brownfield Review: Verfeinerte, vollstaendig gerenderte Galerieumgebung

Gate: Brownfield Review
Type: Brownfield Review
Mode: `post_ur_review`
Status: `done`

## Run

- run_id: `glass-towers-gallery-environment`
- related_ur: `.agdf/control/artefacts/glass-towers-gallery-environment/UR.md`
- current_gate: `PRD`
- reviewer: Codex
- reviewed_at: 2026-08-20

## Objective

Den freigegebenen visuellen Folgeumfang gegen die bestehende Glass-Towers-Szene, ihre Renderergrenzen, ihre Owner und ihre Testevidenz abgleichen und den kleinsten belastbaren Lieferweg bestimmen.

## UI / UX Impact Routing

- delivery_context: `brownfield`
- ui_ux_impact: `low`
- ui_ux_impact_reason: Die raeumliche und materielle Darstellung aendert sich deutlich, waehrend primaere Aktion, Arbeitsmodus, sichtbare Zustandsarten, Aktivierung, Blocker, Recovery und Spielsemantik unveraendert bleiben.
- ux_intent_definition_required: `no`
- ux_intent_definition_result: `not_applicable`

Die freigegebene UR beschreibt das Nutzerziel, die Lesbarkeitsgrenze und die beobachtbaren visuellen Signale ausreichend fuer einen begrenzten PRD-Slice. Eine separate UX Intent Definition wuerde keine zusaetzliche Zustands- oder Interaktionsentscheidung besitzen.

## Existing-System View

| Area | Existing owner or artefact | Evidence | Impact |
|---|---|---|---|
| Product semantics | Freigegebenes Glass-Towers-PRD plus neue UR | `artefacts/glass-towers/PRD.md`; neue `UR.md` | `low` |
| Source of truth | PRD besitzt Produktverhalten; SD besitzt Architektur und Renderergrenzen | `artefacts/glass-towers/PRD.md`; `artefacts/glass-towers/SD.md`; `SOT_REGISTRY.md` | `low` |
| Runtime path | `GameRuntime` erzeugt genau ein `SceneBundle` und rendert es ueber genau eine `RendererSession` | `src/game/runtime/GameRuntime.ts`; `src/game/rendering/RendererFactory.ts` | `low` |
| UI / UX | `createScene.ts` besitzt Kamera, Galeriegeometrie, Licht und Piece-Objekte; `createMaterials.ts` besitzt Materialfabriken | `src/game/rendering/createScene.ts`; `src/game/rendering/createMaterials.ts`; `src/app/styles.css` | `low` |
| Persistence / data | Nur der Bestwert wird persistiert; der Galerieumfang benoetigt keine Daten- oder Schemamigration | `src/game/persistence/BestScoreRepository.ts`; freigegebenes SD | `none` |
| Tests / QA | Playwright besitzt Chromium-/WebKit-Laeufe, Screenshots, Konsolenfehlerpruefung und 20-Body-Performanceprobe; spezifische Galeriequalitaetsevidenz fehlt noch | `tests/e2e/gameplay.spec.ts`; `tests/e2e/performance.spec.ts`; `playwright.config.ts` | `low` |
| Release / operations | Keine Hosting-, API-, Rollout- oder Deploymentaenderung angefordert | UR Nicht-Ziele; `package.json` | `none` |

## Current Coverage And Reuse Strategy

- current_coverage: `partially_done`
- reuse_strategy: `extend` fuer das bestehende `SceneBundle`, `refactor` fuer die schmale Galerie-Materialfabrik, `extend` fuer bestehende Browser- und Performanceevidenz.
- Bereits vorhanden: zentraler Sockel, Boden, Kamera, Fog, Studioleuchten, gemeinsame Geometrie-/Material-Caches, ein Dispose-Pfad und capability-basierte Rendererqualitaet.
- Fehlend: raeumlich geschlossene Galeriearchitektur, verfeinerte Silhouetten/Kanten, differenzierte Umgebungsoberflaechen, explizite Shaderqualitaetsstufen sowie Galerie-spezifische sichtbare Evidenz.
- Minimaler sauberer Pfad: vorhandene Szenen- und Material-Owner erweitern; die existierende RendererSession und den einzigen Frame Loop unveraendert wiederverwenden.

## Reuse And Parallel-Structure Risk

| Finding | Evidence | Risk | Required action |
|---|---|---|---|
| Ein `SceneBundle` ist bereits kanonischer Szenen-Owner | `GameRuntime.start()` ruft genau einmal `createSceneBundle()` auf | `block` bei zweiter Szene | Galerie innerhalb dieses Bundles modellieren; keine separate Hintergrundszene oder Compositing-Schleife einfuehren. |
| Geometrien und Materialien werden bereits geteilt und gemeinsam disposed | Maps und `dispose()` in `createScene.ts` | `warn` | Neue Galeriegeometrien und Materialien in dieselben Lebenszyklus-Owner integrieren. |
| Rendererqualitaet ist bereits als `high | compatible` vorhanden | `RendererFactory.ts`; freigegebenes SD | `warn` | Shader-/Schattenabstufung aus dem bestehenden Backendstatus ableiten, keinen dritten Renderer- oder Szenenmodus schaffen. |
| Kamera-Follow und Frame Loop gehoeren `GameRuntime` | `GameRuntime.frame()` | `warn` | Nur erforderliche Kompositionsparameter erweitern; keine zweite Kameraanimation oder Rendersteuerung etablieren. |
| Aktuell existieren keine Laufzeit-Assets im `public`-Pfad | Repositoryinventar vom 2026-08-20 | `warn` | Prozedurale oder lokal gebuendelte Ressourcen bevorzugen und eine spaetere Assetentscheidung explizit im SD besitzen lassen. |
| Vorherige Safari-Fallbackaenderungen sind im Worktree noch uncommittet | `git diff --name-only` | `warn` | Deren Pfade und Evidenz unveraendert erhalten und diesen Slice spaeter selektiv abgrenzen. |

## Mode / Slice Decision

- decision: `structured_slice`
- required_next_gate: `PRD`
- scope_reason: `bounded_structured_slice`; ein zusammenhaengendes visuelles Ergebnis kann innerhalb bestehender Szene-, Material-, Runtime- und Testowner lokal und reversibel geliefert werden. Quick Task und Verified Change sind wegen neuer Produktsemantik, mehrerer kanonischer Owner und benoetigter sichtbarer Browser-/Performanceevidenz nicht zulaessig; Full Structured Delivery ist mangels Architektur-, Persistenz-, externer Vertrags-, Release- oder Koordinationswirkung nicht erforderlich.
- evidence: freigegebene `UR.md`; `src/game/rendering/createScene.ts`; `src/game/rendering/createMaterials.ts`; `src/game/runtime/GameRuntime.ts`; `src/game/rendering/RendererFactory.ts`; bestehende Playwright-Suites
- transparency_note: Der volle Gatepfad bleibt erhalten, aber PRD, SD und TP werden auf die abgegrenzte Galeriekomposition, Material-/Shaderqualitaet, Rendererabstufung und ihre Evidenz beschraenkt.

## Structured Depth Evidence

- depth_policy_version: `1`
- depth_facts_status: `complete`
- primary_reason_code: `bounded_structured_slice`
- decisive_full_depth_triggers: none
- rejected_alternative: `structured_delivery`; keine Autoritaets-, Sicherheits-, Runtime-, Persistenz-, externe Vertrags-, Release- oder ungebundene Koordinationsgrenze aendert sich. `quick_task` und `verified_change` wurden vor der strukturierten Einordnung ebenfalls verworfen.
- missing_or_conflicting_facts: none
- depth_evidence_refs: freigegebene UR; bestehendes PRD/SD; `createScene.ts`; `createMaterials.ts`; `GameRuntime.ts`; `RendererFactory.ts`; Browser- und Performancetests; aktueller Git-Pfadstatus

| check_id | result | evidence |
|---|---|---|
| coherent_outcome | `pass` | Ein klar abgegrenztes Ergebnis: dieselbe Spielszene wirkt als hochwertige, vollstaendig gerenderte 3D-Galerie mit beobachtbaren Qualitaets- und Lesbarkeitssignalen. |
| authority_boundary | `pass` | Produktintent bleibt in PRD/UR; Szene, Materialien, Runtime und Renderer behalten ihre bestehenden Owner; keine neue Trust-, Policy- oder Sicherheitsgrenze. |
| owner_consumer_coordination | `pass` | Betroffene Owner und Konsumenten liegen in derselben SPA und koennen ohne externen Cutover gemeinsam getestet werden. |
| full_depth_impacts_absent | `pass` | Keine Architektur-, Runtime-, Persistenz-, Daten-, API-, CLI-, Release- oder Cross-Host-Wirkung ausserhalb des begrenzten Render-Slice. |
| migration_propagation_bounded | `pass` | Keine Datenmigration; Quell- und Testaenderungen sind lokal baubar, browserpruefbar und per selektivem Revert rueckgaengig. |
| failure_recovery_local | `pass` | Bestehende Renderer-Fehler- und Retry-Semantik bleibt unveraendert; visuelle Qualitaetsstufen koennen lokal auf bestehende Materialien und Geometrie begrenzt werden. |
| independently_acceptable | `pass` | Galeriequalitaet, Lesbarkeit, Rendererparitaet, mobile Ansicht und Performance besitzen eigenstaendige sichtbare und automatisierte Akzeptanzsignale. |

## PRD / SD Open Questions

| Question | Required gate | Impact |
|---|---|---|
| Welche architektonischen Elemente und Tiefenhinweise muessen aus der festen Spielkamera sichtbar sein, damit die Szene nicht mehr wie eine Kulisse wirkt? | `PRD` | `warn` |
| Welche Kontrast-, Material- und Kompositionsgrenzen sichern die Lesbarkeit von Glas, Sockel und Turm ueber Desktop und Mobil? | `PRD` | `warn` |
| Welche Geometrie-, Material-, Shader-, Schatten- und Reflexionsstufen gelten fuer WebGPU und WebGL2? | `SD` | `warn` |
| Sind ausschliesslich prozedurale/lokal gebuendelte Ressourcen zulaessig und wie werden sie gecacht und disposed? | `SD` | `warn` |
| Welche Viewports, Screenshotzustaende und p95-Arbeitsbudgets bilden die Abnahmeevidenz? | `TP` | `warn` |

## Context Graph Impact

- context_graph_impact: `none`
- context_graph_refs: none
- context_graph_required_action: `none`
- context_graph_gate_effect: `none`
- context_graph_evidence: Die Ergebnisse sind run-spezifische Routing- und Reuse-Entscheidungen; sie aendern weder einen repositoryweiten Owner noch eine wiederverwendbare Querschnittsinvariante.

## Next Permissible Step

- next_allowed_action: Ein begrenztes PRD fuer Galeriecharakter, raeumliche Lesbarkeit, Rendererparitaet und messbare Akzeptanzsignale entwerfen.
- forbidden_until_then: SD, TP, Implementierung, QA, Release und jede Vermischung mit dem vorherigen Safari-Commitumfang.

## Quality Outlook

- quality_outlook: Subjektive Galeriequalitaet in wenige beobachtbare Kompositions-, Material-, Viewport- und Performancekriterien uebersetzen, bevor technische Shaderentscheidungen getroffen werden.
